// src/errors.ts
var LinxioError = class extends Error {
  cause;
  method;
  path;
  requestId;
  constructor(message, context = {}) {
    super(message);
    this.name = "LinxioError";
    this.cause = context.cause;
    this.method = context.method;
    this.path = context.path;
    this.requestId = context.requestId;
  }
};
var LinxioConfigurationError = class extends LinxioError {
  constructor(message, context = {}) {
    super(message, context);
    this.name = "LinxioConfigurationError";
  }
};
var LinxioNetworkError = class extends LinxioError {
  constructor(message, context = {}) {
    super(message, context);
    this.name = "LinxioNetworkError";
  }
};
var LinxioTimeoutError = class extends LinxioNetworkError {
  constructor(message, context = {}) {
    super(message, context);
    this.name = "LinxioTimeoutError";
  }
};
var LinxioApiError = class extends LinxioError {
  body;
  headers;
  status;
  statusText;
  constructor(message, context) {
    super(message, context);
    this.name = "LinxioApiError";
    this.body = context.body;
    this.headers = context.headers;
    this.status = context.status;
    this.statusText = context.statusText;
  }
  get isAuthenticationError() {
    return this.status === 401 || this.status === 403;
  }
  get isRateLimitError() {
    return this.status === 429;
  }
  get isValidationError() {
    return this.status === 422 || this.status === 400;
  }
};
var LinxioAuthenticationError = class extends LinxioError {
  constructor(message, context = {}) {
    super(message, context);
    this.name = "LinxioAuthenticationError";
  }
};
var LinxioValidationError = class extends LinxioError {
  issues;
  constructor(message, context = {}) {
    super(message, context);
    this.name = "LinxioValidationError";
    this.issues = context.issues;
  }
};
var LinxioRealtimeError = class extends LinxioError {
  constructor(message, context = {}) {
    super(message, context);
    this.name = "LinxioRealtimeError";
  }
};

