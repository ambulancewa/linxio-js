import { afterEach, describe, expect, it, vi } from "vitest";
import {
    createClient,
    type FetchLike,
    LinxioApiError,
    type LinxioClient,
    linxioEndpoints,
} from "./index";

type CapturedRequest = {
    body: unknown;
    headers: Headers;
    method: string;
    url: URL;
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
    return new Response(JSON.stringify(body), {
        headers: { "Content-Type": "application/json" },
        status: 200,
        ...init,
    });
}

function captureFetch(
    handler: (request: CapturedRequest) => Response | Promise<Response>,
): FetchLike & { calls: CapturedRequest[] } {
    const calls: CapturedRequest[] = [];
    const fetcher = (async (input, init) => {
        const request = new Request(input, init);
        const text = await request.text();
        const captured: CapturedRequest = {
            body: text ? JSON.parse(text) : undefined,
            headers: request.headers,
            method: request.method,
            url: new URL(request.url),
        };
        calls.push(captured);
        return handler(captured);
    }) as FetchLike & { calls: CapturedRequest[] };
    fetcher.calls = calls;
    return fetcher;
}

function createTestClient(fetcher: FetchLike): LinxioClient {
    return createClient({
        fetch: fetcher,
        retry: { delayMs: 0, retries: 0 },
        token: "initial-token",
    });
}

afterEach(() => {
    vi.useRealTimers();
});

