import {
    LinxioApiError,
    LinxioConfigurationError,
    LinxioNetworkError,
    LinxioTimeoutError,
} from "./errors";
import { appendQueryParams, normalisePath } from "./params";
import type { JsonValue, QueryParams } from "./types/common";

/** Fetch-compatible function used by the SDK HTTP layer. */
export type FetchLike = (
    input: RequestInfo | URL,
    init?: RequestInit,
) => Promise<Response>;

/** HTTP methods accepted by {@link HttpClient.request}. */
export type HttpMethod =
    | "DELETE"
    | "GET"
    | "HEAD"
    | "OPTIONS"
    | "PATCH"
    | "POST"
    | "PUT";

/** Response parser to use for a request. Defaults to JSON. */
export type ResponseType = "arrayBuffer" | "blob" | "json" | "raw" | "text";

/** Retry policy for Linxio requests. */
export type RetryOptions = {
    /** Initial backoff delay in milliseconds. Set to `0` in tests. */
    delayMs?: number;
    /** Maximum exponential backoff delay. */
    maxDelayMs?: number;
    /** Retry POST/PATCH/PUT/DELETE requests. Defaults to false. */
    retryUnsafeMethods?: boolean;
    /** Number of retries after the first attempt. Defaults to 3. */
    retries?: number;
};

/** Per-request options accepted by the low-level HTTP client. */
export type LinxioHttpRequestOptions = {
    /** Request body for mutation methods. Objects are JSON encoded. */
    body?: unknown;
    /** Additional request headers. */
    headers?: HeadersInit;
    /** Optional idempotency key for caller-managed retry safety. */
    idempotencyKey?: string;
    /** Query parameters to append to the request URL. */
    params?: QueryParams;
    /** Response parser override. */
    responseType?: ResponseType;
    /** Abort signal for caller-managed cancellation. */
    signal?: AbortSignal;
    /** Skip the bearer token for this request. */
    skipAuth?: boolean;
    /** Skip automatic refresh handling for this request. */
    skipAuthRefresh?: boolean;
    /** Override the client timeout for this request. */
    timeoutMs?: number;
};

/** Constructor configuration for {@link HttpClient}. */
export type LinxioHttpConfig = {
    /** REST API base URL. */
    baseUrl?: string;
    /** Fetch implementation. Defaults to `globalThis.fetch`. */
    fetch?: FetchLike;
    /** Refresh-token provider used for automatic 401 recovery. */
    getRefreshToken?: () => string | undefined;
    /** JWT provider used to set the Authorization header. */
    getToken?: () => string | undefined;
    /** Called when the SDK receives a fresh token from `/token/refresh`. */
    onSession?: (session: {
        expireAt?: string;
        refreshToken?: string;
        token?: string;
    }) => void;
    /** Retry policy for idempotent requests. */
    retry?: RetryOptions;
    /** Default timeout in milliseconds. */
    timeoutMs?: number;
};

type RefreshResponse = {
    expireAt?: string;
    refreshToken?: string;
    token?: string;
};

const DEFAULT_BASE_URL = "https://api.linxio.com/api";
const DEFAULT_TIMEOUT_MS = 30_000;
const IDEMPOTENT_METHODS = new Set<HttpMethod>(["GET", "HEAD", "OPTIONS"]);

/**
 * Low-level fetch-based Linxio HTTP client.
 *
 * Domain services use this class internally. It is exported for advanced
 * scripts that need custom endpoints while retaining auth headers, timeouts,
 * idempotent retries, parsed API errors, and automatic token refresh.
 */
export class HttpClient {
    /** Normalized REST API base URL without a trailing slash. */
    readonly baseUrl: string;

    private readonly fetcher: FetchLike;
    private readonly getRefreshToken: () => string | undefined;
    private readonly getToken: () => string | undefined;
    private readonly onSession?: LinxioHttpConfig["onSession"];
    private readonly retry: Required<RetryOptions>;
    private readonly timeoutMs: number;
    private refreshInFlight?: Promise<void>;

    constructor(config: LinxioHttpConfig = {}) {
        this.baseUrl = trimTrailingSlash(config.baseUrl ?? DEFAULT_BASE_URL);
        this.fetcher = config.fetch ?? getGlobalFetch();
        this.getToken = config.getToken ?? (() => undefined);
        this.getRefreshToken = config.getRefreshToken ?? (() => undefined);
        this.onSession = config.onSession;
        this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        this.retry = {
            delayMs: config.retry?.delayMs ?? 1_000,
            maxDelayMs: config.retry?.maxDelayMs ?? 8_000,
            retries: config.retry?.retries ?? 3,
            retryUnsafeMethods: config.retry?.retryUnsafeMethods ?? false,
        };
    }

    /** Send a GET request. */
    get<TResponse = unknown>(
        path: string,
        options: LinxioHttpRequestOptions = {},
    ): Promise<TResponse> {
        return this.request<TResponse>("GET", path, options);
    }