// src/response.ts
var envelopeKeys = /* @__PURE__ */ new Set([
  "additionalFields",
  "aggregations",
  "data",
  "limit",
  "links",
  "meta",
  "page",
  "result",
  "total"
]);
function unwrapLinxioServiceData(value) {
  const payload = unwrapResultEnvelope(value);
  if (!isRecord(payload)) {
    return payload;
  }
  if (isDataEnvelope(payload)) {
    return payload.data;
  }
  const singletonArray = getSingletonArrayPayload(payload);
  if (singletonArray) {
    return singletonArray;
  }
  return payload;
}
function extractPageEnvelopeSource(value) {
  const root = isRecord(value) ? value : {};
  const result = isRecord(root.result) ? root.result : void 0;
  return result ?? root;
}
function extractPageData(source) {
  if (Array.isArray(source.data)) {
    return source.data;
  }
  return getSingletonArrayPayload(source) ?? [];
}
function unwrapResultEnvelope(value) {
  if (!isRecord(value) || !Object.hasOwn(value, "result")) {
    return value;
  }
  return value.result;
}
function isDataEnvelope(value) {
  return Object.hasOwn(value, "data") && Object.keys(value).every((key) => envelopeKeys.has(key));
}
function getSingletonArrayPayload(value) {
  const arrayEntries = Object.entries(value).filter(
    ([key, entry]) => !envelopeKeys.has(key) && Array.isArray(entry)
  );
  return arrayEntries.length === 1 ? arrayEntries[0]?.[1] : void 0;
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// src/params.ts
function normalisePath(path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return path.startsWith("/") ? path : `/${path}`;
}
function mergeParams(params, fields) {
  const merged = { ...params ?? {} };
  delete merged.fields;
  if (fields?.length) {
    merged["fields[]"] = [...fields];
  }
  return merged;
}
function appendQueryParams(url, params) {
  if (!params) {
    return url;
  }
  for (const [key, value] of Object.entries(params)) {
    appendQueryParam(url, key, value);
  }
  return url;
}
function appendQueryParam(url, key, value) {
  if (value === null || value === void 0) {
    return;
  }
  if (Array.isArray(value)) {
    const arrayKey = key.endsWith("[]") ? key : `${key}[]`;
    for (const item of value) {
      url.searchParams.append(arrayKey, String(item));
    }
    return;
  }
  url.searchParams.append(
    key,
    value instanceof Date ? value.toISOString() : String(value)
  );
}
function toPage(envelope) {
  const source = extractPageEnvelopeSource(envelope);
  const sourceMeta = toPaginationMeta(source.meta);
  const rootMeta = toPaginationMeta(envelope.meta);
  const meta = {
    limit: Number(
      source.limit ?? sourceMeta.limit ?? envelope.limit ?? rootMeta.limit ?? 0
    ),
    page: Number(
      source.page ?? sourceMeta.page ?? envelope.page ?? rootMeta.page ?? 1
    ),
    total: Number(
      source.total ?? sourceMeta.total ?? envelope.total ?? rootMeta.total ?? 0
    )
  };
  return {
    additionalFields: source.additionalFields ?? envelope.additionalFields,
    aggregations: source.aggregations ?? envelope.aggregations,
    data: extractPageData(source),
    ...meta,
    meta
  };
}
function toPaginationMeta(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

// src/http.ts
var DEFAULT_BASE_URL = "https://api.linxio.com/api";
var DEFAULT_TIMEOUT_MS = 3e4;
var IDEMPOTENT_METHODS = /* @__PURE__ */ new Set(["GET", "HEAD", "OPTIONS"]);
var HttpClient = class {
  /** Normalized REST API base URL without a trailing slash. */
  baseUrl;
  fetcher;
  getRefreshToken;
  getToken;
  onSession;
  retry;
  timeoutMs;
  refreshInFlight;
  constructor(config = {}) {
    this.baseUrl = trimTrailingSlash(config.baseUrl ?? DEFAULT_BASE_URL);
    this.fetcher = config.fetch ?? getGlobalFetch();
    this.getToken = config.getToken ?? (() => void 0);
    this.getRefreshToken = config.getRefreshToken ?? (() => void 0);
    this.onSession = config.onSession;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.retry = {
      delayMs: config.retry?.delayMs ?? 1e3,
      maxDelayMs: config.retry?.maxDelayMs ?? 8e3,
      retries: config.retry?.retries ?? 3,
      retryUnsafeMethods: config.retry?.retryUnsafeMethods ?? false
    };
  }
  /** Send a GET request. */
  get(path, options = {}) {
    return this.request("GET", path, options);
  }
  /** Send a POST request. */
  post(path, body, options = {}) {
    return this.request("POST", path, { ...options, body });
  }
  /** Send a PATCH request. */
  patch(path, body, options = {}) {
    return this.request("PATCH", path, { ...options, body });
  }
  /** Send a PUT request. */
  put(path, body, options = {}) {
    return this.request("PUT", path, { ...options, body });
  }
  /** Send a DELETE request. */
  delete(path, options = {}) {
    return this.request("DELETE", path, options);
  }
  /** Send a request with an arbitrary HTTP method. */
  async request(method, path, options = {}) {
    return this.requestWithRefresh(method, path, options, false);
  }
  /** Build the final request URL, including query parameters. */
  buildUrl(path, params) {
    const normalisedPath = normalisePath(path);
    const url = /^https?:\/\//i.test(normalisedPath) ? new URL(normalisedPath) : new URL(`${this.baseUrl}${normalisedPath}`);
    return appendQueryParams(url, params);
  }
  async requestWithRefresh(method, path, options, hasRefreshed) {
    const response = await this.sendWithRetries(method, path, options);
    if (response.status === 401 && !hasRefreshed && !options.skipAuth && !options.skipAuthRefresh && this.getRefreshToken() && !isRefreshOrLoginPath(path)) {
      await this.refreshSession();
      return this.requestWithRefresh(
        method,
        path,
        options,
        true
      );
    }
    return this.parseResponse(
      response,
      method,
      path,
      options.responseType
    );
  }
  async refreshSession() {
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
        skipAuthRefresh: true
      });
      const parsed = await this.parseResponse(
        response,
        "POST",
        "/token/refresh",
        "json"
      );
      if (!parsed.token) {
        throw new LinxioApiError(
          "Linxio token refresh did not return a token.",
          {
            body: parsed,
            method: "POST",
            path: "/api/token/refresh",
            status: response.status,
            statusText: response.statusText
          }
        );
      }
      this.onSession?.({
        expireAt: parsed.expireAt,
        refreshToken: parsed.refreshToken ?? refreshToken,
        token: parsed.token
      });
    })();
    try {
      await this.refreshInFlight;
    } finally {
      this.refreshInFlight = void 0;
    }
  }
  async sendWithRetries(method, path, options) {
    const shouldRetry = this.shouldRetryMethod(method);
    const maxAttempts = shouldRetry ? this.retry.retries + 1 : 1;
    let lastNetworkError;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        const response = await this.sendOnce(method, path, options);
        if (attempt < maxAttempts - 1 && shouldRetry && isRetriableStatus(response.status)) {
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
        path: this.pathForError(path)
      }
    );
  }
  async sendOnce(method, path, options) {
    const timeoutMs = options.timeoutMs ?? this.timeoutMs;
    const timeoutController = new AbortController();
    const timeout = setTimeout(() => timeoutController.abort(), timeoutMs);
    const signal = combineSignals(options.signal, timeoutController.signal);
    try {
      return await this.fetcher(this.buildUrl(path, options.params), {
        body: prepareBody(method, options.body),
        headers: this.prepareHeaders(options),
        method,
        signal
      });
    } catch (error) {
      if (timeoutController.signal.aborted) {
        throw new LinxioTimeoutError(
          `Linxio request timed out after ${timeoutMs}ms.`,
          {
            cause: error,
            method,
            path: this.pathForError(path)
          }
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
  prepareHeaders(options) {
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
    if (options.body !== void 0 && shouldUseJsonBody(options.body)) {
      headers.set("Content-Type", "application/json");
    }
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }
    return headers;
  }
  async parseResponse(response, method, path, responseType = "json") {
    if (response.status === 204) {
      return void 0;
    }
    if (!response.ok) {
      const body = await parseErrorBody(response);
      throw new LinxioApiError(errorMessage(response, body), {
        body,
        headers: response.headers,
        method,
        path: this.pathForError(path),
        requestId: response.headers.get("X-Request-Id") ?? void 0,
        status: response.status,
        statusText: response.statusText
      });
    }
    if (responseType === "raw") {
      return response;
    }
    if (responseType === "text") {
      return await response.text();
    }
    if (responseType === "blob") {
      return await response.blob();
    }
    if (responseType === "arrayBuffer") {
      return await response.arrayBuffer();
    }
    const text = await response.text();
    if (!text) {
      return void 0;
    }
    return JSON.parse(text);
  }
  shouldRetryMethod(method) {
    return this.retry.retryUnsafeMethods || IDEMPOTENT_METHODS.has(method);
  }
  delayForAttempt(attempt) {
    if (this.retry.delayMs === 0) {
      return 0;
    }
    return Math.min(
      this.retry.delayMs * 2 ** attempt,
      this.retry.maxDelayMs
    );
  }
  pathForError(path) {
    const url = this.buildUrl(path);
    return `${url.pathname}${url.search}`;
  }
};
function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}
function getGlobalFetch() {
  if (typeof globalThis.fetch !== "function") {
    throw new LinxioConfigurationError(
      "No fetch implementation is available. Pass `fetch` to createClient() or run on Node.js 20+."
    );
  }
  return globalThis.fetch.bind(globalThis);
}
function isRefreshOrLoginPath(path) {
  return path === "/login" || path === "/token/refresh";
}
function isRetriableStatus(status) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}
function prepareBody(method, body) {
  if (method === "GET" || method === "HEAD" || body === void 0) {
    return void 0;
  }
  if (!shouldUseJsonBody(body)) {
    return body;
  }
  return JSON.stringify(body);
}
function shouldUseJsonBody(body) {
  return !(typeof body === "string" || body instanceof ArrayBuffer || body instanceof Blob || body instanceof FormData || body instanceof URLSearchParams);
}
async function parseErrorBody(response) {
  const text = await response.text();
  if (!text) {
    return void 0;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
function errorMessage(response, body) {
  if (typeof body === "object" && body !== null) {
    const record = body;
    const message = record.message ?? record.error;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return `Linxio API request failed with ${response.status} ${response.statusText}`.trim();
}
function combineSignals(originalSignal, timeoutSignal) {
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
function sleep(ms, signal) {
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
      { once: true }
    );
  });
}

// src/realtime.ts
import { io } from "socket.io-client";
var DEFAULT_REALTIME_BASE_URL = "https://track.linxio.com";
var RealtimeClient = class {
  baseUrl;
  getToken;
  path;
  reconnectionAttempts;
  sockets = /* @__PURE__ */ new Map();
  constructor(options = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_REALTIME_BASE_URL).replace(
      /\/+$/,
      ""
    );
    this.getToken = options.getToken ?? (() => void 0);
    this.path = options.path ?? "/socket.io";
    this.reconnectionAttempts = options.reconnectionAttempts ?? 10;
  }
  /** Connect to a Linxio realtime namespace and reuse existing sockets. */
  connect(namespace, token = this.getToken()) {
    const existing = this.sockets.get(namespace);
    if (existing) {
      return existing;
    }
    if (!token) {
      throw new LinxioRealtimeError(
        "A Linxio token is required before connecting to realtime sockets."
      );
    }
    const socket = io(`${this.baseUrl}/${namespace}`, {
      path: this.path,
      query: { token },
      reconnection: true,
      reconnectionAttempts: this.reconnectionAttempts,
      reconnectionDelay: 5e3,
      reconnectionDelayMax: 1e4,
      timeout: 2e4,
      transports: ["websocket"]
    });
    socket.on("error", (error) => {
      if (error === "AUTH_FAILED") {
        socket.disconnect();
      }
    });
    this.sockets.set(namespace, socket);
    return socket;
  }
  /** Subscribe the current realtime socket to a set of vehicle IDs. */
  subscribe(vehicleIds, namespace = "coordinates") {
    const socket = this.connect(namespace);
    return new Promise((resolve) => {
      socket.emit(
        "subscribe",
        { vehicleIds: vehicleIds.map(Number) },
        (ack) => resolve(ack)
      );
    });
  }
  /**
   * Subscribe to live vehicle coordinates.
   *
   * The returned function removes event handlers. It does not disconnect the
   * socket, allowing other subscriptions to keep running.
   */
  onPosition(vehicleIds, handler) {
    const socket = this.connect("coordinates");
    const subscribe = () => {
      socket.emit("subscribe", { vehicleIds: vehicleIds.map(Number) });
    };
    socket.on("connect", subscribe);
    socket.on("reconnect", subscribe);
    socket.on("coordinates", handler);
    if (socket.connected) {
      subscribe();
    }
    return () => {
      socket.off("connect", subscribe);
      socket.off("reconnect", subscribe);
      socket.off("coordinates", handler);
    };
  }
  /** Listen for Linxio notification messages. */
  onNotification(handler) {
    const socket = this.connect("notifications");
    socket.on("notification", handler);
    socket.on("notifications", handler);
    return () => {
      socket.off("notification", handler);
      socket.off("notifications", handler);
    };
  }
  /** Listen for a custom notification event type emitted by Linxio. */
  onNotificationType(type, handler) {
    const socket = this.connect("notifications");
    socket.on(type, handler);
    return () => socket.off(type, handler);
  }
  /** Disconnect one namespace or every active realtime socket. */
  disconnect(namespace) {
    if (namespace) {
      this.sockets.get(namespace)?.disconnect();
      this.sockets.delete(namespace);
      return;
    }
    for (const socket of this.sockets.values()) {
      socket.disconnect();
    }
    this.sockets.clear();
  }
};