describe("LinxioClient", () => {
    it("serializes service list filters, fields, sorting, pagination, and auth headers", async () => {
        const fetcher = captureFetch(() =>
            jsonResponse({
                aggregations: null,
                data: [{ id: 304, regNo: "AMB-304" }],
                limit: 50,
                page: 2,
                total: 1,
            }),
        );

        const client = createTestClient(fetcher);
        const result = await client.vehicles.list({
            fields: ["id", "regNo"],
            "id[]": [304, 305],
            limit: 50,
            page: 2,
            sort: "regNo",
            status: "active",
            "updatedAt[gte]": "2026-01-01T00:00:00+08:00",
        });

        expect(result.data).toEqual([{ id: 304, regNo: "AMB-304" }]);
        expect(result.error).toBeNull();
        expect(result.meta).toEqual({ limit: 50, page: 2, total: 1 });
        expect(fetcher.calls).toHaveLength(1);
        const request = fetcher.calls[0];
        if (!request) {
            throw new Error("Expected a captured request.");
        }
        expect(request.method).toBe("GET");
        expect(request.url.pathname).toBe("/api/vehicles/fields/json");
        expect(request.url.searchParams.getAll("fields[]")).toEqual([
            "id",
            "regNo",
        ]);
        expect(request.url.searchParams.get("status")).toBe("active");
        expect(request.url.searchParams.getAll("id[]")).toEqual(["304", "305"]);
        expect(request.url.searchParams.get("updatedAt[gte]")).toBe(
            "2026-01-01T00:00:00+08:00",
        );
        expect(request.url.searchParams.get("sort")).toBe("regNo");
        expect(request.url.searchParams.get("limit")).toBe("50");
        expect(request.url.searchParams.get("page")).toBe("2");
        expect(request.headers.get("Authorization")).toBe(
            "Bearer initial-token",
        );
    });

    it("unwraps endpoint-key result envelopes for pageable service data", async () => {
        const fetcher = captureFetch(() =>
            jsonResponse({
                result: {
                    limit: 5,
                    page: 1,
                    total: 1,
                    vehicles: [
                        {
                            id: 64553,
                            model: "Ford Ranger",
                            regNo: "1ABC234",
                        },
                    ],
                },
            }),
        );
        const client = createTestClient(fetcher);

        const result = await client.vehicles.list({ limit: 5, page: 1 });

        expect(result.error).toBeNull();
        expect(result.data).toEqual([
            {
                id: 64553,
                model: "Ford Ranger",
                regNo: "1ABC234",
            },
        ]);
        expect(result.meta).toEqual({ limit: 5, page: 1, total: 1 });
    });

    it("unwraps endpoint-key array envelopes for standard service data", async () => {
        const fetcher = captureFetch(() =>
            jsonResponse({
                result: {
                    forms: [
                        {
                            id: 1201,
                            status: "active",
                            title: "Vehicle Inspection",
                        },
                    ],
                },
            }),
        );
        const client = createTestClient(fetcher);

        const result = await client.digitalForms.list();

        expect(result.error).toBeNull();
        expect(result.data).toEqual([
            {
                id: 1201,
                status: "active",
                title: "Vehicle Inspection",
            },
        ]);
    });

    it("keeps generic collection access behind raw request", () => {
        const client = createTestClient(captureFetch(() => jsonResponse({})));

        expect("from" in client).toBe(false);
        expect(typeof client.request).toBe("function");
    });

    it("catalogues dashboard-derived endpoints exposed by SDK services", () => {
        expect(linxioEndpoints.cameras.events).toEqual({
            method: "GET",
            path: "/devices/cameras/events",
            source: "dashboard",
        });
        expect(linxioEndpoints.cameras.eventTypes).toEqual({
            method: "GET",
            path: "/devices/cameras/events/types",
            source: "dashboard",
        });
        expect(linxioEndpoints.devices.coordinates).toEqual({
            method: "GET",
            path: "/devices/{deviceId}/coordinates",
            source: "dashboard",
        });
        expect(linxioEndpoints.reports.digitalFormAnswerPdf).toEqual({
            method: "GET",
            path: "/digital-form/answer/{answerId}/pdf",
            source: "dashboard",
        });
        expect(linxioEndpoints.geofences.groups.create).toEqual({
            method: "POST",
            path: "/area-groups",
            source: "dashboard",
        });
        expect(linxioEndpoints.geofences.groups.get).toEqual({
            method: "GET",
            path: "/area-groups/{groupId}",
            source: "dashboard",
        });
        expect(linxioEndpoints.devices.vendors).toEqual({
            method: "GET",
            path: "/devices/vendors/",
            source: "dashboard",
        });
        expect(linxioEndpoints.vehicles.count).toEqual({
            method: "GET",
            path: "/vehicles/count",
            source: "dashboard",
        });
        expect(linxioEndpoints.vehicles.engineHours).toEqual({
            method: "GET",
            path: "/vehicles/{vehicleId}/engine-hours/current",
            source: "dashboard",
        });
        expect(linxioEndpoints.reports.scheduledTemplate).toEqual({
            method: "GET",
            path: "/scheduled-report/template",
            source: "dashboard",
        });
        expect(linxioEndpoints.reports.getScheduledReport).toEqual({
            method: "GET",
            path: "/scheduled-report/{reportId}",
            source: "dashboard",
        });
        expect(linxioEndpoints.reports.updateScheduledReport).toEqual({
            method: "PATCH",
            path: "/scheduled-report/{reportId}",
            source: "dashboard",
        });
        expect(linxioEndpoints.reports.deleteScheduledReport).toEqual({
            method: "DELETE",
            path: "/scheduled-report/{reportId}",
            source: "dashboard",
        });
        expect(linxioEndpoints.fuel.fuelTypes).toEqual({
            method: "GET",
            path: "/fuel-types",
            source: "dashboard",
        });
        expect(linxioEndpoints.metadata.countries).toEqual({
            method: "GET",
            path: "/country/list",
            source: "dashboard",
        });
        expect(linxioEndpoints.metadata.timezones).toEqual({
            method: "GET",
            path: "/timezones",
            source: "dashboard",
        });
        expect(linxioEndpoints.metadata.currentPlan).toEqual({
            method: "GET",
            path: "/permissions/current-plan",
            source: "dashboard",
        });
        expect(linxioEndpoints.metadata.mapApiOptions).toEqual({
            method: "GET",
            path: "/settings/mapApiOptions",
            source: "dashboard",
        });
    });

    it("coalesces concurrent token refreshes and retries authorised requests with the new token", async () => {
        let refreshCalls = 0;
        const fetcher = captureFetch((request) => {
            if (request.url.pathname === "/api/token/refresh") {
                refreshCalls += 1;
                expect(request.body).toEqual({ refreshToken: "refresh-token" });
                return jsonResponse({
                    refreshToken: "next-refresh-token",
                    token: "fresh-token",
                });
            }

            if (request.headers.get("Authorization") === "Bearer fresh-token") {
                return jsonResponse({
                    data: [{ id: 1 }],
                    limit: 10,
                    page: 1,
                    total: 1,
                });
            }

            return jsonResponse({ message: "expired" }, { status: 401 });
        });
        const client = createClient({
            fetch: fetcher,
            refreshToken: "refresh-token",
            retry: { delayMs: 0, retries: 0 },
            token: "expired-token",
        });

        const [first, second] = await Promise.all([
            client.vehicles.list(),
            client.vehicles.list(),
        ]);

        expect(first.data).toEqual([{ id: 1 }]);
        expect(second.data).toEqual([{ id: 1 }]);
        expect(refreshCalls).toBe(1);
        const authorisedRetries = fetcher.calls.filter(
            (request) =>
                request.url.pathname === "/api/vehicles/fields/json" &&
                request.headers.get("Authorization") === "Bearer fresh-token",
        );
        expect(authorisedRetries).toHaveLength(2);
        expect(client.session()).toMatchObject({
            refreshToken: "next-refresh-token",
            token: "fresh-token",
        });
    });

    it("retries idempotent requests with backoff but does not retry unsafe mutations by default", async () => {
        const attemptsByPath = new Map<string, number>();
        const fetcher = captureFetch((request) => {
            const key = `${request.method} ${request.url.pathname}`;
            const nextAttempt = (attemptsByPath.get(key) ?? 0) + 1;
            attemptsByPath.set(key, nextAttempt);

            if (request.method === "GET" && nextAttempt < 3) {
                return jsonResponse({ message: "temporary" }, { status: 503 });
            }

            if (request.method === "POST") {
                return jsonResponse({ message: "temporary" }, { status: 503 });
            }

            return jsonResponse({ data: [], limit: 10, page: 1, total: 0 });
        });
        const client = createClient({
            fetch: fetcher,
            retry: { delayMs: 0, retries: 2 },
            token: "token",
        });

        await expect(client.vehicles.list()).resolves.toMatchObject({
            data: [],
            error: null,
        });
        const mutation = await client.vehicles.create({ regNo: "AMB-001" });

        expect(mutation.data).toBeNull();
        expect(mutation.error).toBeInstanceOf(LinxioApiError);

        expect(attemptsByPath.get("GET /api/vehicles/fields/json")).toBe(3);
        expect(attemptsByPath.get("POST /api/vehicles")).toBe(1);
    });

    it("loads pageable service results with result-style auto-pagination", async () => {
        const fetcher = captureFetch((request) => {
            const page = Number(request.url.searchParams.get("page") ?? 1);
            if (page === 1) {
                return jsonResponse({
                    data: [{ id: 1 }, { id: 2 }],
                    limit: 2,
                    page,
                    total: 3,
                });
            }

            return jsonResponse({
                data: [{ id: 3 }],
                limit: 2,
                page,
                total: 3,
            });
        });
        const client = createTestClient(fetcher);

        const result = await client.vehicles.iterate({ limit: 2 });

        expect(result.error).toBeNull();
        expect(result.data?.map((vehicle) => Number(vehicle.id))).toEqual([
            1, 2, 3,
        ]);
        expect(
            fetcher.calls.map((request) =>
                request.url.searchParams.get("page"),
            ),
        ).toEqual(["1", "2"]);
    });

    it("streams pageable service results when callers need item-by-item processing", async () => {
        const fetcher = captureFetch((request) => {
            const page = Number(request.url.searchParams.get("page") ?? 1);
            if (page === 1) {
                return jsonResponse({
                    data: [{ id: 1 }, { id: 2 }],
                    limit: 2,
                    page,
                    total: 3,
                });
            }

            return jsonResponse({
                data: [{ id: 3 }],
                limit: 2,
                page,
                total: 3,
            });
        });
        const client = createTestClient(fetcher);
        const ids: number[] = [];

        for await (const vehicle of client.vehicles.stream({ limit: 2 })) {
            ids.push(Number(vehicle.id));
        }

        expect(ids).toEqual([1, 2, 3]);
        expect(
            fetcher.calls.map((request) =>
                request.url.searchParams.get("page"),
            ),
        ).toEqual(["1", "2"]);
    });

    it("maps documented service methods to Linxio API paths and payloads", async () => {
        const fetcher = captureFetch((request) => {
            if (request.url.pathname === "/api/login") {
                return jsonResponse({
                    expireAt: "2026-06-08T12:00:00+08:00",
                    refreshToken: "refresh",
                    token: "token",
                });
            }

            return jsonResponse({
                data: [],
                limit: 10,
                page: 1,
                total: 0,
            });
        });
        const client = createClient({ fetch: fetcher });

        await client.auth.login({
            domain: "ambulancewa",
            email: "user@example.test",
            password: "correct-horse",
        });
        await client.vehicles.list({ fields: ["id"], limit: 10, page: 1 });
        await client.routes.getVehicleRoutes(304, {
            dateFrom: "2026-06-01T00:00:00+08:00",
            dateTo: "2026-06-08T00:00:00+08:00",
            fields: ["coordinates"],
        });
        await client.geofences.create({
            color: "#ff0000",
            coordinates: [{ lat: -31.95, lng: 115.86 }],
            name: "Depot",
            radius: 150,
            type: "circle",
        });
        await client.devices.install(545, {
            installedAt: "2026-06-08T09:00:00+08:00",
            vehicleId: 304,
        });
        await client.drivers.assignToVehicle(304, 42);

        expect(
            fetcher.calls.map((request) => [
                request.method,
                request.url.pathname,
                Object.fromEntries(request.url.searchParams),
                request.body,
            ]),
        ).toEqual([
            [
                "POST",
                "/api/login",
                {},
                {
                    domain: "ambulancewa",
                    email: "user@example.test",
                    password: "correct-horse",
                },
            ],
            [
                "GET",
                "/api/vehicles/fields/json",
                { "fields[]": "id", limit: "10", page: "1" },
                undefined,
            ],
            [
                "GET",
                "/api/vehicles/304/routes",
                {
                    dateFrom: "2026-06-01T00:00:00+08:00",
                    dateTo: "2026-06-08T00:00:00+08:00",
                    "fields[]": "coordinates",
                },
                undefined,
            ],
            [
                "POST",
                "/api/areas",
                {},
                {
                    color: "#ff0000",
                    coordinates: [{ lat: -31.95, lng: 115.86 }],
                    name: "Depot",
                    radius: 150,
                    type: "circle",
                },
            ],
            [
                "POST",
                "/api/devices/545/install",
                {},
                {
                    installedAt: "2026-06-08T09:00:00+08:00",
                    vehicleId: 304,
                },
            ],
            ["POST", "/api/vehicle/304/set-driver/42", {}, {}],
        ]);
    });

    it("maps high-signal dashboard-derived service methods to paths and payloads", async () => {
        const fetcher = captureFetch((request) => {
            if (request.url.pathname === "/api/vehicles/count") {
                return jsonResponse({ count: 14 });
            }

            if (request.url.pathname === "/api/devices/installation/") {
                return jsonResponse({
                    deviceId: 545,
                    id: 99,
                    installDate: "2026-06-08T09:00:00+08:00",
                    vehicleId: 304,
                });
            }

            return jsonResponse({ id: 1 });
        });
        const client = createTestClient(fetcher);

        await client.geofences.createGroup({ name: "Metro" });
        await client.geofences.getGroup(7);
        await client.geofences.updateGroup(7, { name: "Regional" });
        await client.geofences.archiveGroup(7);
        await client.geofences.restoreGroup(7);
        await client.geofences.deleteGroup(7);
        await client.devices.vendors();
        await client.devices.installation({ deviceImei: "123456789012345" });
        await client.devices.installations({ vehicleRegNo: "TEST-001" });
        await client.devices.cameras(545);
        await client.vehicles.count({ status: "active" });
        await client.vehicles.types();
        await client.vehicles.restore(304);
        await client.reports.scheduledTemplate();
        await client.reports.restoreScheduled(91);

        expect(
            fetcher.calls.map((request) => [
                request.method,
                request.url.pathname,
                Object.fromEntries(request.url.searchParams),
                request.body,
            ]),
        ).toEqual([
            ["POST", "/api/area-groups", {}, { name: "Metro" }],
            ["GET", "/api/area-groups/7", {}, undefined],
            ["PATCH", "/api/area-groups/7", {}, { name: "Regional" }],
            ["PATCH", "/api/area-groups/7/archive", {}, {}],
            ["PATCH", "/api/area-groups/7/restore", {}, {}],
            ["DELETE", "/api/area-groups/7", {}, undefined],
            ["GET", "/api/devices/vendors/", {}, undefined],
            [
                "GET",
                "/api/devices/installation/",
                { deviceImei: "123456789012345" },
                undefined,
            ],
            [
                "GET",
                "/api/devices/installation/",
                { vehicleRegNo: "TEST-001" },
                undefined,
            ],
            ["GET", "/api/devices/545/cameras", {}, undefined],
            ["GET", "/api/vehicles/count", { status: "active" }, undefined],
            [
                "GET",
                "/api/vehicles/types",
                { limit: "1000", sort: "order" },
                undefined,
            ],
            ["POST", "/api/vehicles/304/restore", {}, {}],
            ["GET", "/api/scheduled-report/template", {}, undefined],
            ["PATCH", "/api/scheduled-report/91/restore", {}, {}],
        ]);
    });

    it("normalizes live pageable reference endpoints that return data envelopes", async () => {
        const fetcher = captureFetch((request) => {
            if (request.url.pathname === "/api/vehicles/types") {
                return jsonResponse({
                    data: [
                        {
                            default: "#222222",
                            driving: "#22c55e",
                            id: 5,
                            idling: "#f59e0b",
                            name: "Utility Vehicle",
                            order: 1,
                            status: "active",
                            stopped: "#64748b",
                        },
                    ],
                    limit: 1000,
                    page: 1,
                    total: 1,
                });
            }

            if (request.url.pathname === "/api/sensors") {
                return jsonResponse({
                    aggregations: null,
                    data: [
                        {
                            id: 91,
                            label: "Cooler Sensor",
                            sensorId: "F4CFB22527B1",
                            systemStatus: "online",
                            type: "temp-and-humidity",
                        },
                    ],
                    limit: 25,
                    page: 2,
                    total: 40,
                });
            }

            return jsonResponse({ data: [], limit: 10, page: 1, total: 0 });
        });
        const client = createTestClient(fetcher);

        const vehicleTypes = await client.vehicles.types();
        const sensors = await client.sensors.list({ limit: 25, page: 2 });

        expect(vehicleTypes.error).toBeNull();
        expect(vehicleTypes.data).toEqual([
            expect.objectContaining({
                driving: "#22c55e",
                id: 5,
                name: "Utility Vehicle",
            }),
        ]);
        expect(vehicleTypes.meta).toEqual({ limit: 1000, page: 1, total: 1 });
        expect(sensors.error).toBeNull();
        expect(sensors.data).toEqual([
            expect.objectContaining({
                id: 91,
                label: "Cooler Sensor",
                sensorId: "F4CFB22527B1",
            }),
        ]);
        expect(sensors.meta).toEqual({ limit: 25, page: 2, total: 40 });
    });

    it("uses live-verified device auxiliary endpoints and query parameters", async () => {
        const fetcher = captureFetch((request) => {
            if (request.url.pathname === "/api/devices/545/coordinates") {
                return jsonResponse([
                    {
                        lat: -31.9523,
                        lng: 115.8613,
                        ts: "2026-06-08T12:00:00+08:00",
                    },
                ]);
            }

            if (request.url.pathname === "/api/devices/545/sensors/history") {
                return jsonResponse({
                    data: [{ id: 7, label: "History Sensor" }],
                    limit: 10,
                    page: 1,
                    total: 1,
                });
            }

            return jsonResponse([]);
        });
        const client = createTestClient(fetcher);

        const coordinates = await client.devices.coordinates(545, {
            dateFrom: "2026-06-07T00:00:00+08:00",
            dateTo: "2026-06-08T00:00:00+08:00",
        });
        const sensors = await client.devices.sensors(545, {
            limit: 10,
            page: 1,
        });

        expect(coordinates.data).toEqual([
            {
                lat: -31.9523,
                lng: 115.8613,
                ts: "2026-06-08T12:00:00+08:00",
            },
        ]);
        expect(sensors.data).toEqual([{ id: 7, label: "History Sensor" }]);
        expect(sensors.meta).toEqual({ limit: 10, page: 1, total: 1 });
        expect(
            fetcher.calls.map((request) => [
                request.method,
                request.url.pathname,
                Object.fromEntries(request.url.searchParams),
            ]),
        ).toEqual([
            [
                "GET",
                "/api/devices/545/coordinates",
                {
                    dateFrom: "2026-06-07T00:00:00+08:00",
                    dateTo: "2026-06-08T00:00:00+08:00",
                },
            ],
            [
                "GET",
                "/api/devices/545/sensors/history",
                { limit: "10", page: "1" },
            ],
        ]);
    });

    it("maps read-only dashboard metadata helpers to their API paths", async () => {
        const fetcher = captureFetch(() => jsonResponse({ data: [] }));
        const client = createTestClient(fetcher);

        await client.metadata.countries();
        await client.metadata.roles();
        await client.metadata.plans();
        await client.metadata.timezones();
        await client.metadata.themes();
        await client.metadata.myTheme();
        await client.metadata.currentPlan();
        await client.metadata.platformDomain();
        await client.metadata.languages();
        await client.metadata.mapApiOptions();
        await client.metadata.providers();
        await client.metadata.digitalFormSettings();
        await client.metadata.ecoSpeedSettings();
        await client.metadata.excessiveIdlingSettings();

        expect(
            fetcher.calls.map((request) => [
                request.method,
                request.url.pathname,
                Object.fromEntries(request.url.searchParams),
                request.body,
            ]),
        ).toEqual([
            ["GET", "/api/country/list", {}, undefined],
            ["GET", "/api/roles", {}, undefined],
            ["GET", "/api/plans", {}, undefined],
            ["GET", "/api/timezones", {}, undefined],
            ["GET", "/api/themes", {}, undefined],
            ["GET", "/api/themes/my", {}, undefined],
            ["GET", "/api/permissions/current-plan", {}, undefined],
            ["GET", "/api/platform-settings/domain", {}, undefined],
            ["GET", "/api/settings/language/list", {}, undefined],
            ["GET", "/api/settings/mapApiOptions", {}, undefined],
            ["GET", "/api/settings/provider", {}, undefined],
            ["GET", "/api/settings/digitalForm", {}, undefined],
            ["GET", "/api/settings/ecoSpeed", {}, undefined],
            ["GET", "/api/settings/excessiveIdling", {}, undefined],
        ]);
    });

    it("returns typed API errors with status, method, path, request id, and parsed response body", async () => {
        const fetcher = captureFetch(() =>
            jsonResponse(
                {
                    error: "Validation failed",
                    errors: { regNo: ["The registration number is required."] },
                },
                {
                    headers: { "X-Request-Id": "req_123" },
                    status: 422,
                },
            ),
        );
        const client = createTestClient(fetcher);

        const result = await client.vehicles.create({});

        expect(result.data).toBeNull();
        expect(result.error).toBeInstanceOf(LinxioApiError);
        expect(result.error).toMatchObject({
            body: {
                error: "Validation failed",
                errors: { regNo: ["The registration number is required."] },
            },
            method: "POST",
            name: "LinxioApiError",
            path: "/api/vehicles",
            requestId: "req_123",
            status: 422,
        });
    });
});