    /** Send a POST request. */
    post<TResponse = unknown>(
        path: string,
        body?: unknown,
        options: LinxioHttpRequestOptions = {},
    ): Promise<TResponse> {
        return this.request<TResponse>("POST", path, { ...options, body });
    }

    /** Send a PATCH request. */
    patch<TResponse = unknown>(
        path: string,
        body?: unknown,
        options: LinxioHttpRequestOptions = {},
    ): Promise<TResponse> {
        return this.request<TResponse>("PATCH", path, { ...options, body });
    }

    /** Send a PUT request. */
    put<TResponse = unknown>(
        path: string,
        body?: unknown,
        options: LinxioHttpRequestOptions = {},
    ): Promise<TResponse> {
        return this.request<TResponse>("PUT", path, { ...options, body });
    }

    /** Send a DELETE request. */
    delete<TResponse = unknown>(
        path: string,
        options: LinxioHttpRequestOptions = {},
    ): Promise<TResponse> {
        return this.request<TResponse>("DELETE", path, options);
    }

    /** Send a request with an arbitrary HTTP method. */
    async request<TResponse = unknown>(
        method: HttpMethod,
        path: string,
        options: LinxioHttpRequestOptions = {},
    ): Promise<TResponse> {
        return this.requestWithRefresh<TResponse>(method, path, options, false);
    }

    /** Build the final request URL, including query parameters. */
    buildUrl(path: string, params?: QueryParams): URL {
        const normalisedPath = normalisePath(path);
        const url = /^https?:\/\//i.test(normalisedPath)
            ? new URL(normalisedPath)
            : new URL(`${this.baseUrl}${normalisedPath}`);

        return appendQueryParams(url, params);
    }

    private async requestWithRefresh<TResponse>(
        method: HttpMethod,
        path: string,
        options: LinxioHttpRequestOptions,
        hasRefreshed: boolean,
    ): Promise<TResponse> {
        const response = await this.sendWithRetries(method, path, options);

        if (
            response.status === 401 &&
            !hasRefreshed &&
            !options.skipAuth &&
            !options.skipAuthRefresh &&
            this.getRefreshToken() &&
            !isRefreshOrLoginPath(path)
        ) {
            await this.refreshSession();
            return this.requestWithRefresh<TResponse>(
                method,
                path,
                options,
                true,
            );
        }

        return this.parseResponse<TResponse>(
            response,
            method,
            path,
            options.responseType,
        );
    }

    private async refreshSession(): Promise<void> {
        if (this.refreshInFlight) {
            return this.refreshInFlight;
        }

        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            return;
        }

        this.refreshInFlight = (async () => {
            const response = await this.sendOnce("POST", "/token/refresh", {
                body: { refreshToken },
                skipAuthRefresh: true,
            });
            const parsed = await this.parseResponse<RefreshResponse>(
                response,
                "POST",
                "/token/refresh",
                "json",
            );

            if (!parsed.token) {
                throw new LinxioApiError(
                    "Linxio token refresh did not return a token.",
                    {
                        body: parsed,
                        method: "POST",
                        path: "/api/token/refresh",
                        status: response.status,
                        statusText: response.statusText,
                    },
                );
            }

            this.onSession?.({
                expireAt: parsed.expireAt,
                refreshToken: parsed.refreshToken ?? refreshToken,
                token: parsed.token,
            });
        })();

