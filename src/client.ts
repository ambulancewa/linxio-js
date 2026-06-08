import type { HttpMethod, LinxioHttpRequestOptions } from "./http";
import { type FetchLike, HttpClient, type RetryOptions } from "./http";
import { RealtimeClient } from "./realtime";
import { AuthService } from "./services/auth.service";
import { CamerasService } from "./services/cameras.service";
import { ClientsService, ResellersService } from "./services/clients.service";
import { DevicesService } from "./services/devices.service";
import { DriversService } from "./services/drivers.service";
import { FuelService } from "./services/fuel.service";
import { GeofencesService } from "./services/geofences.service";
import {
    DigitalFormsService,
    ReportsService,
} from "./services/reports.service";
import { RoutesService } from "./services/routes.service";
import { SensorsService } from "./services/sensors.service";
import { UsersService } from "./services/users.service";
import { VehiclesService } from "./services/vehicles.service";
import type { LinxioSession } from "./types/auth";

/**
 * Configuration for {@link createClient}.
 *
 * Pass `token` and `refreshToken` when you already have a Linxio session, or
 * call `client.auth.login()` and the SDK will keep the returned tokens in
 * memory for this client instance.
 */
export type LinxioClientOptions = {
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
 * import { createClient } from "linxio-js";
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
export class LinxioClient {
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

    private currentSession: LinxioSession;

    constructor(options: LinxioClientOptions = {}) {
        this.currentSession = {
            refreshToken: options.refreshToken,
            token: options.token,
        };

        this.http = new HttpClient({
            baseUrl: options.baseUrl,
            fetch: options.fetch,
            getRefreshToken: () => this.currentSession.refreshToken,
            getToken: () => this.currentSession.token,
            onSession: (session) => this.setSession(session),
            retry: options.retry,
            timeoutMs: options.timeoutMs,
        });
        this.realtime = new RealtimeClient({
            baseUrl: options.realtimeBaseUrl,
            getToken: () => this.currentSession.token,
        });

        this.auth = new AuthService(this.http, (session) =>
            this.setSession(session),
        );
        this.cameras = new CamerasService(this.http);
        this.clients = new ClientsService(this.http);
        this.devices = new DevicesService(this.http);
        this.digitalForms = new DigitalFormsService(this.http);
        this.drivers = new DriversService(this.http);
        this.fuel = new FuelService(this.http);
        this.geofences = new GeofencesService(this.http);
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
    setSession(session: LinxioSession): void {
        this.currentSession = {
            ...this.currentSession,
            ...session,
        };
    }

    /** Return a copy of the current in-memory session. */
    session(): LinxioSession {
        return { ...this.currentSession };
    }

    /**
     * Send a raw API request with the same auth, retry, timeout, and refresh
     * behavior used by the domain services.
     */
    request<TResponse = unknown>(
        method: HttpMethod,
        path: string,
        options: LinxioHttpRequestOptions = {},
    ): Promise<TResponse> {
        return this.http.request<TResponse>(method, path, options);
    }
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
export function createClient(options: LinxioClientOptions = {}): LinxioClient {
    return new LinxioClient(options);
}