// src/result.ts
function ok(data) {
  return { data, error: null };
}
function fail(error) {
  return { data: null, error: toLinxioError(error) };
}
async function toResult(operation) {
  try {
    return ok(unwrapLinxioServiceData(await operation()));
  } catch (error) {
    return fail(error);
  }
}
function pageOk(page) {
  return { ...page, error: null };
}
function pageFail(error) {
  return {
    data: null,
    error: toLinxioError(error),
    limit: null,
    meta: null,
    page: null,
    total: null
  };
}
function isLinxioFailure(result) {
  return result.error !== null;
}
function unwrapLinxioResult(result) {
  if (result.error) {
    throw result.error;
  }
  return result.data;
}
function unwrapLinxioPageResult(result) {
  if (result.error) {
    throw result.error;
  }
  return result;
}
function toLinxioError(error) {
  if (error instanceof LinxioError) {
    return error;
  }
  if (error instanceof Error) {
    return new LinxioError(error.message, { cause: error });
  }
  return new LinxioError("Linxio SDK operation failed.", { cause: error });
}

// src/services/base.service.ts
var BaseService = class {
  constructor(http) {
    this.http = http;
  }
  http;
  async getPage(path, params = {}, options = {}) {
    try {
      const response = await this.http.get(
        path,
        {
          ...options,
          params: this.listParams(params)
        }
      );
      return pageOk(toPage(response));
    } catch (error) {
      return pageFail(error);
    }
  }
  result(operation) {
    return toResult(operation);
  }
  listParams(params = {}) {
    const { fields, ...rest } = params;
    return mergeParams(rest, fields);
  }
};

// src/services/auth.service.ts
var AuthService = class extends BaseService {
  constructor(http, setSession) {
    super(http);
    this.setSession = setSession;
  }
  setSession;
  /**
   * Log in with Linxio credentials.
   *
   * The returned JWT and refresh token are stored in the parent client so
   * subsequent requests are authenticated automatically.
   */
  async login(request) {
    const result = await this.result(
      () => this.http.post("/login", request, {
        skipAuth: true,
        skipAuthRefresh: true
      })
    );
    if (!result.error) {
      this.applySession(result.data);
    }
    return result;
  }
  /** Verify a one-time password when Linxio requires OTP for the account. */
  async verifyOtp(request) {
    const result = await this.result(
      () => this.http.post("/login/otp", request, {
        skipAuth: true,
        skipAuthRefresh: true
      })
    );
    if (!result.error) {
      this.applySession(result.data);
    }
    return result;
  }
  /** Refresh a JWT manually and update the client session. */
  async refresh(refreshToken) {
    const result = await this.result(
      () => this.http.post(
        "/token/refresh",
        { refreshToken },
        { skipAuthRefresh: true }
      )
    );
    if (result.error) {
      return result;
    }
    const session = {
      expireAt: result.data.expireAt,
      refreshToken: result.data.refreshToken ?? refreshToken,
      token: result.data.token
    };
    this.setSession(session);
    return { data: session, error: null };
  }
  /** Fetch the current authenticated Linxio user. */
  me(fields) {
    return this.result(
      () => this.http.get("/me", {
        params: fields?.length ? { "fields[]": [...fields] } : void 0
      })
    );
  }
  /** Log out the current Linxio session server-side. */
  logout() {
    return this.result(() => this.http.post("/logout", {}));
  }
  applySession(response) {
    this.setSession({
      expireAt: response.expireAt,
      refreshToken: response.refreshToken,
      token: response.token
    });
  }
};

// src/services/cameras.service.ts
var CamerasService = class extends BaseService {
  /** List camera events. */
  events(params = {}) {
    return this.getPage("/devices/cameras/events", params);
  }
  /** List camera event types. */
  eventTypes() {
    return this.result(
      () => this.http.get("/devices/cameras/events/types")
    );
  }
};

