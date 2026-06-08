/** Context attached to SDK errors. */
export type LinxioErrorContext = {
    cause?: unknown;
    method?: string;
    path?: string;
    requestId?: string;
};

/** Base class for all SDK-defined errors. */
export class LinxioError extends Error {
    readonly cause?: unknown;
    readonly method?: string;
    readonly path?: string;
    readonly requestId?: string;

    constructor(message: string, context: LinxioErrorContext = {}) {
        super(message);
        this.name = "LinxioError";
        this.cause = context.cause;
        this.method = context.method;
        this.path = context.path;
        this.requestId = context.requestId;
    }
}

/** Thrown when the SDK is missing required runtime configuration. */
export class LinxioConfigurationError extends LinxioError {
    constructor(message: string, context: LinxioErrorContext = {}) {
        super(message, context);
        this.name = "LinxioConfigurationError";
    }
}

/** Thrown when a request fails before Linxio returns an HTTP response. */
export class LinxioNetworkError extends LinxioError {
    constructor(message: string, context: LinxioErrorContext = {}) {
        super(message, context);
        this.name = "LinxioNetworkError";
    }
}

/** Thrown when a request exceeds its configured timeout. */
export class LinxioTimeoutError extends LinxioNetworkError {
    constructor(message: string, context: LinxioErrorContext = {}) {
        super(message, context);
        this.name = "LinxioTimeoutError";
    }
}

/** Context attached to {@link LinxioApiError}. */
export type LinxioApiErrorContext = LinxioErrorContext & {
    body?: unknown;
    headers?: Headers;
    status: number;
    statusText?: string;
};

/**
 * Thrown when Linxio returns a non-2xx HTTP response.
 *
 * Inspect `status`, `body`, `requestId`, `method`, and `path` for diagnostics.
 */
export class LinxioApiError extends LinxioError {
    readonly body?: unknown;
    readonly headers?: Headers;
    readonly status: number;
    readonly statusText?: string;

    constructor(message: string, context: LinxioApiErrorContext) {
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
}

/** Thrown for SDK-side authentication failures before an API response exists. */
export class LinxioAuthenticationError extends LinxioError {
    constructor(message: string, context: LinxioErrorContext = {}) {
        super(message, context);
        this.name = "LinxioAuthenticationError";
    }
}

/** Thrown when client-side validation fails. */
export class LinxioValidationError extends LinxioError {
    readonly issues?: unknown;

    constructor(
        message: string,
        context: LinxioErrorContext & { issues?: unknown } = {},
    ) {
        super(message, context);
        this.name = "LinxioValidationError";
        this.issues = context.issues;
    }
}

/** Thrown by the realtime Socket.IO client. */
export class LinxioRealtimeError extends LinxioError {
    constructor(message: string, context: LinxioErrorContext = {}) {
        super(message, context);
        this.name = "LinxioRealtimeError";
    }
}
