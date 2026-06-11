import { Socket } from 'socket.io-client';

/** Linxio identifiers are usually numbers, but some dashboard payloads emit strings. */
type LinxioId = number | string;
/** ISO-8601 date/time string, usually with a timezone offset. */
type ISODateString = string;
type JsonPrimitive = boolean | null | number | string;
type JsonValue = JsonPrimitive | JsonValue[] | {
    [key: string]: JsonValue;
};
type JsonObject = {
    [key: string]: JsonValue;
};
type QueryPrimitive = boolean | number | string;
type QueryValue = Date | QueryPrimitive | QueryPrimitive[] | readonly QueryPrimitive[] | null | undefined;
/** Query parameter bag accepted by low-level requests and list methods. */
type QueryParams = Record<string, QueryValue>;
type SortDirection = "asc" | "desc";
/** File formats accepted by Linxio export/report endpoints. */
type LinxioFileFormat = "csv" | "pdf" | "xlsx";
type LinxioResourceStatus = "active" | "archived" | "deleted" | "disabled" | "inactive";
/** Open object shape used for dashboard-derived payloads with partially inferred fields. */
type LinxioRecord = Record<string, unknown>;
/** Field names to request via Linxio's `fields[]` query parameter. */
type FieldSelector<TField extends string = string> = readonly TField[] | TField[];
/** Common paginated-list parameters used across Linxio endpoints. */
type ListParams<TField extends string = string> = QueryParams & {
    fields?: FieldSelector<TField>;
    limit?: number;
    page?: number;
    sort?: string;
};
/** Date-range parameters used by report and route endpoints. */
type DateRangeParams = {
    dateFrom?: ISODateString;
    dateTo?: ISODateString;
    endDate?: ISODateString;
    startDate?: ISODateString;
};
/** Normalized pagination metadata returned by SDK list methods. */
type LinxioPaginationMeta = {
    limit: number;
    page: number;
    total: number;
};
/** Normalized page returned by SDK list methods. */
type LinxioPage<TData> = LinxioPaginationMeta & {
    additionalFields?: Record<string, unknown>;
    aggregations?: unknown;
    data: TData[];
    meta: LinxioPaginationMeta;
};
type LinxioPageEnvelope<TData> = {
    additionalFields?: Record<string, unknown>;
    aggregations?: unknown;
    data?: TData[];
    limit?: number;
    meta?: Partial<LinxioPaginationMeta>;
    page?: number;
    total?: number;
};
/** Latitude/longitude coordinate. */
type LatLng = {
    lat: number;
    lng: number;
};
type LinxioUserSummary = {
    fullName?: string | null;
    id: LinxioId;
};
type LinxioCurrency = {
    code: string;
    decimals?: number;
    id?: LinxioId;
    name?: string;
    symbol?: string;
};