// src/pagination.ts
async function collectPages(loadPage, params = {}) {
  try {
    const data = [];
    for await (const item of streamPages(loadPage, params)) {
      data.push(item);
    }
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
async function* streamPages(loadPage, params = {}) {
  let page = Number(params.page ?? 1);
  const limit = Number(params.limit ?? 100);
  while (true) {
    const result = unwrapLinxioPageResult(
      await loadPage({ ...params, limit, page })
    );
    for (const item of result.data) {
      yield item;
    }
    const seen = result.meta.page * result.meta.limit;
    if (result.data.length === 0 || seen >= result.meta.total) {
      return;
    }
    page += 1;
  }
}

// src/services/clients.service.ts
var ClientsService = class extends BaseService {
  /** List client accounts from the dashboard-derived endpoint. */
  list(params = {}) {
    return this.getPage("/clients/json", params);
  }
  /** Fetch one client account by ID. */
  get(clientId) {
    return this.result(() => this.http.get(`/clients/${clientId}`));
  }
  /** List users for a client account. */
  listUsers(clientId, params = {}) {
    return this.getPage(`/clients/${clientId}/users`, params);
  }
  /** Load every user page for a client account into a single result. */
  iterateUsers(clientId, params = {}) {
    return collectPages(
      (pageParams) => this.listUsers(clientId, pageParams),
      params
    );
  }
  /** Stream users for a client account without loading every user at once. */
  streamUsers(clientId, params = {}) {
    return streamPages(
      (pageParams) => this.listUsers(clientId, pageParams),
      params
    );
  }
  /** Create a user within a client account. */
  createUser(clientId, payload) {
    return this.result(
      () => this.http.post(`/clients/${clientId}/users`, payload)
    );
  }
  /** Update a user within a client account. */
  updateUser(clientId, userId, payload) {
    return this.result(
      () => this.http.post(`/clients/${clientId}/users/${userId}`, payload)
    );
  }
  /** Fetch one user within a client account. */
  getUser(clientId, userId) {
    return this.result(
      () => this.http.get(`/clients/${clientId}/users/${userId}`)
    );
  }
};
var ResellersService = class extends BaseService {
  /** List reseller accounts. */
  list() {
    return this.result(() => this.http.get("/reseller"));
  }
  /** Fetch one reseller account by ID. */
  get(resellerId) {
    return this.result(() => this.http.get(`/reseller/${resellerId}`));
  }
};

// src/services/devices.service.ts
var DevicesService = class extends BaseService {
  /** List devices using Linxio's documented `/devices/json` endpoint. */
  list(params = {}) {
    return this.getPage("/devices/json", params);
  }
  /** Load every device page into a single result. */
  iterate(params = {}) {
    return collectPages((pageParams) => this.list(pageParams), params);
  }
  /** Stream every device page without loading the whole inventory at once. */
  stream(params = {}) {
    return streamPages((pageParams) => this.list(pageParams), params);
  }
  /** Fetch one device by internal Linxio device ID. */
  get(deviceId) {
    return this.result(() => this.http.get(`/devices/${deviceId}`));
  }
  /** Create a device. */
  create(payload) {
    return this.result(() => this.http.post("/devices", payload));
  }
  /** Update a device using Linxio's documented PATCH endpoint. */
  update(deviceId, payload) {
    return this.result(
      () => this.http.patch(`/devices/${deviceId}`, payload)
    );
  }
  /** Install a device into a vehicle. */
  install(deviceId, payload) {
    return this.result(
      () => this.http.post(`/devices/${deviceId}/install`, payload)
    );
  }
  /** Uninstall a device from its current vehicle. */
  uninstall(deviceId, payload = {}) {
    return this.result(
      () => this.http.post(`/devices/${deviceId}/uninstall`, payload)
    );
  }
  /** Soft-archive a device when the dashboard endpoint is available. */
  archive(deviceId) {
    return this.result(
      () => this.http.patch(`/devices/${deviceId}/archive`, {})
    );
  }
  /** Restore a previously archived device. */
  restore(deviceId) {
    return this.result(
      () => this.http.patch(`/devices/${deviceId}/restore`, {})
    );
  }
  /** Fetch recent coordinates for a device from the dashboard-derived endpoint. */
  coordinates(deviceId, params = {}) {
    return this.result(
      () => this.http.get(`/devices/${deviceId}/coordinates`, { params })
    );
  }
  /** List sensor history rows for a device. */
  sensors(deviceId, params = {}) {
    return this.getPage(`/devices/${deviceId}/sensors/history`, params);
  }
  /** Fetch device history entries from the dashboard-derived endpoint. */
  history(deviceId) {
    return this.result(() => this.http.get(`/devices/${deviceId}/history`));
  }
  /** List device vendors from the dashboard-derived endpoint. */
  vendors() {
    return this.result(() => this.http.get("/devices/vendors/"));
  }
  /** Look up a device installation by device IMEI or vehicle registration. */
  installation(params = {}) {
    return this.result(async () => {
      const installation = await this.http.get(
        "/devices/installation/",
        { params }
      );
      return isEmptyRecord(installation) ? null : installation;
    });
  }
  /** Backwards-compatible alias for `installation()`. */
  installations(params = {}) {
    return this.installation(params);
  }
  /** List cameras attached to a device from the dashboard-derived endpoint. */
  cameras(deviceId) {
    return this.result(() => this.http.get(`/devices/${deviceId}/cameras`));
  }
};
function isEmptyRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length === 0;
}

// src/services/drivers.service.ts
var DriversService = class extends BaseService {
  /** List drivers, optionally via the documented client-users driver endpoint. */
  list(params = {}) {
    const { clientId, ...rest } = params;
    if (clientId) {
      return this.getPage(`/clients/${clientId}/users`, {
        ...rest,
        role: "driver"
      });
    }
    return this.getPage("/drivers", rest);
  }
  /** Load every driver page into a single result. */
  iterate(params = {}) {
    return collectPages((pageParams) => this.list(pageParams), params);
  }
  /** Stream every driver page without loading every driver at once. */
  stream(params = {}) {
    return streamPages((pageParams) => this.list(pageParams), params);
  }
  /** Assign a driver to a vehicle. */
  assignToVehicle(vehicleId, driverId) {
    return this.result(
      () => this.http.post(`/vehicle/${vehicleId}/set-driver/${driverId}`, {})
    );
  }
  /** Unassign a driver from a vehicle. */
  unassignFromVehicle(vehicleId, driverId) {
    return this.result(
      () => this.http.post(
        `/vehicle/${vehicleId}/unset-driver/${driverId}`,
        {}
      )
    );
  }
};

// src/services/fuel.service.ts
var FuelService = class extends BaseService {
  /** List fuel transaction records from the dashboard-derived endpoint. */
  records(params = {}) {
    return this.getPage("/fuel-cards/json", params);
  }
  /** Load every fuel transaction page into a single result. */
  iterateRecords(params = {}) {
    return collectPages((pageParams) => this.records(pageParams), params);
  }
  /** Stream fuel transaction records without loading every record at once. */
  streamRecords(params = {}) {
    return streamPages((pageParams) => this.records(pageParams), params);
  }
  /** Fetch fuel summary rows. */
  summary(params = {}) {
    return this.getPage("/fuel-summary-report", params);
  }
  /** Fetch fuel transaction records grouped or filtered by vehicle. */
  recordsByVehicle(params = {}) {
    return this.getPage("/fuel-cards-by-vehicle/json", params);
  }
  /** List fuel cards. */
  cards(params = {}) {
    return this.getPage("/fuel-cards/json", params);
  }
  /** List fuel types configured by Linxio. */
  fuelTypes() {
    return this.result(() => this.http.get("/fuel-types"));
  }
  /** Assign a fuel transaction to a vehicle. */
  assignTransaction(recordId, vehicleId) {
    return this.result(
      () => this.http.patch(`/fuel-cards/record/${recordId}`, { vehicleId })
    );
  }
};

// src/services/geofences.service.ts
var GeofencesService = class extends BaseService {
  /** List geofence objects. */
  list(params = {}) {
    return this.getPage("/areas", params);
  }
  /** Load every geofence page into a single result. */
  iterate(params = {}) {
    return collectPages((pageParams) => this.list(pageParams), params);
  }
  /** Stream every geofence page without loading every geofence at once. */
  stream(params = {}) {
    return streamPages((pageParams) => this.list(pageParams), params);
  }
  /** Fetch one geofence by Linxio area ID. */
  get(areaId) {
    return this.result(() => this.http.get(`/areas/${areaId}`));
  }
  /** Create a geofence object. */
  create(payload) {
    return this.result(() => this.http.post("/areas", payload));
  }
  /** Update a geofence object using the dashboard-derived endpoint. */
  update(areaId, payload) {
    return this.result(() => this.http.patch(`/areas/${areaId}`, payload));
  }
  /** Permanently delete a geofence object. Prefer `archive()` if you need reversibility. */
  delete(areaId) {
    return this.result(() => this.http.delete(`/areas/${areaId}`));
  }
  /** Soft-archive a geofence object when the dashboard endpoint is available. */
  archive(areaId) {
    return this.result(
      () => this.http.patch(`/areas/${areaId}/archive`, {})
    );
  }
  /** Restore a previously archived geofence object. */
  restore(areaId) {
    return this.result(
      () => this.http.patch(`/areas/${areaId}/restore`, {})
    );
  }
  /** List area groups from the dashboard-derived endpoint. */
  listGroups() {
    return this.result(() => this.http.get("/area-groups"));
  }
  /** Fetch one area group from the dashboard-derived endpoint. */
  getGroup(groupId) {
    return this.result(() => this.http.get(`/area-groups/${groupId}`));
  }
  /** Create an area group from the dashboard-derived endpoint. */
  createGroup(payload) {
    return this.result(() => this.http.post("/area-groups", payload));
  }
  /** Update an area group from the dashboard-derived endpoint. */
  updateGroup(groupId, payload) {
    return this.result(
      () => this.http.patch(`/area-groups/${groupId}`, payload)
    );
  }
  /** Delete an area group. Prefer archive/restore when reversibility matters. */
  deleteGroup(groupId) {
    return this.result(() => this.http.delete(`/area-groups/${groupId}`));
  }
  /** Soft-archive an area group from the dashboard-derived endpoint. */
  archiveGroup(groupId) {
    return this.result(
      () => this.http.patch(`/area-groups/${groupId}/archive`, {})
    );
  }
  /** Restore an archived area group from the dashboard-derived endpoint. */
  restoreGroup(groupId) {
    return this.result(
      () => this.http.patch(`/area-groups/${groupId}/restore`, {})
    );
  }
};

// src/services/metadata.service.ts
var MetadataService = class extends BaseService {
  /** Fetch country options as a map keyed by country code. */
  countries() {
    return this.result(() => this.http.get("/country/list"));
  }
  /** List user roles available to the authenticated Linxio account. */
  roles() {
    return this.result(() => this.http.get("/roles"));
  }
  /** List plan definitions visible to the authenticated Linxio account. */
  plans() {
    return this.result(() => this.http.get("/plans"));
  }
  /** List timezone options used by Linxio tenant and user settings. */
  timezones() {
    return this.result(() => this.http.get("/timezones"));
  }
  /** List dashboard theme definitions. */
  themes() {
    return this.result(() => this.http.get("/themes"));
  }
  /** Fetch the current user's active dashboard theme. */
  myTheme() {
    return this.result(() => this.http.get("/themes/my"));
  }
  /** Fetch current-plan permission keys. */
  currentPlan() {
    return this.result(() => this.http.get("/permissions/current-plan"));
  }
  /** Fetch the hosted-domain settings for the current platform. */
  platformDomain() {
    return this.result(() => this.http.get("/platform-settings/domain"));
  }
  /** List language options used by Linxio settings screens. */
  languages() {
    return this.result(() => this.http.get("/settings/language/list"));
  }
  /** Fetch the map API setting record for the current tenant. */
  mapApiOptions() {
    return this.result(() => this.http.get("/settings/mapApiOptions"));
  }
  /** Fetch dashboard provider settings visible to the current account. */
  providers() {
    return this.result(() => this.http.get("/settings/provider"));
  }
  /** Fetch tenant-level digital-form settings. */
  digitalFormSettings() {
    return this.result(() => this.http.get("/settings/digitalForm"));
  }
  /** Fetch tenant-level eco-speed settings. */
  ecoSpeedSettings() {
    return this.result(() => this.http.get("/settings/ecoSpeed"));
  }
  /** Fetch tenant-level excessive-idling settings. */
  excessiveIdlingSettings() {
    return this.result(() => this.http.get("/settings/excessiveIdling"));
  }
};

// src/services/reports.service.ts
var ReportsService = class extends BaseService {
  /** List scheduled reports. */
  scheduled(params = {}) {
    return this.getPage("/scheduled-report", params);
  }
  /** Fetch the scheduled-report template used by the Linxio dashboard. */
  scheduledTemplate() {
    return this.result(() => this.http.get("/scheduled-report/template"));
  }
  /** Fetch one scheduled report. */
  getScheduled(reportId) {
    return this.result(
      () => this.http.get(`/scheduled-report/${reportId}`)
    );
  }
  /** Create a scheduled report. */
  createScheduled(payload) {
    return this.result(() => this.http.post("/scheduled-report", payload));
  }
  /** Update a scheduled report. */
  updateScheduled(reportId, payload) {
    return this.result(
      () => this.http.patch(`/scheduled-report/${reportId}`, payload)
    );
  }
  /** Delete a scheduled report. */
  deleteScheduled(reportId) {
    return this.result(
      () => this.http.delete(`/scheduled-report/${reportId}`)
    );
  }
  /** Restore a scheduled report from the dashboard-derived endpoint. */
  restoreScheduled(reportId) {
    return this.result(
      () => this.http.patch(`/scheduled-report/${reportId}/restore`, {})
    );
  }
};
var DigitalFormsService = class extends BaseService {
  /** List digital forms. */
  list() {
    return this.result(() => this.http.get("/digital-form/form"));
  }
  /** Fetch one digital form. */
  get(formId) {
    return this.result(() => this.http.get(`/digital-form/form/${formId}`));
  }
  /** Fetch one digital form answer. */
  answer(answerId) {
    return this.result(
      () => this.http.get(`/digital-form/answer/${answerId}`)
    );
  }
  /** Download a digital form answer as a PDF Blob. */
  answerPdf(answerId) {
    return this.result(
      () => this.http.get(`/digital-form/answer/${answerId}/pdf`, {
        responseType: "blob"
      })
    );
  }
};

// src/services/routes.service.ts
var RoutesService = class extends BaseService {
  /**
   * Fetch route history for a vehicle.
   *
   * Requesting `fields: ["coordinates"]` can return very large responses, so
   * only include coordinates when your script really needs every point.
   */
  getVehicleRoutes(vehicleId, params) {
    const { fields, ...rest } = params;
    return this.result(
      () => this.http.get(`/vehicles/${vehicleId}/routes`, {
        params: mergeParams(rest, fields)
      })
    );
  }
};

// src/services/sensors.service.ts
var SensorsService = class extends BaseService {
  /** List sensors from the dashboard-derived endpoint. */
  list(params = {}) {
    return this.getPage("/sensors", params);
  }
  /** Load every sensor page into a single result. */
  iterate(params = {}) {
    return collectPages((pageParams) => this.list(pageParams), params);
  }
  /** Stream sensors without loading the whole inventory at once. */
  stream(params = {}) {
    return streamPages((pageParams) => this.list(pageParams), params);
  }
  /** Fetch one sensor by internal Linxio sensor ID. */
  get(sensorId) {
    return this.result(() => this.http.get(`/sensors/${sensorId}`));
  }
  /** Install or pair a sensor with a device. */
  install(sensorId, deviceId) {
    return this.result(
      () => this.http.post(`/sensors/${sensorId}/install`, { deviceId })
    );
  }
  /** Fetch the documented temperature/humidity report grouped by device sensor. */
  deviceTemperatureHumidityReport(params = {}) {
    return this.getPage(
      "/devices/sensors/report/temp-and-humidity",
      params
    );
  }
  /** Fetch the documented temperature/humidity report grouped by vehicle. */
  vehicleTemperatureHumidityReport(params = {}) {
    return this.getPage(
      "/vehicles/report/sensors/temp-and-humidity",
      params
    );
  }
  /** Load every device temperature/humidity report page into a single result. */
  iterateDeviceTemperatureHumidityReport(params = {}) {
    return collectPages(
      (pageParams) => this.deviceTemperatureHumidityReport(pageParams),
      params
    );
  }
  /** Stream the device temperature/humidity report one reading at a time. */
  streamDeviceTemperatureHumidityReport(params = {}) {
    return streamPages(
      (pageParams) => this.deviceTemperatureHumidityReport(pageParams),
      params
    );
  }
};

// src/services/users.service.ts
var UsersService = class extends BaseService {
  /** List users from the dashboard-derived endpoint. */
  list(params = {}) {
    return this.getPage("/users", params);
  }
  /** Load every user page into a single result. */
  iterate(params = {}) {
    return collectPages((pageParams) => this.list(pageParams), params);
  }
  /** Stream every user page without loading every user at once. */
  stream(params = {}) {
    return streamPages((pageParams) => this.list(pageParams), params);
  }
  /** Fetch one user by ID. */
  get(userId) {
    return this.result(() => this.http.get(`/users/${userId}`));
  }
  /** Create a user. */
  create(payload) {
    return this.result(() => this.http.post("/users", payload));
  }
  /** Update a user. */
  update(userId, payload) {
    return this.result(() => this.http.patch(`/users/${userId}`, payload));
  }
  /** Soft-archive a user. */
  archive(userId) {
    return this.result(
      () => this.http.patch(`/users/${userId}/archive`, {})
    );
  }
  /** Restore a previously archived user. */
  restore(userId) {
    return this.result(
      () => this.http.patch(`/users/${userId}/restore`, {})
    );
  }
};

// src/services/vehicles.service.ts
var VehiclesService = class extends BaseService {
  /** List vehicles using Linxio's documented `/vehicles/fields/json` endpoint. */
  list(params = {}) {
    return this.getPage("/vehicles/fields/json", params);
  }
  /** Load every vehicle page into a single result. */
  iterate(params = {}) {
    return collectPages((pageParams) => this.list(pageParams), params);
  }
  /** Stream every vehicle page without loading the whole fleet at once. */
  stream(params = {}) {
    return streamPages((pageParams) => this.list(pageParams), params);
  }
  /** Fetch one vehicle by internal Linxio vehicle ID. */
  get(vehicleId) {
    return this.result(() => this.http.get(`/vehicles/${vehicleId}`));
  }
  /** Create a vehicle. Validate payloads carefully against your Linxio tenant requirements. */
  create(payload) {
    return this.result(() => this.http.post("/vehicles", payload));
  }
  /** Update a vehicle using Linxio's documented POST update endpoint. */
  update(vehicleId, payload) {
    return this.result(
      () => this.http.post(`/vehicles/${vehicleId}`, payload)
    );
  }
  /** Soft-archive a vehicle when the dashboard endpoint is available. */
  archive(vehicleId) {
    return this.result(
      () => this.http.patch(`/vehicles/${vehicleId}/archive`, {})
    );
  }
  /** Restore a previously archived vehicle when the dashboard endpoint is available. */
  restore(vehicleId) {
    return this.result(
      () => this.http.post(`/vehicles/${vehicleId}/restore`, {})
    );
  }
  /** Get a vehicle odometer reading, optionally at a specific occurrence time. */
  getOdometer(vehicleId, params = {}) {
    return this.result(
      () => this.http.get(`/vehicles/${vehicleId}/odometer`, { params })
    );
  }
  /** Recalibrate a vehicle odometer in metres. */
  recalibrateOdometer(vehicleId, payload) {
    return this.result(
      () => this.http.post(`/vehicles/${vehicleId}/odometer`, payload)
    );
  }
  /** Fetch current engine hours from the dashboard-derived endpoint. */
  getEngineHours(vehicleId) {
    return this.result(
      () => this.http.get(`/vehicles/${vehicleId}/engine-hours/current`)
    );
  }
  /** Count vehicles using the dashboard-derived count endpoint. */
  count(params = {}) {
    return this.result(() => this.http.get("/vehicles/count", { params }));
  }
  /** List vehicle types using the dashboard-derived vehicle type endpoint. */
  types(params = {}) {
    return this.getPage("/vehicles/types", {
      limit: 1e3,
      sort: "order",
      ...params
    });
  }
};

// src/client.ts
var LinxioClient = class {
  /** Authentication, session, and current-user helpers. */
  auth;
  /** Dash cam event helpers discovered from the dashboard bundle. */
  cameras;
  /** Client account and client-user helpers. */
  clients;
  /** Device inventory, install, uninstall, sensor, and coordinate helpers. */
  devices;
  /** Digital forms and form answer helpers discovered from the dashboard bundle. */
  digitalForms;
  /** Driver listing and vehicle assignment helpers. */
  drivers;
  /** Fuel card, fuel record, and fuel summary helpers discovered from the dashboard bundle. */
  fuel;
  /** Geofence/area and area-group helpers. */
  geofences;
  /** Low-level HTTP client for advanced integrations. */
  http;
  /** Read-only reference data and tenant settings discovered from the dashboard bundle. */
  metadata;
  /** Socket.IO live tracking and notification client. */
  realtime;
  /** Scheduled report helpers discovered from the dashboard bundle. */
  reports;
  /** Reseller account helpers discovered from the dashboard bundle. */
  resellers;
  /** Vehicle route history helpers. */
  routes;
  /** Temperature/humidity sensor helpers. */
  sensors;
  /** User management helpers. */
  users;
  /** Vehicle inventory, odometer, and engine-hours helpers. */
  vehicles;
  currentSession;
  constructor(options = {}) {
    this.currentSession = {
      refreshToken: options.refreshToken,
      token: options.token
    };
    this.http = new HttpClient({
      baseUrl: options.baseUrl,
      fetch: options.fetch,
      getRefreshToken: () => this.currentSession.refreshToken,
      getToken: () => this.currentSession.token,
      onSession: (session) => this.setSession(session),
      retry: options.retry,
      timeoutMs: options.timeoutMs
    });
    this.realtime = new RealtimeClient({
      baseUrl: options.realtimeBaseUrl,
      getToken: () => this.currentSession.token
    });
    this.auth = new AuthService(
      this.http,
      (session) => this.setSession(session)
    );
    this.cameras = new CamerasService(this.http);
    this.clients = new ClientsService(this.http);
    this.devices = new DevicesService(this.http);
    this.digitalForms = new DigitalFormsService(this.http);
    this.drivers = new DriversService(this.http);
    this.fuel = new FuelService(this.http);
    this.geofences = new GeofencesService(this.http);
    this.metadata = new MetadataService(this.http);
    this.reports = new ReportsService(this.http);
    this.resellers = new ResellersService(this.http);
    this.routes = new RoutesService(this.http);
    this.sensors = new SensorsService(this.http);
    this.users = new UsersService(this.http);
    this.vehicles = new VehiclesService(this.http);
  }
  /**
   * Replace or partially update the in-memory session used by this client.
   *
   * This is useful when you persist tokens yourself and want to hydrate a
   * client without calling `auth.login()` again.
   */
  setSession(session) {
    this.currentSession = {
      ...this.currentSession,
      ...session
    };
  }
  /** Return a copy of the current in-memory session. */
  session() {
    return { ...this.currentSession };
  }
  /**
   * Send a raw API request with the same auth, retry, timeout, and refresh
   * behavior used by the domain services.
   */
  request(method, path, options = {}) {
    return this.http.request(method, path, options);
  }
};
function createClient(options = {}) {
  return new LinxioClient(options);
}

// src/endpoint-discovery.ts
var HTTP_METHODS = ["DELETE", "GET", "PATCH", "POST", "PUT"];
var METHOD_PATTERN = /\.(delete|get|patch|post|put)\s*\($/i;
var STRING_LITERAL_PATTERN = /(["'`])((?:\\.|(?!\1)[\s\S])*?)\1/g;
function extractDashboardEndpoints(sources) {
  const endpoints = /* @__PURE__ */ new Map();
  for (const source of sources) {
    for (const match of source.content.matchAll(STRING_LITERAL_PATTERN)) {
      const rawValue = match[2];
      if (rawValue === void 0 || match.index === void 0) {
        continue;
      }
      const path = normalizeDashboardPath(rawValue);
      if (!path || !isLikelyApiEndpoint(path)) {
        continue;
      }
      const method = inferHttpMethod(source.content, match.index);
      if (method === "UNKNOWN") {
        continue;
      }
      const evidence = endpoints.get(path) ?? {
        files: /* @__PURE__ */ new Set(),
        methods: /* @__PURE__ */ new Set(),
        occurrences: 0
      };
      evidence.files.add(source.filename);
      evidence.methods.add(method);
      evidence.occurrences += 1;
      endpoints.set(path, evidence);
    }
  }
  return [...endpoints.entries()].map(([path, evidence]) => ({
    files: [...evidence.files].sort(
      (left, right) => left.localeCompare(right)
    ),
    methods: [...evidence.methods].sort(compareMethods),
    occurrences: evidence.occurrences,
    path
  })).sort((left, right) => compareText(left.path, right.path));
}
function compareDashboardEndpointCoverage({
  dashboardEndpoints,
  sdkEndpoints
}) {
  const sdkKeys = new Set(sdkEndpoints.map(endpointKey));
  const dashboardKeys = /* @__PURE__ */ new Set();
  const dashboardCovered = [];
  const dashboardOnly = [];
  for (const endpoint of dashboardEndpoints) {
    const keys = endpoint.methods.map(
      (method) => endpointKey({ method, path: endpoint.path })
    );
    for (const key of keys) {
      dashboardKeys.add(key);
    }
    if (keys.some((key) => sdkKeys.has(key))) {
      dashboardCovered.push(endpoint);
    } else {
      dashboardOnly.push(endpoint);
    }
  }
  return {
    dashboardCovered,
    dashboardOnly,
    sdkOnly: sdkEndpoints.filter(
      (endpoint) => !dashboardKeys.has(endpointKey(endpoint))
    )
  };
}
function flattenEndpointDefinitions(catalogue) {
  const definitions = [];
  collectEndpointDefinitions(catalogue, definitions);
  return definitions.sort((left, right) => {
    const pathOrder = compareText(left.path, right.path);
    return pathOrder === 0 ? compareMethods(left.method, right.method) : pathOrder;
  });
}
function normalizeDashboardPath(value) {
  const normalized = value.replace(/\\\//g, "/").replace(/\$\{[^}]*\}/g, "{param}").trim();
  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return void 0;
  }
  return normalized.replace(/\/+$/, "") || "/";
}
function isLikelyApiEndpoint(path) {
  if (path === "/" || path.includes(" ") || path.startsWith("/.") || path.startsWith("/MM/") || path.startsWith("/socket.io")) {
    return false;
  }
  return /^\/[a-z][a-z0-9-]*(?:[/?#]|$)/i.test(path);
}
function inferHttpMethod(content, literalIndex) {
  const prefix = content.slice(Math.max(0, literalIndex - 80), literalIndex);
  const match = prefix.match(METHOD_PATTERN);
  if (!match?.[1]) {
    return "UNKNOWN";
  }
  return match[1].toUpperCase();
}
function compareMethods(left, right) {
  return methodRank(left) - methodRank(right);
}
function compareText(left, right) {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}
function methodRank(method) {
  const index = HTTP_METHODS.indexOf(method);
  return index === -1 ? HTTP_METHODS.length : index;
}
function endpointKey(endpoint) {
  return `${endpoint.method}:${normalizeComparablePath(endpoint.path)}`;
}
function normalizeComparablePath(path) {
  const [pathWithoutQuery] = path.split("?");
  return (pathWithoutQuery ?? path).replace(/\{[^}]+\}/g, "{param}");
}
function collectEndpointDefinitions(value, definitions) {
  if (!isRecord2(value)) {
    return;
  }
  if (isEndpointDefinition(value)) {
    definitions.push(value);
    return;
  }
  for (const nestedValue of Object.values(value)) {
    collectEndpointDefinitions(nestedValue, definitions);
  }
}
function isEndpointDefinition(value) {
  return typeof value.path === "string" && (value.source === "dashboard" || value.source === "public-docs") && isHttpMethod(value.method);
}
function isHttpMethod(value) {
  return value === "DELETE" || value === "GET" || value === "PATCH" || value === "POST" || value === "PUT";
}
function isRecord2(value) {
  return typeof value === "object" && value !== null;
}

// src/endpoints.ts
var linxioEndpoints = {
  auth: {
    login: { method: "POST", path: "/login", source: "public-docs" },
    logout: { method: "POST", path: "/logout", source: "dashboard" },
    me: { method: "GET", path: "/me", source: "dashboard" },
    refreshToken: {
      method: "POST",
      path: "/token/refresh",
      source: "dashboard"
    },
    verifyOtp: { method: "POST", path: "/login/otp", source: "dashboard" }
  },
  cameras: {
    eventTypes: {
      method: "GET",
      path: "/devices/cameras/events/types",
      source: "dashboard"
    },
    events: {
      method: "GET",
      path: "/devices/cameras/events",
      source: "dashboard"
    }
  },
  clients: {
    get: {
      method: "GET",
      path: "/clients/{clientId}",
      source: "dashboard"
    },
    list: { method: "GET", path: "/clients/json", source: "dashboard" },
    users: {
      create: {
        method: "POST",
        path: "/clients/{clientId}/users",
        source: "public-docs"
      },
      get: {
        method: "GET",
        path: "/clients/{clientId}/users/{userId}",
        source: "public-docs"
      },
      list: {
        method: "GET",
        path: "/clients/{clientId}/users",
        source: "public-docs"
      },
      update: {
        method: "POST",
        path: "/clients/{clientId}/users/{userId}",
        source: "public-docs"
      }
    }
  },
  devices: {
    archive: {
      method: "PATCH",
      path: "/devices/{deviceId}/archive",
      source: "dashboard"
    },
    coordinates: {
      method: "GET",
      path: "/devices/{deviceId}/coordinates",
      source: "dashboard"
    },
    cameras: {
      method: "GET",
      path: "/devices/{deviceId}/cameras",
      source: "dashboard"
    },
    create: { method: "POST", path: "/devices", source: "public-docs" },
    get: {
      method: "GET",
      path: "/devices/{deviceId}",
      source: "public-docs"
    },
    install: {
      method: "POST",
      path: "/devices/{deviceId}/install",
      source: "public-docs"
    },
    list: { method: "GET", path: "/devices/json", source: "public-docs" },
    history: {
      method: "GET",
      path: "/devices/{deviceId}/history",
      source: "dashboard"
    },
    installations: {
      method: "GET",
      path: "/devices/installation/",
      source: "dashboard"
    },
    sensors: {
      list: {
        method: "GET",
        path: "/devices/{deviceId}/sensors/history",
        source: "dashboard"
      }
    },
    uninstall: {
      method: "POST",
      path: "/devices/{deviceId}/uninstall",
      source: "public-docs"
    },
    update: {
      method: "PATCH",
      path: "/devices/{deviceId}",
      source: "public-docs"
    },
    vendors: {
      method: "GET",
      path: "/devices/vendors/",
      source: "dashboard"
    }
  },
  drivers: {
    assignToVehicle: {
      method: "POST",
      path: "/vehicle/{vehicleId}/set-driver/{driverId}",
      source: "public-docs"
    },
    list: {
      method: "GET",
      path: "/clients/{clientId}/users?role=driver",
      source: "public-docs"
    },
    unassignFromVehicle: {
      method: "POST",
      path: "/vehicle/{vehicleId}/unset-driver/{driverId}",
      source: "public-docs"
    }
  },
  fuel: {
    assignTransaction: {
      method: "PATCH",
      path: "/fuel-cards/record/{recordId}",
      source: "dashboard"
    },
    cards: { method: "GET", path: "/fuel-cards/json", source: "dashboard" },
    records: {
      method: "GET",
      path: "/fuel-cards/json",
      source: "dashboard"
    },
    recordsByVehicle: {
      method: "GET",
      path: "/fuel-cards-by-vehicle/json",
      source: "dashboard"
    },
    summary: {
      method: "GET",
      path: "/fuel-summary-report",
      source: "dashboard"
    },
    fuelTypes: {
      method: "GET",
      path: "/fuel-types",
      source: "dashboard"
    }
  },
  geofences: {
    archive: {
      method: "PATCH",
      path: "/areas/{areaId}/archive",
      source: "dashboard"
    },
    create: { method: "POST", path: "/areas", source: "public-docs" },
    delete: {
      method: "DELETE",
      path: "/areas/{areaId}",
      source: "public-docs"
    },
    get: { method: "GET", path: "/areas/{areaId}", source: "dashboard" },
    list: { method: "GET", path: "/areas", source: "public-docs" },
    restore: {
      method: "PATCH",
      path: "/areas/{areaId}/restore",
      source: "dashboard"
    },
    groups: {
      archive: {
        method: "PATCH",
        path: "/area-groups/{groupId}/archive",
        source: "dashboard"
      },
      create: {
        method: "POST",
        path: "/area-groups",
        source: "dashboard"
      },
      delete: {
        method: "DELETE",
        path: "/area-groups/{groupId}",
        source: "dashboard"
      },
      get: {
        method: "GET",
        path: "/area-groups/{groupId}",
        source: "dashboard"
      },
      list: {
        method: "GET",
        path: "/area-groups",
        source: "dashboard"
      },
      restore: {
        method: "PATCH",
        path: "/area-groups/{groupId}/restore",
        source: "dashboard"
      },
      update: {
        method: "PATCH",
        path: "/area-groups/{groupId}",
        source: "dashboard"
      }
    }
  },
  metadata: {
    countries: {
      method: "GET",
      path: "/country/list",
      source: "dashboard"
    },
    currentPlan: {
      method: "GET",
      path: "/permissions/current-plan",
      source: "dashboard"
    },
    digitalFormSettings: {
      method: "GET",
      path: "/settings/digitalForm",
      source: "dashboard"
    },
    ecoSpeedSettings: {
      method: "GET",
      path: "/settings/ecoSpeed",
      source: "dashboard"
    },
    excessiveIdlingSettings: {
      method: "GET",
      path: "/settings/excessiveIdling",
      source: "dashboard"
    },
    languages: {
      method: "GET",
      path: "/settings/language/list",
      source: "dashboard"
    },
    mapApiOptions: {
      method: "GET",
      path: "/settings/mapApiOptions",
      source: "dashboard"
    },
    myTheme: {
      method: "GET",
      path: "/themes/my",
      source: "dashboard"
    },
    platformDomain: {
      method: "GET",
      path: "/platform-settings/domain",
      source: "dashboard"
    },
    plans: {
      method: "GET",
      path: "/plans",
      source: "dashboard"
    },
    providers: {
      method: "GET",
      path: "/settings/provider",
      source: "dashboard"
    },
    roles: {
      method: "GET",
      path: "/roles",
      source: "dashboard"
    },
    themes: {
      method: "GET",
      path: "/themes",
      source: "dashboard"
    },
    timezones: {
      method: "GET",
      path: "/timezones",
      source: "dashboard"
    }
  },
  realtime: {
    coordinates: {
      method: "GET",
      path: "https://track.linxio.com/coordinates",
      source: "public-docs"
    },
    notifications: {
      method: "GET",
      path: "https://track.linxio.com/notifications",
      source: "public-docs"
    }
  },
  reports: {
    digitalFormAnswer: {
      method: "GET",
      path: "/digital-form/answer/{answerId}",
      source: "dashboard"
    },
    digitalFormAnswerPdf: {
      method: "GET",
      path: "/digital-form/answer/{answerId}/pdf",
      source: "dashboard"
    },
    deleteScheduledReport: {
      method: "DELETE",
      path: "/scheduled-report/{reportId}",
      source: "dashboard"
    },
    getScheduledReport: {
      method: "GET",
      path: "/scheduled-report/{reportId}",
      source: "dashboard"
    },
    scheduledReport: {
      method: "GET",
      path: "/scheduled-report",
      source: "dashboard"
    },
    restoreScheduledReport: {
      method: "PATCH",
      path: "/scheduled-report/{reportId}/restore",
      source: "dashboard"
    },
    scheduledTemplate: {
      method: "GET",
      path: "/scheduled-report/template",
      source: "dashboard"
    },
    updateScheduledReport: {
      method: "PATCH",
      path: "/scheduled-report/{reportId}",
      source: "dashboard"
    }
  },
  sensors: {
    tempHumidityDeviceReport: {
      method: "GET",
      path: "/devices/sensors/report/temp-and-humidity",
      source: "public-docs"
    },
    tempHumidityVehicleReport: {
      method: "GET",
      path: "/vehicles/report/sensors/temp-and-humidity",
      source: "public-docs"
    }
  },
  vehicles: {
    archive: {
      method: "PATCH",
      path: "/vehicles/{vehicleId}/archive",
      source: "dashboard"
    },
    create: { method: "POST", path: "/vehicles", source: "public-docs" },
    count: {
      method: "GET",
      path: "/vehicles/count",
      source: "dashboard"
    },
    engineHours: {
      method: "GET",
      path: "/vehicles/{vehicleId}/engine-hours/current",
      source: "dashboard"
    },
    get: {
      method: "GET",
      path: "/vehicles/{vehicleId}",
      source: "public-docs"
    },
    list: {
      method: "GET",
      path: "/vehicles/fields/json",
      source: "public-docs"
    },
    odometer: {
      method: "GET",
      path: "/vehicles/{vehicleId}/odometer",
      source: "public-docs"
    },
    recalibrateOdometer: {
      method: "POST",
      path: "/vehicles/{vehicleId}/odometer",
      source: "public-docs"
    },
    restore: {
      method: "POST",
      path: "/vehicles/{vehicleId}/restore",
      source: "dashboard"
    },
    routes: {
      method: "GET",
      path: "/vehicles/{vehicleId}/routes",
      source: "public-docs"
    },
    update: {
      method: "POST",
      path: "/vehicles/{vehicleId}",
      source: "public-docs"
    },
    types: {
      method: "GET",
      path: "/vehicles/types",
      source: "dashboard"
    }
  }
};
export {
  AuthService,
  BaseService,
  CamerasService,
  ClientsService,
  DevicesService,
  DigitalFormsService,
  DriversService,
  FuelService,
  GeofencesService,
  HttpClient,
  LinxioApiError,
  LinxioAuthenticationError,
  LinxioClient,
  LinxioConfigurationError,
  LinxioError,
  LinxioNetworkError,
  LinxioRealtimeError,
  LinxioTimeoutError,
  LinxioValidationError,
  MetadataService,
  RealtimeClient,
  ReportsService,
  ResellersService,
  RoutesService,
  SensorsService,
  UsersService,
  VehiclesService,
  collectPages,
  compareDashboardEndpointCoverage,
  createClient,
  extractDashboardEndpoints,
  fail,
  flattenEndpointDefinitions,
  isLinxioFailure,
  linxioEndpoints,
  ok,
  pageFail,
  pageOk,
  streamPages,
  toLinxioError,
  toResult,
  unwrapLinxioPageResult,
  unwrapLinxioResult
};
//# sourceMappingURL=index.js.map