        try {
            await this.refreshInFlight;
        } finally {
            this.refreshInFlight = undefined;
        }
    }

    private async sendWithRetries(
        method: HttpMethod,
        path: string,
        options: LinxioHttpRequestOptions,
    ): Promise<Response> {
        const shouldRetry = this.shouldRetryMethod(method);
        const maxAttempts = shouldRetry ? this.retry.retries + 1 : 1;
        let lastNetworkError: unknown;

        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
            try {
                const response = await this.sendOnce(method, path, options);
                if (
                    attempt < maxAttempts - 1 &&
                    shouldRetry &&
                    isRetriableStatus(response.status)
                ) {
                    await sleep(this.delayForAttempt(attempt), options.signal);
                    continue;
                }

                return response;
            } catch (error) {
                lastNetworkError = error;
                if (error instanceof LinxioTimeoutError) {
                    throw error;
                }

                if (attempt >= maxAttempts - 1 || !shouldRetry) {
                    break;
                }

                await sleep(this.delayForAttempt(attempt), options.signal);
            }
        }

        throw new LinxioNetworkError(
            "Linxio request failed before a response was received.",
            {
                cause: lastNetworkError,
                method,
                path: this.pathForError(path),
            },
        );
    }

    private async sendOnce(
        method: HttpMethod,
        path: string,
        options: LinxioHttpRequestOptions,
    ): Promise<Response> {
        const timeoutMs = options.timeoutMs ?? this.timeoutMs;
        const timeoutController = new AbortController();
        const timeout = setTimeout(() => timeoutController.abort(), timeoutMs);
        const signal = combineSignals(options.signal, timeoutController.signal);

        try {
            return await this.fetcher(this.buildUrl(path, options.params), {
                body: prepareBody(method, options.body),
                headers: this.prepareHeaders(options),
                method,
                signal,
            });
        } catch (error) {
            if (timeoutController.signal.aborted) {
                throw new LinxioTimeoutError(
                    `Linxio request timed out after ${timeoutMs}ms.`,
                    {
                        cause: error,
                        method,
                        path: this.pathForError(path),
                    },
                );
            }

            throw error;
        } finally {
            clearTimeout(timeout);
        }
    }

    private prepareHeaders(options: LinxioHttpRequestOptions): Headers {
        const headers = new Headers(options.headers);

        if (!options.skipAuth) {
            const token = this.getToken();
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
        }

        if (options.idempotencyKey) {
            headers.set("Idempotency-Key", options.idempotencyKey);
        }

        if (options.body !== undefined && shouldUseJsonBody(options.body)) {
            headers.set("Content-Type", "application/json");
        }

        if (!headers.has("Accept")) {
            headers.set("Accept", "application/json");
        }

        return headers;
    }

    private async parseResponse<TResponse>(
        response: Response,
        method: HttpMethod,
        path: string,
        responseType: ResponseType = "json",
    ): Promise<TResponse> {
        if (response.status === 204) {
            return undefined as TResponse;
        }

        if (!response.ok) {
            const body = await parseErrorBody(response);
            throw new LinxioApiError(errorMessage(response, body), {
                body,
                headers: response.headers,
                method,
                path: this.pathForError(path),
                requestId: response.headers.get("X-Request-Id") ?? undefined,
                status: response.status,
                statusText: response.statusText,
            });
        }

        if (responseType === "raw") {
            return response as TResponse;
        }

        if (responseType === "text") {
            return (await response.text()) as TResponse;
        }

        if (responseType === "blob") {
            return (await response.blob()) as TResponse;
        }

        if (responseType === "arrayBuffer") {
            return (await response.arrayBuffer()) as TResponse;
        }

        const text = await response.text();
        if (!text) {
            return undefined as TResponse;
        }

        return JSON.parse(text) as TResponse;
    }

    private shouldRetryMethod(method: HttpMethod): boolean {
        return this.retry.retryUnsafeMethods || IDEMPOTENT_METHODS.has(method);
    }

    private delayForAttempt(attempt: number): number {
        if (this.retry.delayMs === 0) {
            return 0;
        }

        return Math.min(
            this.retry.delayMs * 2 ** attempt,
            this.retry.maxDelayMs,
        );
    }

    private pathForError(path: string): string {
        const url = this.buildUrl(path);
        return `${url.pathname}${url.search}`;
    }
}

function trimTrailingSlash(value: string): string {
    return value.replace(/\/+$/, "");
}

function getGlobalFetch(): FetchLike {
    if (typeof globalThis.fetch !== "function") {
        throw new LinxioConfigurationError(
            "No fetch implementation is available. Pass `fetch` to createClient() or run on Node.js 20+.",
        );
    }

    return globalThis.fetch.bind(globalThis);
}

function isRefreshOrLoginPath(path: string): boolean {
    return path === "/login" || path === "/token/refresh";
}

function isRetriableStatus(status: number): boolean {
    return status === 408 || status === 425 || status === 429 || status >= 500;
}

function prepareBody(method: HttpMethod, body: unknown): BodyInit | undefined {
    if (method === "GET" || method === "HEAD" || body === undefined) {
        return undefined;
    }

    if (!shouldUseJsonBody(body)) {
        return body as BodyInit;
    }

    return JSON.stringify(body satisfies JsonValue | unknown);
}

function shouldUseJsonBody(body: unknown): boolean {
    return !(
        typeof body === "string" ||
        body instanceof ArrayBuffer ||
        body instanceof Blob ||
        body instanceof FormData ||
        body instanceof URLSearchParams
    );
}

async function parseErrorBody(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) {
        return undefined;
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

function errorMessage(response: Response, body: unknown): string {
    if (typeof body === "object" && body !== null) {
        const record = body as Record<string, unknown>;
        const message = record.message ?? record.error;
        if (typeof message === "string" && message.trim()) {
            return message;
        }
    }

    return `Linxio API request failed with ${response.status} ${response.statusText}`.trim();
}

function combineSignals(
    originalSignal: AbortSignal | undefined,
    timeoutSignal: AbortSignal,
): AbortSignal {
    if (!originalSignal) {
        return timeoutSignal;
    }

    if (originalSignal.aborted) {
        return originalSignal;
    }

    const controller = new AbortController();
    const abort = () => controller.abort();

    originalSignal.addEventListener("abort", abort, { once: true });
    timeoutSignal.addEventListener("abort", abort, { once: true });

    return controller.signal;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
    if (ms === 0) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const timeout = setTimeout(resolve, ms);
        signal?.addEventListener(
            "abort",
            () => {
                clearTimeout(timeout);
                reject(new LinxioNetworkError("Linxio request was aborted."));
            },
            { once: true },
        );
    });
}