/** Fetch-compatible function used by the SDK HTTP layer. */
type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
/** HTTP methods accepted by {@link HttpClient.request}. */
type HttpMethod = "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT";
/** Response parser to use for a request. Defaults to JSON. */
type ResponseType = "arrayBuffer" | "blob" | "json" | "raw" | "text";
/** Retry policy for Linxio requests. */
type RetryOptions = {
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
type LinxioHttpRequestOptions = {
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
type LinxioHttpConfig = {
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
/**
 * Low-level fetch-based Linxio HTTP client.
 *
 * Domain services use this class internally. It is exported for advanced
 * scripts that need custom endpoints while retaining auth headers, timeouts,
 * idempotent retries, parsed API errors, and automatic token refresh.
 */
declare class HttpClient {
    /** Normalized REST API base URL without a trailing slash. */
    readonly baseUrl: string;
    private readonly fetcher;
    private readonly getRefreshToken;
    private readonly getToken;
    private readonly onSession?;
    private readonly retry;
    private readonly timeoutMs;
    private refreshInFlight?;
    constructor(config?: LinxioHttpConfig);
    /** Send a GET request. */
    get<TResponse = unknown>(path: string, options?: LinxioHttpRequestOptions): Promise<TResponse>;
    /** Send a POST request. */
    post<TResponse = unknown>(path: string, body?: unknown, options?: LinxioHttpRequestOptions): Promise<TResponse>;
    /** Send a PATCH request. */
    patch<TResponse = unknown>(path: string, body?: unknown, options?: LinxioHttpRequestOptions): Promise<TResponse>;
    /** Send a PUT request. */
    put<TResponse = unknown>(path: string, body?: unknown, options?: LinxioHttpRequestOptions): Promise<TResponse>;
    /** Send a DELETE request. */
    delete<TResponse = unknown>(path: string, options?: LinxioHttpRequestOptions): Promise<TResponse>;
    /** Send a request with an arbitrary HTTP method. */
    request<TResponse = unknown>(method: HttpMethod, path: string, options?: LinxioHttpRequestOptions): Promise<TResponse>;
    /** Build the final request URL, including query parameters. */
    buildUrl(path: string, params?: QueryParams): URL;
    private requestWithRefresh;
    private refreshSession;
    private sendWithRetries;
    private sendOnce;
    private prepareHeaders;
    private parseResponse;
    private shouldRetryMethod;
    private delayForAttempt;
    private pathForError;
}

/** Linxio realtime Socket.IO namespace. */
type LinxioRealtimeNamespace = "coordinates" | "notifications";
/** Live vehicle position payload received from the coordinates socket. */
type LinxioTrackingPosition = LinxioRecord & LatLng & {
    address?: string | null;
    deviceId?: LinxioId;
    driverId?: LinxioId | null;
    heading?: number | null;
    speed?: number | null;
    ts?: ISODateString;
    vehicleId: LinxioId;
};
/** Notification payload received from the notifications socket. */
type LinxioNotification = LinxioRecord & {
    id?: LinxioId;
    message?: string;
    occurredAt?: ISODateString;
    readAt?: ISODateString | null;
    type?: string;
    vehicleId?: LinxioId | null;
};
/** Acknowledgement returned by Linxio's realtime `subscribe` event. */
type LinxioRealtimeSubscribeAck = {
    error?: string;
    success?: boolean;
    [key: string]: unknown;
};
/** Subscription handle for code that prefers object cleanup. */
type LinxioRealtimeSubscription = {
    unsubscribe: () => void;
};

/** Configuration for Linxio Socket.IO connections. */
type RealtimeClientOptions = {
    /** Realtime host. Defaults to `https://track.linxio.com`. */
    baseUrl?: string;
    /** Token provider used when `connect()` is called without an explicit token. */
    getToken?: () => string | undefined;
    /** Socket.IO path. Linxio uses `/socket.io`. */
    path?: string;
    /** Maximum reconnection attempts before Socket.IO gives up. */
    reconnectionAttempts?: number;
};
/** Handler called when a realtime payload is received. */
type RealtimeEventHandler<TPayload> = (payload: TPayload) => void;
/** Function returned by realtime listeners to detach the handler. */
type RealtimeUnsubscribe = () => void;
/**
 * Socket.IO client for Linxio live tracking and notifications.
 *
 * Linxio documents two namespaces: `coordinates` for live vehicle positions and
 * `notifications` for configured notification messages.
 */
declare class RealtimeClient {
    private readonly baseUrl;
    private readonly getToken;
    private readonly path;
    private readonly reconnectionAttempts;
    private readonly sockets;
    constructor(options?: RealtimeClientOptions);
    /** Connect to a Linxio realtime namespace and reuse existing sockets. */
    connect(namespace: LinxioRealtimeNamespace, token?: string | undefined): Socket;
    /** Subscribe the current realtime socket to a set of vehicle IDs. */
    subscribe(vehicleIds: readonly LinxioId[], namespace?: LinxioRealtimeNamespace): Promise<LinxioRealtimeSubscribeAck>;
    /**
     * Subscribe to live vehicle coordinates.
     *
     * The returned function removes event handlers. It does not disconnect the
     * socket, allowing other subscriptions to keep running.
     */
    onPosition(vehicleIds: readonly LinxioId[], handler: RealtimeEventHandler<LinxioTrackingPosition>): RealtimeUnsubscribe;
    /** Listen for Linxio notification messages. */
    onNotification(handler: RealtimeEventHandler<LinxioNotification>): RealtimeUnsubscribe;
    /** Listen for a custom notification event type emitted by Linxio. */
    onNotificationType<TPayload = LinxioNotification>(type: string, handler: RealtimeEventHandler<TPayload>): RealtimeUnsubscribe;
    /** Disconnect one namespace or every active realtime socket. */
    disconnect(namespace?: LinxioRealtimeNamespace): void;
}

/** Context attached to SDK errors. */
type LinxioErrorContext = {
    cause?: unknown;
    method?: string;
    path?: string;
    requestId?: string;
};
/** Base class for all SDK-defined errors. */
declare class LinxioError extends Error {
    readonly cause?: unknown;
    readonly method?: string;
    readonly path?: string;
    readonly requestId?: string;
    constructor(message: string, context?: LinxioErrorContext);
}
/** Thrown when the SDK is missing required runtime configuration. */
declare class LinxioConfigurationError extends LinxioError {
    constructor(message: string, context?: LinxioErrorContext);
}
/** Thrown when a request fails before Linxio returns an HTTP response. */
declare class LinxioNetworkError extends LinxioError {
    constructor(message: string, context?: LinxioErrorContext);
}
/** Thrown when a request exceeds its configured timeout. */
declare class LinxioTimeoutError extends LinxioNetworkError {
    constructor(message: string, context?: LinxioErrorContext);
}
/** Context attached to {@link LinxioApiError}. */
type LinxioApiErrorContext = LinxioErrorContext & {
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
declare class LinxioApiError extends LinxioError {
    readonly body?: unknown;
    readonly headers?: Headers;
    readonly status: number;
    readonly statusText?: string;
    constructor(message: string, context: LinxioApiErrorContext);
    get isAuthenticationError(): boolean;
    get isRateLimitError(): boolean;
    get isValidationError(): boolean;
}
/** Thrown for SDK-side authentication failures before an API response exists. */
declare class LinxioAuthenticationError extends LinxioError {
    constructor(message: string, context?: LinxioErrorContext);
}
/** Thrown when client-side validation fails. */
declare class LinxioValidationError extends LinxioError {
    readonly issues?: unknown;
    constructor(message: string, context?: LinxioErrorContext & {
        issues?: unknown;
    });
}
/** Thrown by the realtime Socket.IO client. */
declare class LinxioRealtimeError extends LinxioError {
    constructor(message: string, context?: LinxioErrorContext);
}

/** Successful SDK operation result. */
type LinxioSuccess<TData> = {
    /** Data returned by Linxio. */
    data: TData;
    /** Always `null` when the operation succeeds. */
    error: null;
};
/** Failed SDK operation result. */
type LinxioFailure<TError extends LinxioError = LinxioError> = {
    /** Always `null` when the operation fails. */
    data: null;
    /** Typed SDK error with request context where available. */
    error: TError;
};
/** Standard result returned by SDK service methods. */
type LinxioResult<TData, TError extends LinxioError = LinxioError> = LinxioFailure<TError> | LinxioSuccess<TData>;
/** Successful paginated SDK result. */
type LinxioPageSuccess<TData> = LinxioPaginationMeta & {
    /** Additional fields returned by selected Linxio endpoints. */
    additionalFields?: Record<string, unknown>;
    /** Aggregation data returned by selected Linxio endpoints. */
    aggregations?: unknown;
    /** Records returned for the current page. */
    data: TData[];
    /** Always `null` when the operation succeeds. */
    error: null;
    /** Normalized pagination metadata. */
    meta: LinxioPaginationMeta;
};
/** Failed paginated SDK result. */
type LinxioPageFailure<TError extends LinxioError = LinxioError> = {
    /** Always `null` when the operation fails. */
    data: null;
    /** Typed SDK error with request context where available. */
    error: TError;
    /** Page limit is unavailable when the request fails. */
    limit: null;
    /** Pagination metadata is unavailable when the request fails. */
    meta: null;
    /** Page number is unavailable when the request fails. */
    page: null;
    /** Total count is unavailable when the request fails. */
    total: null;
};
/** Paginated result returned by SDK list/report methods. */
type LinxioPageResult<TData, TError extends LinxioError = LinxioError> = LinxioPageFailure<TError> | LinxioPageSuccess<TData>;
/** Create a successful result object. */
declare function ok<TData>(data: TData): LinxioSuccess<TData>;
/** Create a failed result object from an unknown thrown value. */
declare function fail(error: unknown): LinxioFailure<LinxioError>;
/** Convert a throwing promise factory into a standard SDK result. */
declare function toResult<TData>(operation: () => Promise<TData>): Promise<LinxioResult<TData>>;
/** Create a successful paginated result object. */
declare function pageOk<TData>(page: LinxioPage<TData>): LinxioPageSuccess<TData>;
/** Create a failed paginated result object from an unknown thrown value. */
declare function pageFail(error: unknown): LinxioPageFailure<LinxioError>;
/** Return `true` when a result contains a typed SDK error. */
declare function isLinxioFailure(result: LinxioPageResult<unknown> | LinxioResult<unknown>): result is LinxioFailure | LinxioPageFailure;
/** Return the data from a result or throw the contained SDK error. */
declare function unwrapLinxioResult<TData>(result: LinxioResult<TData>): TData;
/** Return the page result or throw the contained SDK error. */
declare function unwrapLinxioPageResult<TData>(result: LinxioPageResult<TData>): LinxioPageSuccess<TData>;
/** Convert arbitrary thrown values into the SDK base error type. */
declare function toLinxioError(error: unknown): LinxioError;

/** Linxio team type returned by login and current-user endpoints. */
type LinxioTeamType = "admin" | "client" | "reseller" | (string & {});
/** Credentials for `client.auth.login()`. */
type LinxioLoginRequest = {
    domain?: string;
    email: string;
    password: string;
};
/** Response returned by the documented `/login` endpoint. */
type LinxioLoginResponse = {
    expireAt?: ISODateString;
    loginWithId?: boolean;
    otp_required?: boolean;
    refreshToken?: string;
    roleId?: LinxioId;
    teamType?: LinxioTeamType;
    token: string;
};
/** Response returned by `/token/refresh`. */
type LinxioRefreshTokenResponse = {
    expireAt?: ISODateString;
    refreshToken?: string;
    token: string;
};
/** In-memory token state used by {@link import("../client").LinxioClient}. */
type LinxioSession = {
    expireAt?: ISODateString;
    refreshToken?: string;
    token?: string;
};
/** Payload for OTP verification when Linxio requires a one-time password. */
type LinxioOtpVerificationRequest = {
    code: string;
    email: string;
};
/** Current-user object returned by `/me`; fields vary by role and requested selectors. */
type LinxioCurrentUser = JsonObject & {
    dateFormat?: string;
    email?: string;
    fullName?: string;
    id?: LinxioId;
    permissions?: string[];
    team?: JsonObject & {
        clientId?: LinxioId;
        id?: LinxioId;
        name?: string;
        resellerId?: LinxioId;
    };
    teamType?: LinxioTeamType;
};

declare abstract class BaseService {
    protected readonly http: HttpClient;
    constructor(http: HttpClient);
    protected getPage<TData, TField extends string = string>(path: string, params?: ListParams<TField>, options?: LinxioHttpRequestOptions): Promise<LinxioPageResult<TData>>;
    protected result<TData>(operation: () => Promise<TData>): Promise<LinxioResult<TData>>;
    protected listParams<TField extends string>(params?: ListParams<TField>): QueryParams;
}

/** Authentication and session-related Linxio endpoints. */
declare class AuthService extends BaseService {
    private readonly setSession;
    constructor(http: HttpClient, setSession: (session: LinxioSession) => void);
    /**
     * Log in with Linxio credentials.
     *
     * The returned JWT and refresh token are stored in the parent client so
     * subsequent requests are authenticated automatically.
     */
    login(request: LinxioLoginRequest): Promise<LinxioResult<LinxioLoginResponse>>;
    /** Verify a one-time password when Linxio requires OTP for the account. */
    verifyOtp(request: LinxioOtpVerificationRequest): Promise<LinxioResult<LinxioLoginResponse>>;
    /** Refresh a JWT manually and update the client session. */
    refresh(refreshToken: string): Promise<LinxioResult<LinxioSession>>;
    /** Fetch the current authenticated Linxio user. */
    me(fields?: FieldSelector<string>): Promise<LinxioResult<LinxioCurrentUser>>;
    /** Log out the current Linxio session server-side. */
    logout(): Promise<LinxioResult<void>>;
    private applySession;
}

/** Dash cam event endpoints discovered from the dashboard bundle. */
declare class CamerasService extends BaseService {
    /** List camera events. */
    events(params?: ListParams): Promise<LinxioPageResult<LinxioRecord>>;
    /** List camera event types. */
    eventTypes(): Promise<LinxioResult<LinxioRecord[]>>;
}

/** Client account record. */
type LinxioClientAccount = LinxioRecord & {
    id: LinxioId;
    name?: string | null;
    timezone?: LinxioId | null;
};
/** Parameters for client user list endpoints. */
type LinxioClientUserListParams = ListParams & {
    role?: string;
};
/** Reseller account record. */
type LinxioReseller = LinxioRecord & {
    id: LinxioId;
    name?: string | null;
};

/** Common field names for user list responses. */
type UserField = "id" | "email" | "fullName" | "name" | "surname" | "role" | "status" | (string & {});
/** User record returned by Linxio user endpoints. */
type LinxioUser = LinxioRecord & {
    email?: string | null;
    fullName?: string | null;
    id: LinxioId;
    name?: string | null;
    role?: string | null;
    status?: string | null;
    surname?: string | null;
};
/** Payload for creating or updating a user. */
type LinxioUserPayload = LinxioRecord & {
    email?: string;
    firstName?: string;
    fullName?: string;
    lastName?: string;
    name?: string;
    phone?: string;
    roleId?: LinxioId;
    surname?: string;
};
/** Parameters for `client.users.list()`. */
type LinxioUserListParams = ListParams<UserField> & {
    role?: string;
};

/** Client account and client-user endpoints. */
declare class ClientsService extends BaseService {
    /** List client accounts from the dashboard-derived endpoint. */
    list(params?: LinxioClientUserListParams): Promise<LinxioPageResult<LinxioClientAccount>>;
    /** Fetch one client account by ID. */
    get(clientId: LinxioId): Promise<LinxioResult<LinxioClientAccount>>;
    /** List users for a client account. */
    listUsers(clientId: LinxioId, params?: LinxioClientUserListParams): Promise<LinxioPageResult<LinxioUser>>;
    /** Load every user page for a client account into a single result. */
    iterateUsers(clientId: LinxioId, params?: LinxioClientUserListParams): Promise<LinxioResult<LinxioUser[]>>;
    /** Stream users for a client account without loading every user at once. */
    streamUsers(clientId: LinxioId, params?: LinxioClientUserListParams): AsyncGenerator<LinxioUser, void, undefined>;
    /** Create a user within a client account. */
    createUser(clientId: LinxioId, payload: LinxioUserPayload): Promise<LinxioResult<LinxioUser>>;
    /** Update a user within a client account. */
    updateUser(clientId: LinxioId, userId: LinxioId, payload: LinxioUserPayload): Promise<LinxioResult<LinxioUser>>;
    /** Fetch one user within a client account. */
    getUser(clientId: LinxioId, userId: LinxioId): Promise<LinxioResult<LinxioUser>>;
}
/** Reseller endpoints discovered from the dashboard bundle. */
declare class ResellersService extends BaseService {
    /** List reseller accounts. */
    list(): Promise<LinxioResult<LinxioReseller[]>>;
    /** Fetch one reseller account by ID. */
    get(resellerId: LinxioId): Promise<LinxioResult<LinxioReseller>>;
}

/** Common field names for Linxio device list responses. */
type DeviceField = "id" | "imei" | "serial" | "status" | "vehicle" | "usage" | "vendor" | "model" | "trackerData" | "deviceInstallation" | (string & {});
/** Device record returned by Linxio device endpoints. */
type LinxioDevice = LinxioRecord & {
    createdAt?: ISODateString | null;
    createdBy?: LinxioUserAuditSummary | null;
    deviceInstallation?: LinxioDeviceInstallation | null;
    hasCameras?: boolean;
    hw?: string | null;
    iccid?: string | null;
    id: LinxioId;
    imei?: string | null;
    imsi?: string | null;
    installDate?: ISODateString | null;
    isDeactivated?: boolean;
    isFixWithSpeed?: boolean;
    isUnavailable?: boolean;
    lastActiveTime?: ISODateString | null;
    lastCoordinates?: (LatLng & {
        ts?: ISODateString;
    }) | null;
    lastDataReceivedAt?: ISODateString | null;
    model?: LinxioDeviceModel | string | null;
    phone?: string | null;
    port?: number | null;
    professionalInstall?: boolean | null;
    serial?: string | null;
    sn?: string | null;
    status?: string | null;
    statusExt?: string | null;
    statusUpdatedAt?: ISODateString | null;
    sw?: string | null;
    team?: LinxioTeamSummary | null;
    trackerData?: LinxioRecord | null;
    uninstallDate?: ISODateString | null;
    updatedAt?: ISODateString | null;
    updatedBy?: LinxioUserAuditSummary | null;
    usage?: string | null;
    vehicleId?: LinxioId | null;
    vendor?: LinxioDeviceVendor | string | null;
};
/** Parameters for `client.devices.list()`. */
type LinxioDeviceListParams = ListParams<DeviceField>;
/** Payload for creating or updating a device. */
type LinxioDevicePayload = LinxioRecord & {
    imei?: string;
    serial?: string;
    typeId?: LinxioId;
    usage?: string;
    vendorId?: LinxioId;
};
/** Payload for installing a device into a vehicle. */
type LinxioDeviceInstallationPayload = LinxioRecord & {
    installedAt?: ISODateString;
    odometer?: number;
    vehicleId: LinxioId;
};
/** Payload for uninstalling a device from a vehicle. */
type LinxioDeviceUninstallPayload = LinxioRecord & {
    odometer?: number;
    uninstalledAt?: ISODateString;
};
/** Coordinate reported by a device. */
type LinxioDeviceCoordinate = LinxioRecord & LatLng & {
    deviceId?: LinxioId;
    id?: LinxioId;
    ts?: ISODateString;
};
/** Optional filters for recent device coordinates. */
type LinxioDeviceCoordinateParams = DateRangeParams & QueryParams & {
    filter?: string;
    sameTimeEachDay?: boolean;
};
/** Lookup parameters for the live `/devices/installation/` endpoint. */
type LinxioDeviceInstallationLookupParams = QueryParams & {
    deviceImei?: string;
    vehicleRegNo?: string;
};
/** Device vendor record from the dashboard-derived vendor endpoint. */
type LinxioDeviceVendor = LinxioRecord & {
    id?: LinxioId;
    models?: LinxioDeviceModel[];
    name?: string;
};
/** Device model nested under vendor and device responses. */
type LinxioDeviceModel = LinxioRecord & {
    id?: LinxioId;
    name?: string;
    vendorId?: LinxioId;
};
/** Device installation row from the dashboard-derived installation endpoint. */
type LinxioDeviceInstallation = LinxioRecord & {
    device?: LinxioRecord | null;
    deviceId?: LinxioId;
    files?: LinxioRecord[];
    id?: LinxioId;
    installDate?: ISODateString | null;
    installedAt?: ISODateString | null;
    odometer?: number | null;
    uninstallDate?: ISODateString | null;
    uninstalledAt?: ISODateString | null;
    vehicle?: LinxioRecord | null;
    vehicleId?: LinxioId;
};
/** Camera record associated with a device. */
type LinxioDeviceCamera = LinxioRecord & {
    deviceId?: LinxioId;
    expiredAt?: ISODateString | null;
    id?: LinxioId;
    isAvailable?: boolean;
    name?: string;
    status?: string;
    type?: string;
    url?: string;
};
type LinxioTeamSummary = LinxioRecord & {
    clientId?: LinxioId | null;
    clientName?: string | null;
    id?: LinxioId;
    resellerId?: LinxioId | null;
    resellerName?: string | null;
    type?: string;
};
type LinxioUserAuditSummary = LinxioRecord & {
    email?: string | null;
    fullName?: string | null;
    id?: LinxioId;
    teamType?: string | null;
};

/** Common field names for Linxio sensor list responses. */
type SensorField = "id" | "label" | "sensorId" | "systemStatus" | "team" | "type" | (string & {});
/** Sensor record returned by Linxio sensor endpoints. */
type LinxioSensor = LinxioRecord & {
    createdAt?: ISODateString | null;
    createdBy?: LinxioRecord | null;
    deviceId?: LinxioId | null;
    id: LinxioId;
    isAutoCreated?: boolean;
    label?: string | null;
    name?: string | null;
    sensorId?: string | null;
    systemStatus?: string | null;
    team?: LinxioRecord | null;
    type?: string | null;
    updatedAt?: ISODateString | null;
    updatedBy?: LinxioRecord | null;
    vehicleId?: LinxioId | null;
};
/** Parameters for `client.sensors.list()`. */
type LinxioSensorListParams = ListParams<SensorField>;
/** Temperature/humidity reading returned by sensor reports. */
type LinxioTemperatureHumidityReading = LinxioRecord & {
    humidity?: number | null;
    occurredAt?: ISODateString;
    sensorId?: LinxioId;
    temperature?: number | null;
    vehicleId?: LinxioId;
};
/** Parameters for temperature/humidity sensor reports. */
type LinxioSensorReportParams = DateRangeParams & ListParams & {
    sensorId?: LinxioId;
    vehicleId?: LinxioId;
};

/** Device inventory, install, uninstall, coordinate, and sensor endpoints. */
declare class DevicesService extends BaseService {
    /** List devices using Linxio's documented `/devices/json` endpoint. */
    list(params?: LinxioDeviceListParams): Promise<LinxioPageResult<LinxioDevice>>;
    /** Load every device page into a single result. */
    iterate(params?: LinxioDeviceListParams): Promise<LinxioResult<LinxioDevice[]>>;
    /** Stream every device page without loading the whole inventory at once. */
    stream(params?: LinxioDeviceListParams): AsyncGenerator<LinxioDevice, void, undefined>;
    /** Fetch one device by internal Linxio device ID. */
    get(deviceId: LinxioId): Promise<LinxioResult<LinxioDevice>>;
    /** Create a device. */
    create(payload: LinxioDevicePayload): Promise<LinxioResult<LinxioDevice>>;
    /** Update a device using Linxio's documented PATCH endpoint. */
    update(deviceId: LinxioId, payload: LinxioDevicePayload): Promise<LinxioResult<LinxioDevice>>;
    /** Install a device into a vehicle. */
    install(deviceId: LinxioId, payload: LinxioDeviceInstallationPayload): Promise<LinxioResult<LinxioDevice>>;
    /** Uninstall a device from its current vehicle. */
    uninstall(deviceId: LinxioId, payload?: LinxioDeviceUninstallPayload): Promise<LinxioResult<LinxioDevice>>;
    /** Soft-archive a device when the dashboard endpoint is available. */
    archive(deviceId: LinxioId): Promise<LinxioResult<void>>;
    /** Restore a previously archived device. */
    restore(deviceId: LinxioId): Promise<LinxioResult<void>>;
    /** Fetch recent coordinates for a device from the dashboard-derived endpoint. */
    coordinates(deviceId: LinxioId, params?: LinxioDeviceCoordinateParams): Promise<LinxioResult<LinxioDeviceCoordinate[]>>;
    /** List sensor history rows for a device. */
    sensors(deviceId: LinxioId, params?: LinxioSensorListParams): Promise<LinxioPageResult<LinxioSensor>>;
    /** Fetch device history entries from the dashboard-derived endpoint. */
    history(deviceId: LinxioId): Promise<LinxioResult<LinxioRecord[]>>;
    /** List device vendors from the dashboard-derived endpoint. */
    vendors(): Promise<LinxioResult<LinxioDeviceVendor[]>>;
    /** Look up a device installation by device IMEI or vehicle registration. */
    installation(params?: LinxioDeviceInstallationLookupParams): Promise<LinxioResult<LinxioDeviceInstallation | null>>;
    /** Backwards-compatible alias for `installation()`. */
    installations(params?: LinxioDeviceInstallationLookupParams): Promise<LinxioResult<LinxioDeviceInstallation | null>>;
    /** List cameras attached to a device from the dashboard-derived endpoint. */
    cameras(deviceId: LinxioId): Promise<LinxioResult<LinxioDeviceCamera[]>>;
}

/** Common field names for driver list responses. */
type DriverField = "id" | "fullName" | "name" | "surname" | "email" | "phone" | "role" | (string & {});
/** Driver user record. */
type LinxioDriver = LinxioRecord & {
    email?: string | null;
    fullName?: string | null;
    id: LinxioId;
    name?: string | null;
    phone?: string | null;
    surname?: string | null;
};
/** Parameters for `client.drivers.list()`. */
type LinxioDriverListParams = ListParams<DriverField> & {
    clientId?: LinxioId;
};

/** Driver listing and vehicle assignment endpoints. */
declare class DriversService extends BaseService {
    /** List drivers, optionally via the documented client-users driver endpoint. */
    list(params?: LinxioDriverListParams): Promise<LinxioPageResult<LinxioDriver>>;
    /** Load every driver page into a single result. */
    iterate(params?: LinxioDriverListParams): Promise<LinxioResult<LinxioDriver[]>>;
    /** Stream every driver page without loading every driver at once. */
    stream(params?: LinxioDriverListParams): AsyncGenerator<LinxioDriver, void, undefined>;
    /** Assign a driver to a vehicle. */
    assignToVehicle(vehicleId: LinxioId, driverId: LinxioId): Promise<LinxioResult<void>>;
    /** Unassign a driver from a vehicle. */
    unassignFromVehicle(vehicleId: LinxioId, driverId: LinxioId): Promise<LinxioResult<void>>;
}

/** Common field names for fuel record list responses. */
type FuelRecordField = "transactionDate" | "vehicleIds" | "driverId" | "refueled" | "total" | "fuelPrice" | "petrolStation" | (string & {});
/** Fuel transaction record. */
type LinxioFuelRecord = LinxioRecord & {
    driver?: string | null;
    fuelCardNumber?: string | null;
    fuelPrice?: number | null;
    id: LinxioId;
    petrolStation?: string | null;
    refueled?: number | null;
    total?: number | null;
    transactionDate?: ISODateString;
    vehicle?: LinxioRecord | null;
};
/** Fuel summary row. */
type LinxioFuelSummaryRecord = LinxioRecord & {
    depot?: string | null;
    groups?: string | null;
    mileage?: number | null;
    refueled?: number | null;
    regNo?: string | null;
    total?: number | null;
};
/** Parameters for fuel list and summary endpoints. */
type LinxioFuelListParams = ListParams<FuelRecordField>;
/** Fuel card record. */
type LinxioFuelCard = LinxioRecord & {
    cardNumber?: string;
    id: LinxioId;
    vehicleId?: LinxioId | null;
};

/** Fuel card, fuel transaction, and fuel summary endpoints. */
declare class FuelService extends BaseService {
    /** List fuel transaction records from the dashboard-derived endpoint. */
    records(params?: LinxioFuelListParams): Promise<LinxioPageResult<LinxioFuelRecord>>;
    /** Load every fuel transaction page into a single result. */
    iterateRecords(params?: LinxioFuelListParams): Promise<LinxioResult<LinxioFuelRecord[]>>;
    /** Stream fuel transaction records without loading every record at once. */
    streamRecords(params?: LinxioFuelListParams): AsyncGenerator<LinxioFuelRecord, void, undefined>;
    /** Fetch fuel summary rows. */
    summary(params?: LinxioFuelListParams): Promise<LinxioPageResult<LinxioFuelSummaryRecord>>;
    /** Fetch fuel transaction records grouped or filtered by vehicle. */
    recordsByVehicle(params?: LinxioFuelListParams): Promise<LinxioPageResult<LinxioFuelRecord>>;
    /** List fuel cards. */
    cards(params?: LinxioFuelListParams): Promise<LinxioPageResult<LinxioFuelCard>>;
    /** List fuel types configured by Linxio. */
    fuelTypes(): Promise<LinxioResult<LinxioRecord[]>>;
    /** Assign a fuel transaction to a vehicle. */
    assignTransaction(recordId: LinxioId, vehicleId: LinxioId): Promise<LinxioResult<LinxioFuelRecord>>;
}

/** Shape type accepted by Linxio geofence/area endpoints. */
type GeofenceType = "circle" | "polygon" | "polyline" | "rectangle" | (string & {});
/** Geofence object. Linxio's API calls these `areas`. */
type LinxioGeofence = LinxioRecord & {
    color?: string | null;
    coordinates?: LatLng[];
    id: LinxioId;
    name: string;
    radius?: number | null;
    type?: GeofenceType;
};
/** Parameters for `client.geofences.list()`. */
type LinxioGeofenceListParams = ListParams;
/** Payload for creating or updating a geofence. */
type LinxioGeofencePayload = LinxioRecord & {
    color?: string;
    coordinates?: LatLng[];
    name: string;
    radius?: number;
    type: GeofenceType;
};
/** Dashboard area group record. */
type LinxioAreaGroup = LinxioRecord & {
    id: LinxioId;
    name: string;
};
/** Payload accepted by dashboard-derived area group endpoints. */
type LinxioAreaGroupPayload = LinxioRecord & {
    name: string;
};

/** Geofence/area endpoints. Linxio calls geofences `areas` in the API. */
declare class GeofencesService extends BaseService {
    /** List geofence objects. */
    list(params?: LinxioGeofenceListParams): Promise<LinxioPageResult<LinxioGeofence>>;
    /** Load every geofence page into a single result. */
    iterate(params?: LinxioGeofenceListParams): Promise<LinxioResult<LinxioGeofence[]>>;
    /** Stream every geofence page without loading every geofence at once. */
    stream(params?: LinxioGeofenceListParams): AsyncGenerator<LinxioGeofence, void, undefined>;
    /** Fetch one geofence by Linxio area ID. */
    get(areaId: LinxioId): Promise<LinxioResult<LinxioGeofence>>;
    /** Create a geofence object. */
    create(payload: LinxioGeofencePayload): Promise<LinxioResult<LinxioGeofence>>;
    /** Update a geofence object using the dashboard-derived endpoint. */
    update(areaId: LinxioId, payload: Partial<LinxioGeofencePayload>): Promise<LinxioResult<LinxioGeofence>>;
    /** Permanently delete a geofence object. Prefer `archive()` if you need reversibility. */
    delete(areaId: LinxioId): Promise<LinxioResult<void>>;
    /** Soft-archive a geofence object when the dashboard endpoint is available. */
    archive(areaId: LinxioId): Promise<LinxioResult<void>>;
    /** Restore a previously archived geofence object. */
    restore(areaId: LinxioId): Promise<LinxioResult<void>>;
    /** List area groups from the dashboard-derived endpoint. */
    listGroups(): Promise<LinxioResult<LinxioAreaGroup[]>>;
    /** Fetch one area group from the dashboard-derived endpoint. */
    getGroup(groupId: LinxioId): Promise<LinxioResult<LinxioAreaGroup>>;
    /** Create an area group from the dashboard-derived endpoint. */
    createGroup(payload: LinxioAreaGroupPayload): Promise<LinxioResult<LinxioAreaGroup>>;
    /** Update an area group from the dashboard-derived endpoint. */
    updateGroup(groupId: LinxioId, payload: Partial<LinxioAreaGroupPayload>): Promise<LinxioResult<LinxioAreaGroup>>;
    /** Delete an area group. Prefer archive/restore when reversibility matters. */
    deleteGroup(groupId: LinxioId): Promise<LinxioResult<void>>;
    /** Soft-archive an area group from the dashboard-derived endpoint. */
    archiveGroup(groupId: LinxioId): Promise<LinxioResult<void>>;
    /** Restore an archived area group from the dashboard-derived endpoint. */
    restoreGroup(groupId: LinxioId): Promise<LinxioResult<void>>;
}

/**
 * Shared shape for dashboard reference-data records whose complete schema is
 * tenant-configurable or not fully visible in the captured dashboard bundles.
 */
type LinxioMetadataRecord = LinxioRecord & {
    /** Stable identifier when the endpoint returns one. */
    id?: LinxioId;
    /** Machine-readable code, slug, or setting key. */
    code?: string;
    /** Human-readable label. */
    label?: string;
    /** Human-readable name. */
    name?: string;
    /** Sort order used by dashboard dropdowns. */
    order?: number;
    /** Machine-readable value used by dashboard dropdowns. */
    value?: string;
};
/** Country map returned by the dashboard country reference endpoint. */
type LinxioCountryMap = Record<string, string>;
/** @deprecated Use `LinxioCountryMap`; Linxio returns a keyed map, not rows. */
type LinxioCountry = LinxioCountryMap;
/** Role option returned by the dashboard roles endpoint. */
type LinxioRole = LinxioMetadataRecord & {
    /** Role display name. */
    name?: string;
    /** Role scope or team type when supplied. */
    type?: string;
};
/** Plan option returned by the dashboard plans endpoint. */
type LinxioPlan = LinxioMetadataRecord & {
    /** Plan display name. */
    name?: string;
};
/** Timezone option returned by the dashboard timezones endpoint. */
type LinxioTimezone = LinxioMetadataRecord & {
    /** IANA timezone name or Linxio timezone value. */
    name?: string;
    /** UTC offset label when supplied. */
    offset?: string;
};
/** Theme definition returned by the dashboard theme endpoints. */
type LinxioTheme = LinxioMetadataRecord & {
    /** Theme display name. */
    name?: string;
};
/** Current-plan permission keys returned by Linxio. */
type LinxioCurrentPlan = string[];
/** Platform domain settings used by hosted Linxio tenants. */
type LinxioPlatformDomain = LinxioRecord & {
    /** Tenant domain when supplied. */
    domain?: string;
    /** Hostname when supplied. */
    host?: string;
};
/** Language option returned by the dashboard language settings endpoint. */
type LinxioLanguage = LinxioMetadataRecord & {
    /** Locale or language code. */
    code?: string;
    /** Language display name. */
    name?: string;
};
/** Tenant/user/role scoped setting returned by dashboard settings endpoints. */
type LinxioSettingRecord = LinxioRecord & {
    id?: LinxioId | string;
    name?: string;
    role?: LinxioRecord | null;
    team?: LinxioRecord | null;
    user?: LinxioRecord | null;
    value?: unknown;
};
/** Map API provider option returned by Linxio settings. */
type LinxioMapApiOption = LinxioSettingRecord;
/** Provider setting returned by the dashboard provider endpoint. */
type LinxioProviderSetting = LinxioSettingRecord;
/** Digital-form feature settings returned by Linxio. */
type LinxioDigitalFormSettings = LinxioSettingRecord;
/** Eco-speed feature settings returned by Linxio. */
type LinxioEcoSpeedSettings = LinxioSettingRecord;
/** Excessive-idling feature settings returned by Linxio. */
type LinxioExcessiveIdlingSettings = LinxioSettingRecord;

/** Read-only dashboard reference data and tenant settings. */
declare class MetadataService extends BaseService {
    /** Fetch country options as a map keyed by country code. */
    countries(): Promise<LinxioResult<LinxioCountryMap>>;
    /** List user roles available to the authenticated Linxio account. */
    roles(): Promise<LinxioResult<LinxioRole[]>>;
    /** List plan definitions visible to the authenticated Linxio account. */
    plans(): Promise<LinxioResult<LinxioPlan[]>>;
    /** List timezone options used by Linxio tenant and user settings. */
    timezones(): Promise<LinxioResult<LinxioTimezone[]>>;
    /** List dashboard theme definitions. */
    themes(): Promise<LinxioResult<LinxioTheme[]>>;
    /** Fetch the current user's active dashboard theme. */
    myTheme(): Promise<LinxioResult<LinxioTheme>>;
    /** Fetch current-plan permission keys. */
    currentPlan(): Promise<LinxioResult<LinxioCurrentPlan>>;
    /** Fetch the hosted-domain settings for the current platform. */
    platformDomain(): Promise<LinxioResult<LinxioPlatformDomain>>;
    /** List language options used by Linxio settings screens. */
    languages(): Promise<LinxioResult<LinxioLanguage[]>>;
    /** Fetch the map API setting record for the current tenant. */
    mapApiOptions(): Promise<LinxioResult<LinxioMapApiOption>>;
    /** Fetch dashboard provider settings visible to the current account. */
    providers(): Promise<LinxioResult<LinxioProviderSetting>>;
    /** Fetch tenant-level digital-form settings. */
    digitalFormSettings(): Promise<LinxioResult<LinxioDigitalFormSettings>>;
    /** Fetch tenant-level eco-speed settings. */
    ecoSpeedSettings(): Promise<LinxioResult<LinxioEcoSpeedSettings>>;
    /** Fetch tenant-level excessive-idling settings. */
    excessiveIdlingSettings(): Promise<LinxioResult<LinxioExcessiveIdlingSettings>>;
}

/** Common parameters for report endpoints. */
type LinxioReportParams = DateRangeParams & ListParams & {
    format?: LinxioFileFormat;
};
/** Scheduled report record. */
type LinxioScheduledReport = LinxioRecord & {
    format?: LinxioFileFormat;
    id: LinxioId;
    name?: string;
    status?: "active" | "disabled" | (string & {});
    type?: string;
};
/** Payload for creating a scheduled report. */
type LinxioScheduledReportPayload = LinxioRecord & {
    format: LinxioFileFormat;
    name: string;
    params?: Record<string, unknown>;
    type: string;
};
/** Digital form record. */
type LinxioDigitalForm = LinxioRecord & {
    id: LinxioId;
    name?: string;
    status?: string;
};

/** Scheduled report endpoints discovered from the dashboard bundle. */
declare class ReportsService extends BaseService {
    /** List scheduled reports. */
    scheduled(params?: LinxioReportParams): Promise<LinxioPageResult<LinxioScheduledReport>>;
    /** Fetch the scheduled-report template used by the Linxio dashboard. */
    scheduledTemplate(): Promise<LinxioResult<LinxioRecord>>;
    /** Fetch one scheduled report. */
    getScheduled(reportId: LinxioId): Promise<LinxioResult<LinxioScheduledReport>>;
    /** Create a scheduled report. */
    createScheduled(payload: LinxioScheduledReportPayload): Promise<LinxioResult<LinxioScheduledReport>>;
    /** Update a scheduled report. */
    updateScheduled(reportId: LinxioId, payload: Partial<LinxioScheduledReportPayload>): Promise<LinxioResult<LinxioScheduledReport>>;
    /** Delete a scheduled report. */
    deleteScheduled(reportId: LinxioId): Promise<LinxioResult<void>>;
    /** Restore a scheduled report from the dashboard-derived endpoint. */
    restoreScheduled(reportId: LinxioId): Promise<LinxioResult<void>>;
}
/** Digital form endpoints discovered from the dashboard bundle. */
declare class DigitalFormsService extends BaseService {
    /** List digital forms. */
    list(): Promise<LinxioResult<LinxioDigitalForm[]>>;
    /** Fetch one digital form. */
    get(formId: LinxioId): Promise<LinxioResult<LinxioDigitalForm>>;
    /** Fetch one digital form answer. */
    answer(answerId: LinxioId): Promise<LinxioResult<LinxioRecord>>;
    /** Download a digital form answer as a PDF Blob. */
    answerPdf(answerId: LinxioId): Promise<LinxioResult<Blob>>;
}

/** Optional vehicle route fields. `coordinates` may produce very large responses. */
type RouteField = "coordinates" | "driver" | "vehicle" | "address" | (string & {});
/** One route coordinate point. */
type LinxioRouteCoordinate = LinxioRecord & LatLng & {
    id?: LinxioId;
    nullable?: boolean;
    ts?: ISODateString;
};
/** Start or finish point for a route segment. */
type LinxioRoutePoint = {
    address?: string | null;
    lastCoordinates?: (LatLng & {
        ts?: ISODateString;
    }) | null;
};
/** One route segment returned by Linxio. */
type LinxioVehicleRoute = LinxioRecord & {
    address?: string | null;
    avgSpeed?: number | null;
    comment?: string | null;
    coordinates?: LinxioRouteCoordinate[];
    deviceId?: LinxioId | null;
    distance?: number | string | null;
    driverId?: LinxioId | null;
    duration?: number | null;
    id: LinxioId;
    maxSpeed?: number | null;
    pointFinish?: LinxioRoutePoint | null;
    pointStart?: LinxioRoutePoint | null;
    scope?: unknown;
    type?: "driving" | "idle" | "stopped" | (string & {});
    vehicleId: LinxioId;
};
/** Route response group for a vehicle/driver pair. */
type LinxioVehicleRoutesGroup = LinxioRecord & {
    driverId?: LinxioId | null;
    routes: LinxioVehicleRoute[];
    vehicleId: LinxioId;
};
/** Parameters for `client.routes.getVehicleRoutes()`. */
type LinxioVehicleRoutesParams = DateRangeParams & Omit<ListParams<RouteField>, "fields"> & {
    fields?: RouteField[];
};

/** Vehicle route history endpoints. */
declare class RoutesService extends BaseService {
    /**
     * Fetch route history for a vehicle.
     *
     * Requesting `fields: ["coordinates"]` can return very large responses, so
     * only include coordinates when your script really needs every point.
     */
    getVehicleRoutes(vehicleId: LinxioId, params: LinxioVehicleRoutesParams): Promise<LinxioResult<LinxioVehicleRoutesGroup[]>>;
}

/** Sensor inventory and temperature/humidity report endpoints. */
declare class SensorsService extends BaseService {
    /** List sensors from the dashboard-derived endpoint. */
    list(params?: LinxioSensorListParams): Promise<LinxioPageResult<LinxioSensor>>;
    /** Load every sensor page into a single result. */
    iterate(params?: LinxioSensorListParams): Promise<LinxioResult<LinxioSensor[]>>;
    /** Stream sensors without loading the whole inventory at once. */
    stream(params?: LinxioSensorListParams): AsyncGenerator<LinxioSensor, void, undefined>;
    /** Fetch one sensor by internal Linxio sensor ID. */
    get(sensorId: LinxioId): Promise<LinxioResult<LinxioSensor>>;
    /** Install or pair a sensor with a device. */
    install(sensorId: LinxioId, deviceId: LinxioId): Promise<LinxioResult<LinxioSensor>>;
    /** Fetch the documented temperature/humidity report grouped by device sensor. */
    deviceTemperatureHumidityReport(params?: LinxioSensorReportParams): Promise<LinxioPageResult<LinxioTemperatureHumidityReading>>;
    /** Fetch the documented temperature/humidity report grouped by vehicle. */
    vehicleTemperatureHumidityReport(params?: LinxioSensorReportParams): Promise<LinxioPageResult<LinxioTemperatureHumidityReading>>;
    /** Load every device temperature/humidity report page into a single result. */
    iterateDeviceTemperatureHumidityReport(params?: LinxioSensorReportParams): Promise<LinxioResult<LinxioTemperatureHumidityReading[]>>;
    /** Stream the device temperature/humidity report one reading at a time. */
    streamDeviceTemperatureHumidityReport(params?: LinxioSensorReportParams): AsyncGenerator<LinxioTemperatureHumidityReading, void, undefined>;
}

/** User management endpoints. */
declare class UsersService extends BaseService {
    /** List users from the dashboard-derived endpoint. */
    list(params?: LinxioUserListParams): Promise<LinxioPageResult<LinxioUser>>;
    /** Load every user page into a single result. */
    iterate(params?: LinxioUserListParams): Promise<LinxioResult<LinxioUser[]>>;
    /** Stream every user page without loading every user at once. */
    stream(params?: LinxioUserListParams): AsyncGenerator<LinxioUser, void, undefined>;
    /** Fetch one user by ID. */
    get(userId: LinxioId): Promise<LinxioResult<LinxioUser>>;
    /** Create a user. */
    create(payload: LinxioUserPayload): Promise<LinxioResult<LinxioUser>>;
    /** Update a user. */
    update(userId: LinxioId, payload: LinxioUserPayload): Promise<LinxioResult<LinxioUser>>;
    /** Soft-archive a user. */
    archive(userId: LinxioId): Promise<LinxioResult<void>>;
    /** Restore a previously archived user. */
    restore(userId: LinxioId): Promise<LinxioResult<void>>;
}

/** Common field names for Linxio vehicle list responses. */
type VehicleField = "id" | "regNo" | "defaultLabel" | "model" | "depotName" | "depot" | "groupsList" | "groups" | "driver" | "type" | "typeId" | "typeName" | "make" | "makeModel" | "vin" | "deviceId" | "status" | "lastLoggedAt" | "lastCoordinates" | "todayData" | (string & {});
/** Vehicle record returned by Linxio vehicle endpoints. */
type LinxioVehicle = LinxioRecord & {
    areas?: LinxioVehicleAreaAssignment[];
    averageDailyMileage?: number | null;
    averageFuel?: number | null;
    co2Emissions?: number | null;
    createdAt?: ISODateString | null;
    createdBy?: LinxioUserAuditSummary | null;
    defaultLabel?: string | null;
    depot?: LinxioVehicleDepot | null;
    depotName?: string | null;
    deviceId?: LinxioId | null;
    driver?: LinxioVehicleDriver | string | null;
    driverId?: LinxioId | null;
    ecoSpeed?: number | null;
    emissionClass?: string | null;
    engineCapacity?: number | null;
    engineOnTime?: number | null;
    enginePower?: number | null;
    excessiveIdling?: number | null;
    fuelTankCapacity?: number | null;
    fuelType?: LinxioId | null;
    grossWeight?: number | null;
    groups?: LinxioVehicleGroup[];
    groupsList?: string | null;
    id: LinxioId;
    lastCoordinates?: (LatLng & {
        ts?: ISODateString;
    }) | null;
    lastLoggedAt?: ISODateString | null;
    make?: string | null;
    makeModel?: string | null;
    model?: string | null;
    picture?: string | null;
    regCertNo?: string | null;
    regDate?: ISODateString | null;
    regNo?: string | null;
    status?: string | null;
    team?: LinxioTeamSummary | null;
    teamId?: LinxioId | null;
    todayData?: {
        avgSpeed?: number;
        distance?: number;
        duration?: number;
        idleDuration?: number;
    } | null;
    type?: string | null;
    typeId?: LinxioId | null;
    typeName?: string | null;
    unavailableMessage?: string | null;
    updatedAt?: ISODateString | null;
    updatedBy?: LinxioUserAuditSummary | null;
    vin?: string | null;
    year?: number | null;
};
/** Depot object nested in vehicle responses. */
type LinxioVehicleDepot = LinxioRecord & {
    color?: string | null;
    createdAt?: ISODateString | null;
    id: LinxioId;
    name?: string | null;
    status?: LinxioId | string | null;
};
/** Vehicle group object nested in vehicle responses. */
type LinxioVehicleGroup = LinxioRecord & {
    color?: string | null;
    id: LinxioId;
    name?: string | null;
};
/** Current area assignment nested in vehicle responses. */
type LinxioVehicleAreaAssignment = LinxioRecord & {
    area?: LinxioRecord & {
        color?: string | null;
        id?: LinxioId;
        name?: string | null;
        status?: string | null;
    };
    arrived?: ISODateString | null;
    departed?: ISODateString | null;
    driverArrived?: ISODateString | null;
    driverDeparted?: ISODateString | null;
    id?: LinxioId;
};
/** Driver object nested in vehicle responses when a driver is assigned. */
type LinxioVehicleDriver = LinxioUser & {
    driverFOBId?: string | null;
    driverSensorId?: string | null;
    lastLoggedAt?: ISODateString | null;
    name?: string | null;
    surname?: string | null;
};
/** Parameters for `client.vehicles.list()`. */
type LinxioVehicleListParams = ListParams<VehicleField>;
/** Payload for creating or updating a vehicle. */
type LinxioVehiclePayload = LinxioRecord & {
    defaultLabel?: string;
    depotId?: LinxioId | null;
    groupIds?: LinxioId[];
    model?: string;
    regNo?: string;
    typeId?: LinxioId;
    vin?: string;
};
/** Vehicle odometer reading returned by Linxio. */
type LinxioOdometer = LinxioRecord & {
    accuracy?: number | null;
    deviceId?: LinxioId | null;
    driverId?: LinxioId | null;
    id?: LinxioId | null;
    isSyncedWithDevice?: boolean;
    lastTrackerRecordOccurredAt?: ISODateString | null;
    lastTrackerRecordOdometer?: number | null;
    occurredAt?: ISODateString | null;
    odometer: number;
    vehicleId: LinxioId;
};
/** Optional parameters for fetching odometer values. */
type LinxioOdometerParams = {
    occurredAt?: ISODateString;
};
/** Payload for recalibrating a vehicle odometer. */
type LinxioOdometerRecalibration = {
    occurredAt: ISODateString;
    odometer: number;
};
/** Current engine-hours reading for a vehicle. */
type LinxioEngineHours = LinxioRecord & {
    engineHours: number;
    id?: LinxioId;
    occurredAt?: ISODateString | null;
    prevEngineHours?: number | null;
    vehicleId: LinxioId;
};
/** Count response returned by dashboard-derived count endpoints. */
type LinxioCount = LinxioRecord & {
    count?: number;
    total?: number;
};
/** Vehicle type record returned by the dashboard-derived vehicle types endpoint. */
type LinxioVehicleType = LinxioRecord & {
    default?: string | null;
    driving?: string | null;
    id: LinxioId;
    idling?: string | null;
    name?: string;
    order?: number;
    status?: string | null;
    stopped?: string | null;
};
/** Optional filters accepted by `client.vehicles.count()`. */
type LinxioVehicleCountParams = QueryParams;
/** Parameters for `client.vehicles.types()`. */
type LinxioVehicleTypeParams = QueryParams & {
    limit?: number;
    sort?: string;
};

/** Vehicle inventory, odometer, and vehicle lifecycle endpoints. */
declare class VehiclesService extends BaseService {
    /** List vehicles using Linxio's documented `/vehicles/fields/json` endpoint. */
    list(params?: LinxioVehicleListParams): Promise<LinxioPageResult<LinxioVehicle>>;
    /** Load every vehicle page into a single result. */
    iterate(params?: LinxioVehicleListParams): Promise<LinxioResult<LinxioVehicle[]>>;
    /** Stream every vehicle page without loading the whole fleet at once. */
    stream(params?: LinxioVehicleListParams): AsyncGenerator<LinxioVehicle, void, undefined>;
    /** Fetch one vehicle by internal Linxio vehicle ID. */
    get(vehicleId: LinxioId): Promise<LinxioResult<LinxioVehicle>>;
    /** Create a vehicle. Validate payloads carefully against your Linxio tenant requirements. */
    create(payload: LinxioVehiclePayload): Promise<LinxioResult<LinxioVehicle>>;
    /** Update a vehicle using Linxio's documented POST update endpoint. */
    update(vehicleId: LinxioId, payload: LinxioVehiclePayload): Promise<LinxioResult<LinxioVehicle>>;
    /** Soft-archive a vehicle when the dashboard endpoint is available. */
    archive(vehicleId: LinxioId): Promise<LinxioResult<void>>;
    /** Restore a previously archived vehicle when the dashboard endpoint is available. */
    restore(vehicleId: LinxioId): Promise<LinxioResult<void>>;
    /** Get a vehicle odometer reading, optionally at a specific occurrence time. */
    getOdometer(vehicleId: LinxioId, params?: LinxioOdometerParams): Promise<LinxioResult<LinxioOdometer>>;
    /** Recalibrate a vehicle odometer in metres. */
    recalibrateOdometer(vehicleId: LinxioId, payload: LinxioOdometerRecalibration): Promise<LinxioResult<LinxioOdometer>>;
    /** Fetch current engine hours from the dashboard-derived endpoint. */
    getEngineHours(vehicleId: LinxioId): Promise<LinxioResult<LinxioEngineHours>>;
    /** Count vehicles using the dashboard-derived count endpoint. */
    count(params?: LinxioVehicleCountParams): Promise<LinxioResult<LinxioCount>>;
    /** List vehicle types using the dashboard-derived vehicle type endpoint. */
    types(params?: LinxioVehicleTypeParams): Promise<LinxioPageResult<LinxioVehicleType>>;
}

/**
 * Configuration for {@link createClient}.
 *
 * Pass `token` and `refreshToken` when you already have a Linxio session, or
 * call `client.auth.login()` and the SDK will keep the returned tokens in
 * memory for this client instance.
 */
type LinxioClientOptions = {
    /** Override the REST API base URL. Defaults to `https://api.linxio.com/api`. */
    baseUrl?: string;
    /** Custom fetch implementation for tests, proxies, or non-standard runtimes. */
    fetch?: FetchLike;
    /** Override the Socket.IO tracking host. Defaults to `https://track.linxio.com`. */
    realtimeBaseUrl?: string;
    /** Refresh token used for automatic 401 recovery. */
    refreshToken?: string;
    /** Retry policy for idempotent requests. */
    retry?: RetryOptions;
    /** Per-request timeout in milliseconds. Defaults to 30 seconds. */
    timeoutMs?: number;
    /** JWT bearer token used for authenticated requests. */
    token?: string;
};
/**
 * Main Linxio SDK entry point.
 *
 * Create one instance per Linxio account/session and reuse it across your app.
 * The client exposes domain services for common workflows and `request()` for
 * tenant-specific endpoints that are not represented by a service yet.
 *
 * @example
 * ```ts
 * import { createClient } from "@ambulancewa/linxio-js";
 *
 * const linxio = createClient();
 * await linxio.auth.login({ email, password });
 *
 * const { data, error } = await linxio.vehicles.list({
 *   fields: ["id", "regNo"],
 * });
 *
 * if (error) {
 *   throw error;
 * }
 *
 * console.log(data);
 * ```
 */
declare class LinxioClient {
    /** Authentication, session, and current-user helpers. */
    readonly auth: AuthService;
    /** Dash cam event helpers discovered from the dashboard bundle. */
    readonly cameras: CamerasService;
    /** Client account and client-user helpers. */
    readonly clients: ClientsService;
    /** Device inventory, install, uninstall, sensor, and coordinate helpers. */
    readonly devices: DevicesService;
    /** Digital forms and form answer helpers discovered from the dashboard bundle. */
    readonly digitalForms: DigitalFormsService;
    /** Driver listing and vehicle assignment helpers. */
    readonly drivers: DriversService;
    /** Fuel card, fuel record, and fuel summary helpers discovered from the dashboard bundle. */
    readonly fuel: FuelService;
    /** Geofence/area and area-group helpers. */
    readonly geofences: GeofencesService;
    /** Low-level HTTP client for advanced integrations. */
    readonly http: HttpClient;
    /** Read-only reference data and tenant settings discovered from the dashboard bundle. */
    readonly metadata: MetadataService;
    /** Socket.IO live tracking and notification client. */
    readonly realtime: RealtimeClient;
    /** Scheduled report helpers discovered from the dashboard bundle. */
    readonly reports: ReportsService;
    /** Reseller account helpers discovered from the dashboard bundle. */
    readonly resellers: ResellersService;
    /** Vehicle route history helpers. */
    readonly routes: RoutesService;
    /** Temperature/humidity sensor helpers. */
    readonly sensors: SensorsService;
    /** User management helpers. */
    readonly users: UsersService;
    /** Vehicle inventory, odometer, and engine-hours helpers. */
    readonly vehicles: VehiclesService;
    private currentSession;
    constructor(options?: LinxioClientOptions);
    /**
     * Replace or partially update the in-memory session used by this client.
     *
     * This is useful when you persist tokens yourself and want to hydrate a
     * client without calling `auth.login()` again.
     */
    setSession(session: LinxioSession): void;
    /** Return a copy of the current in-memory session. */
    session(): LinxioSession;
    /**
     * Send a raw API request with the same auth, retry, timeout, and refresh
     * behavior used by the domain services.
     */
    request<TResponse = unknown>(method: HttpMethod, path: string, options?: LinxioHttpRequestOptions): Promise<TResponse>;
}
/**
 * Create a Linxio SDK client.
 *
 * @example
 * ```ts
 * const linxio = createClient({ token, refreshToken });
 * const { data, error } = await linxio.vehicles.iterate({ limit: 100 });
 *
 * if (error) {
 *   throw error;
 * }
 *
 * for (const vehicle of data) {
 *   console.log(vehicle.id, vehicle.regNo);
 * }
 * ```
 */
declare function createClient(options?: LinxioClientOptions): LinxioClient;

type LinxioEndpointSource = "dashboard" | "public-docs";
type LinxioEndpointDefinition = {
    method: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
    path: string;
    source: LinxioEndpointSource;
};
declare const linxioEndpoints: {
    readonly auth: {
        readonly login: {
            readonly method: "POST";
            readonly path: "/login";
            readonly source: "public-docs";
        };
        readonly logout: {
            readonly method: "POST";
            readonly path: "/logout";
            readonly source: "dashboard";
        };
        readonly me: {
            readonly method: "GET";
            readonly path: "/me";
            readonly source: "dashboard";
        };
        readonly refreshToken: {
            readonly method: "POST";
            readonly path: "/token/refresh";
            readonly source: "dashboard";
        };
        readonly verifyOtp: {
            readonly method: "POST";
            readonly path: "/login/otp";
            readonly source: "dashboard";
        };
    };
    readonly cameras: {
        readonly eventTypes: {
            readonly method: "GET";
            readonly path: "/devices/cameras/events/types";
            readonly source: "dashboard";
        };
        readonly events: {
            readonly method: "GET";
            readonly path: "/devices/cameras/events";
            readonly source: "dashboard";
        };
    };
    readonly clients: {
        readonly get: {
            readonly method: "GET";
            readonly path: "/clients/{clientId}";
            readonly source: "dashboard";
        };
        readonly list: {
            readonly method: "GET";
            readonly path: "/clients/json";
            readonly source: "dashboard";
        };
        readonly users: {
            readonly create: {
                readonly method: "POST";
                readonly path: "/clients/{clientId}/users";
                readonly source: "public-docs";
            };
            readonly get: {
                readonly method: "GET";
                readonly path: "/clients/{clientId}/users/{userId}";
                readonly source: "public-docs";
            };
            readonly list: {
                readonly method: "GET";
                readonly path: "/clients/{clientId}/users";
                readonly source: "public-docs";
            };
            readonly update: {
                readonly method: "POST";
                readonly path: "/clients/{clientId}/users/{userId}";
                readonly source: "public-docs";
            };
        };
    };
    readonly devices: {
        readonly archive: {
            readonly method: "PATCH";
            readonly path: "/devices/{deviceId}/archive";
            readonly source: "dashboard";
        };
        readonly coordinates: {
            readonly method: "GET";
            readonly path: "/devices/{deviceId}/coordinates";
            readonly source: "dashboard";
        };
        readonly cameras: {
            readonly method: "GET";
            readonly path: "/devices/{deviceId}/cameras";
            readonly source: "dashboard";
        };
        readonly create: {
            readonly method: "POST";
            readonly path: "/devices";
            readonly source: "public-docs";
        };
        readonly get: {
            readonly method: "GET";
            readonly path: "/devices/{deviceId}";
            readonly source: "public-docs";
        };
        readonly install: {
            readonly method: "POST";
            readonly path: "/devices/{deviceId}/install";
            readonly source: "public-docs";
        };
        readonly list: {
            readonly method: "GET";
            readonly path: "/devices/json";
            readonly source: "public-docs";
        };
        readonly history: {
            readonly method: "GET";
            readonly path: "/devices/{deviceId}/history";
            readonly source: "dashboard";
        };
        readonly installations: {
            readonly method: "GET";
            readonly path: "/devices/installation/";
            readonly source: "dashboard";
        };
        readonly sensors: {
            readonly list: {
                readonly method: "GET";
                readonly path: "/devices/{deviceId}/sensors/history";
                readonly source: "dashboard";
            };
        };
        readonly uninstall: {
            readonly method: "POST";
            readonly path: "/devices/{deviceId}/uninstall";
            readonly source: "public-docs";
        };
        readonly update: {
            readonly method: "PATCH";
            readonly path: "/devices/{deviceId}";
            readonly source: "public-docs";
        };
        readonly vendors: {
            readonly method: "GET";
            readonly path: "/devices/vendors/";
            readonly source: "dashboard";
        };
    };
    readonly drivers: {
        readonly assignToVehicle: {
            readonly method: "POST";
            readonly path: "/vehicle/{vehicleId}/set-driver/{driverId}";
            readonly source: "public-docs";
        };
        readonly list: {
            readonly method: "GET";
            readonly path: "/clients/{clientId}/users?role=driver";
            readonly source: "public-docs";
        };
        readonly unassignFromVehicle: {
            readonly method: "POST";
            readonly path: "/vehicle/{vehicleId}/unset-driver/{driverId}";
            readonly source: "public-docs";
        };
    };
    readonly fuel: {
        readonly assignTransaction: {
            readonly method: "PATCH";
            readonly path: "/fuel-cards/record/{recordId}";
            readonly source: "dashboard";
        };
        readonly cards: {
            readonly method: "GET";
            readonly path: "/fuel-cards/json";
            readonly source: "dashboard";
        };
        readonly records: {
            readonly method: "GET";
            readonly path: "/fuel-cards/json";
            readonly source: "dashboard";
        };
        readonly recordsByVehicle: {
            readonly method: "GET";
            readonly path: "/fuel-cards-by-vehicle/json";
            readonly source: "dashboard";
        };
        readonly summary: {
            readonly method: "GET";
            readonly path: "/fuel-summary-report";
            readonly source: "dashboard";
        };
        readonly fuelTypes: {
            readonly method: "GET";
            readonly path: "/fuel-types";
            readonly source: "dashboard";
        };
    };
    readonly geofences: {
        readonly archive: {
            readonly method: "PATCH";
            readonly path: "/areas/{areaId}/archive";
            readonly source: "dashboard";
        };
        readonly create: {
            readonly method: "POST";
            readonly path: "/areas";
            readonly source: "public-docs";
        };
        readonly delete: {
            readonly method: "DELETE";
            readonly path: "/areas/{areaId}";
            readonly source: "public-docs";
        };
        readonly get: {
            readonly method: "GET";
            readonly path: "/areas/{areaId}";
            readonly source: "dashboard";
        };
        readonly list: {
            readonly method: "GET";
            readonly path: "/areas";
            readonly source: "public-docs";
        };
        readonly restore: {
            readonly method: "PATCH";
            readonly path: "/areas/{areaId}/restore";
            readonly source: "dashboard";
        };
        readonly groups: {
            readonly archive: {
                readonly method: "PATCH";
                readonly path: "/area-groups/{groupId}/archive";
                readonly source: "dashboard";
            };
            readonly create: {
                readonly method: "POST";
                readonly path: "/area-groups";
                readonly source: "dashboard";
            };
            readonly delete: {
                readonly method: "DELETE";
                readonly path: "/area-groups/{groupId}";
                readonly source: "dashboard";
            };
            readonly get: {
                readonly method: "GET";
                readonly path: "/area-groups/{groupId}";
                readonly source: "dashboard";
            };
            readonly list: {
                readonly method: "GET";
                readonly path: "/area-groups";
                readonly source: "dashboard";
            };
            readonly restore: {
                readonly method: "PATCH";
                readonly path: "/area-groups/{groupId}/restore";
                readonly source: "dashboard";
            };
            readonly update: {
                readonly method: "PATCH";
                readonly path: "/area-groups/{groupId}";
                readonly source: "dashboard";
            };
        };
    };
    readonly metadata: {
        readonly countries: {
            readonly method: "GET";
            readonly path: "/country/list";
            readonly source: "dashboard";
        };
        readonly currentPlan: {
            readonly method: "GET";
            readonly path: "/permissions/current-plan";
            readonly source: "dashboard";
        };
        readonly digitalFormSettings: {
            readonly method: "GET";
            readonly path: "/settings/digitalForm";
            readonly source: "dashboard";
        };
        readonly ecoSpeedSettings: {
            readonly method: "GET";
            readonly path: "/settings/ecoSpeed";
            readonly source: "dashboard";
        };
        readonly excessiveIdlingSettings: {
            readonly method: "GET";
            readonly path: "/settings/excessiveIdling";
            readonly source: "dashboard";
        };
        readonly languages: {
            readonly method: "GET";
            readonly path: "/settings/language/list";
            readonly source: "dashboard";
        };
        readonly mapApiOptions: {
            readonly method: "GET";
            readonly path: "/settings/mapApiOptions";
            readonly source: "dashboard";
        };
        readonly myTheme: {
            readonly method: "GET";
            readonly path: "/themes/my";
            readonly source: "dashboard";
        };
        readonly platformDomain: {
            readonly method: "GET";
            readonly path: "/platform-settings/domain";
            readonly source: "dashboard";
        };
        readonly plans: {
            readonly method: "GET";
            readonly path: "/plans";
            readonly source: "dashboard";
        };
        readonly providers: {
            readonly method: "GET";
            readonly path: "/settings/provider";
            readonly source: "dashboard";
        };
        readonly roles: {
            readonly method: "GET";
            readonly path: "/roles";
            readonly source: "dashboard";
        };
        readonly themes: {
            readonly method: "GET";
            readonly path: "/themes";
            readonly source: "dashboard";
        };
        readonly timezones: {
            readonly method: "GET";
            readonly path: "/timezones";
            readonly source: "dashboard";
        };
    };
    readonly realtime: {
        readonly coordinates: {
            readonly method: "GET";
            readonly path: "https://track.linxio.com/coordinates";
            readonly source: "public-docs";
        };
        readonly notifications: {
            readonly method: "GET";
            readonly path: "https://track.linxio.com/notifications";
            readonly source: "public-docs";
        };
    };
    readonly reports: {
        readonly digitalFormAnswer: {
            readonly method: "GET";
            readonly path: "/digital-form/answer/{answerId}";
            readonly source: "dashboard";
        };
        readonly digitalFormAnswerPdf: {
            readonly method: "GET";
            readonly path: "/digital-form/answer/{answerId}/pdf";
            readonly source: "dashboard";
        };
        readonly deleteScheduledReport: {
            readonly method: "DELETE";
            readonly path: "/scheduled-report/{reportId}";
            readonly source: "dashboard";
        };
        readonly getScheduledReport: {
            readonly method: "GET";
            readonly path: "/scheduled-report/{reportId}";
            readonly source: "dashboard";
        };
        readonly scheduledReport: {
            readonly method: "GET";
            readonly path: "/scheduled-report";
            readonly source: "dashboard";
        };
        readonly restoreScheduledReport: {
            readonly method: "PATCH";
            readonly path: "/scheduled-report/{reportId}/restore";
            readonly source: "dashboard";
        };
        readonly scheduledTemplate: {
            readonly method: "GET";
            readonly path: "/scheduled-report/template";
            readonly source: "dashboard";
        };
        readonly updateScheduledReport: {
            readonly method: "PATCH";
            readonly path: "/scheduled-report/{reportId}";
            readonly source: "dashboard";
        };
    };
    readonly sensors: {
        readonly tempHumidityDeviceReport: {
            readonly method: "GET";
            readonly path: "/devices/sensors/report/temp-and-humidity";
            readonly source: "public-docs";
        };
        readonly tempHumidityVehicleReport: {
            readonly method: "GET";
            readonly path: "/vehicles/report/sensors/temp-and-humidity";
            readonly source: "public-docs";
        };
    };
    readonly vehicles: {
        readonly archive: {
            readonly method: "PATCH";
            readonly path: "/vehicles/{vehicleId}/archive";
            readonly source: "dashboard";
        };
        readonly create: {
            readonly method: "POST";
            readonly path: "/vehicles";
            readonly source: "public-docs";
        };
        readonly count: {
            readonly method: "GET";
            readonly path: "/vehicles/count";
            readonly source: "dashboard";
        };
        readonly engineHours: {
            readonly method: "GET";
            readonly path: "/vehicles/{vehicleId}/engine-hours/current";
            readonly source: "dashboard";
        };
        readonly get: {
            readonly method: "GET";
            readonly path: "/vehicles/{vehicleId}";
            readonly source: "public-docs";
        };
        readonly list: {
            readonly method: "GET";
            readonly path: "/vehicles/fields/json";
            readonly source: "public-docs";
        };
        readonly odometer: {
            readonly method: "GET";
            readonly path: "/vehicles/{vehicleId}/odometer";
            readonly source: "public-docs";
        };
        readonly recalibrateOdometer: {
            readonly method: "POST";
            readonly path: "/vehicles/{vehicleId}/odometer";
            readonly source: "public-docs";
        };
        readonly restore: {
            readonly method: "POST";
            readonly path: "/vehicles/{vehicleId}/restore";
            readonly source: "dashboard";
        };
        readonly routes: {
            readonly method: "GET";
            readonly path: "/vehicles/{vehicleId}/routes";
            readonly source: "public-docs";
        };
        readonly update: {
            readonly method: "POST";
            readonly path: "/vehicles/{vehicleId}";
            readonly source: "public-docs";
        };
        readonly types: {
            readonly method: "GET";
            readonly path: "/vehicles/types";
            readonly source: "dashboard";
        };
    };
};

/** Dashboard source file used by endpoint discovery helpers. */
type DashboardSourceFile = {
    /** JavaScript source content captured from the Linxio dashboard. */
    content: string;
    /** Source filename used for evidence reporting. */
    filename: string;
};
type DashboardEndpointMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT" | "UNKNOWN";
/** Endpoint evidence extracted from Linxio dashboard JavaScript bundles. */
type DashboardEndpointEvidence = {
    /** Source bundle filenames where the endpoint candidate appeared. */
    files: string[];
    /** HTTP methods inferred from nearby client calls. */
    methods: DashboardEndpointMethod[];
    /** Number of times the normalized path appeared. */
    occurrences: number;
    /** Normalized API path with dynamic template segments replaced by `{param}`. */
    path: string;
};
/** Coverage comparison between dashboard evidence and SDK endpoint definitions. */
type DashboardEndpointCoverage = {
    /** Dashboard-observed endpoints represented in the SDK endpoint catalogue. */
    dashboardCovered: DashboardEndpointEvidence[];
    /** Dashboard-observed endpoints not yet represented in the SDK endpoint catalogue. */
    dashboardOnly: DashboardEndpointEvidence[];
    /** SDK catalogue endpoints not observed in the analysed dashboard bundle set. */
    sdkOnly: LinxioEndpointDefinition[];
};
/** Inputs accepted by {@link compareDashboardEndpointCoverage}. */
type DashboardEndpointCoverageInput = {
    dashboardEndpoints: readonly DashboardEndpointEvidence[];
    sdkEndpoints: readonly LinxioEndpointDefinition[];
};
/** Extract endpoint candidates from Linxio dashboard JavaScript bundles. */
declare function extractDashboardEndpoints(sources: readonly DashboardSourceFile[]): DashboardEndpointEvidence[];
/** Compare extracted dashboard endpoints against SDK endpoint definitions. */
declare function compareDashboardEndpointCoverage({ dashboardEndpoints, sdkEndpoints, }: DashboardEndpointCoverageInput): DashboardEndpointCoverage;
/** Flatten a nested SDK endpoint catalogue into endpoint definitions. */
declare function flattenEndpointDefinitions(catalogue: unknown): LinxioEndpointDefinition[];

/**
 * Load every page from a Linxio paginated endpoint into a single result.
 *
 * Services expose domain-specific wrappers around this helper, but it is
 * exported for advanced users building custom endpoint integrations.
 */
declare function collectPages<TData, TParams extends ListParams>(loadPage: (params: TParams) => Promise<LinxioPageResult<TData>>, params?: TParams): Promise<LinxioResult<TData[]>>;
/**
 * Stream a Linxio paginated endpoint one item at a time.
 *
 * This helper throws the typed SDK error if any page fails. Use
 * {@link collectPages} when you prefer a `{ data, error }` result.
 */
declare function streamPages<TData, TParams extends ListParams>(loadPage: (params: TParams) => Promise<LinxioPageResult<TData>>, params?: TParams): AsyncGenerator<TData, void, undefined>;

export { AuthService, BaseService, CamerasService, ClientsService, type DashboardEndpointCoverage, type DashboardEndpointCoverageInput, type DashboardEndpointEvidence, type DashboardEndpointMethod, type DashboardSourceFile, type DateRangeParams, type DeviceField, DevicesService, DigitalFormsService, type DriverField, DriversService, type FetchLike, type FieldSelector, type FuelRecordField, FuelService, type GeofenceType, GeofencesService, HttpClient, type HttpMethod, type ISODateString, type JsonObject, type JsonPrimitive, type JsonValue, type LatLng, LinxioApiError, type LinxioApiErrorContext, type LinxioAreaGroup, type LinxioAreaGroupPayload, LinxioAuthenticationError, LinxioClient, type LinxioClientAccount, type LinxioClientOptions, type LinxioClientUserListParams, LinxioConfigurationError, type LinxioCount, type LinxioCountry, type LinxioCountryMap, type LinxioCurrency, type LinxioCurrentPlan, type LinxioCurrentUser, type LinxioDevice, type LinxioDeviceCamera, type LinxioDeviceCoordinate, type LinxioDeviceCoordinateParams, type LinxioDeviceInstallation, type LinxioDeviceInstallationLookupParams, type LinxioDeviceInstallationPayload, type LinxioDeviceListParams, type LinxioDeviceModel, type LinxioDevicePayload, type LinxioDeviceUninstallPayload, type LinxioDeviceVendor, type LinxioDigitalForm, type LinxioDigitalFormSettings, type LinxioDriver, type LinxioDriverListParams, type LinxioEcoSpeedSettings, type LinxioEndpointDefinition, type LinxioEndpointSource, type LinxioEngineHours, LinxioError, type LinxioErrorContext, type LinxioExcessiveIdlingSettings, type LinxioFailure, type LinxioFileFormat, type LinxioFuelCard, type LinxioFuelListParams, type LinxioFuelRecord, type LinxioFuelSummaryRecord, type LinxioGeofence, type LinxioGeofenceListParams, type LinxioGeofencePayload, type LinxioHttpConfig, type LinxioHttpRequestOptions, type LinxioId, type LinxioLanguage, type LinxioLoginRequest, type LinxioLoginResponse, type LinxioMapApiOption, type LinxioMetadataRecord, LinxioNetworkError, type LinxioNotification, type LinxioOdometer, type LinxioOdometerParams, type LinxioOdometerRecalibration, type LinxioOtpVerificationRequest, type LinxioPage, type LinxioPageEnvelope, type LinxioPageFailure, type LinxioPageResult, type LinxioPageSuccess, type LinxioPaginationMeta, type LinxioPlan, type LinxioPlatformDomain, type LinxioProviderSetting, LinxioRealtimeError, type LinxioRealtimeNamespace, type LinxioRealtimeSubscribeAck, type LinxioRealtimeSubscription, type LinxioRecord, type LinxioRefreshTokenResponse, type LinxioReportParams, type LinxioReseller, type LinxioResourceStatus, type LinxioResult, type LinxioRole, type LinxioRouteCoordinate, type LinxioRoutePoint, type LinxioScheduledReport, type LinxioScheduledReportPayload, type LinxioSensor, type LinxioSensorListParams, type LinxioSensorReportParams, type LinxioSession, type LinxioSettingRecord, type LinxioSuccess, type LinxioTeamSummary, type LinxioTeamType, type LinxioTemperatureHumidityReading, type LinxioTheme, LinxioTimeoutError, type LinxioTimezone, type LinxioTrackingPosition, type LinxioUser, type LinxioUserAuditSummary, type LinxioUserListParams, type LinxioUserPayload, type LinxioUserSummary, LinxioValidationError, type LinxioVehicle, type LinxioVehicleAreaAssignment, type LinxioVehicleCountParams, type LinxioVehicleDepot, type LinxioVehicleDriver, type LinxioVehicleGroup, type LinxioVehicleListParams, type LinxioVehiclePayload, type LinxioVehicleRoute, type LinxioVehicleRoutesGroup, type LinxioVehicleRoutesParams, type LinxioVehicleType, type LinxioVehicleTypeParams, type ListParams, MetadataService, type QueryParams, type QueryPrimitive, type QueryValue, RealtimeClient, type RealtimeClientOptions, type RealtimeEventHandler, type RealtimeUnsubscribe, ReportsService, ResellersService, type ResponseType, type RetryOptions, type RouteField, RoutesService, type SensorField, SensorsService, type SortDirection, type UserField, UsersService, type VehicleField, VehiclesService, collectPages, compareDashboardEndpointCoverage, createClient, extractDashboardEndpoints, fail, flattenEndpointDefinitions, isLinxioFailure, linxioEndpoints, ok, pageFail, pageOk, streamPages, toLinxioError, toResult, unwrapLinxioPageResult, unwrapLinxioResult };
