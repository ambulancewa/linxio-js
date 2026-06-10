#!/usr/bin/env node
import { createClient } from "../dist/index.js";

const email =
    process.env.LINXIO_SDK_SCRATCH_EMAIL ??
    process.env.LINXIO_EMAIL ??
    process.env.LINXIO_USERNAME;
const password =
    process.env.LINXIO_SDK_SCRATCH_PASSWORD ?? process.env.LINXIO_PASSWORD;
const domain =
    process.env.LINXIO_SDK_SCRATCH_DOMAIN ?? process.env.LINXIO_DOMAIN;
const baseUrl = process.env.LINXIO_SDK_SCRATCH_BASE_URL;
const mutationsEnabled =
    process.argv.includes("--mutations") ||
    process.env.LINXIO_LIVE_MUTATIONS === "1";

if (!email || !password) {
    console.error(
        "Set LINXIO_SDK_SCRATCH_EMAIL and LINXIO_SDK_SCRATCH_PASSWORD before running live contract validation.",
    );
    process.exit(1);
}

const linxio = createClient({
    baseUrl,
    retry: {
        delayMs: 250,
        retries: 1,
    },
    timeoutMs: 30_000,
});

const login = await linxio.auth.login({
    ...(domain ? { domain } : {}),
    email,
    password,
});

if (login.error) {
    console.error(
        JSON.stringify(
            {
                error: safeError(login.error),
                ok: false,
                stage: "login",
            },
            null,
            2,
        ),
    );
    process.exit(1);
}

const context = {
    areaGroupId: undefined,
    areaId: undefined,
    clientId: undefined,
    deviceId: undefined,
    deviceImei: undefined,
    driverId: undefined,
    formId: undefined,
    regNo: undefined,
    reportId: undefined,
    sensorId: undefined,
    userId: undefined,
    vehicleId: undefined,
};
const probes = [];

await probe("auth.me", () => linxio.auth.me(), {
    collect: (data) => {
        context.clientId = data?.team?.clientId ?? data?.team?.id;
        context.userId = data?.id;
    },
});
await probe(
    "vehicles.list",
    () => linxio.vehicles.list({ limit: 1, page: 1 }),
    {
        collect: (vehicles) => {
            const vehicle = vehicles?.[0];
            context.vehicleId = vehicle?.id;
            context.deviceId = vehicle?.deviceId;
            context.driverId = vehicle?.driver?.id ?? vehicle?.driverId;
            context.regNo = vehicle?.regNo;
        },
    },
);
await probe("devices.list", () => linxio.devices.list({ limit: 1, page: 1 }), {
    collect: (devices) => {
        const device = devices?.[0];
        context.deviceId ??= device?.id;
        context.deviceImei = device?.imei;
    },
});
await probe("geofences.list", () =>
    linxio.geofences.list({ limit: 1, page: 1 }),
);
await probe("drivers.list", () => linxio.drivers.list({ limit: 1, page: 1 }), {
    collect: (drivers) => {
        context.driverId ??= drivers?.[0]?.id;
    },
});

if (context.clientId) {
    await probe("clients.get", () => linxio.clients.get(context.clientId));
    await probe("clients.listUsers", () =>
        linxio.clients.listUsers(context.clientId, { limit: 1, page: 1 }),
    );
}

if (context.vehicleId) {
    await probe("vehicles.get", () => linxio.vehicles.get(context.vehicleId));
    await probe("vehicles.odometer", () =>
        linxio.vehicles.getOdometer(context.vehicleId),
    );
    await probe("vehicles.engineHours", () =>
        linxio.vehicles.getEngineHours(context.vehicleId),
    );
    await probe("routes.vehicle", () =>
        linxio.routes.getVehicleRoutes(context.vehicleId, routeWindow()),
    );
}

await probe("vehicles.count", () => linxio.vehicles.count());
await probe("vehicles.types", () => linxio.vehicles.types({ limit: 2 }));

if (context.deviceId) {
    await probe("devices.get", () => linxio.devices.get(context.deviceId));
    await probe("devices.coordinates", () =>
        linxio.devices.coordinates(context.deviceId, coordinateWindow()),
    );
    await probe("devices.sensors", () =>
        linxio.devices.sensors(context.deviceId, { limit: 2, page: 1 }),
    );
    await probe("devices.history", () =>
        linxio.devices.history(context.deviceId),
    );
    await probe("devices.cameras", () =>
        linxio.devices.cameras(context.deviceId),
    );
}

await probe("devices.vendors", () => linxio.devices.vendors());

if (context.deviceImei) {
    await probe("devices.installationByImei", () =>
        linxio.devices.installation({ deviceImei: context.deviceImei }),
    );
}

if (context.regNo) {
    await probe("devices.installationByRegNo", () =>
        linxio.devices.installation({ vehicleRegNo: context.regNo }),
    );
}

await probe("sensors.list", () => linxio.sensors.list({ limit: 5, page: 1 }), {
    collect: (sensors) => {
        context.sensorId = sensors?.[0]?.id;
    },
});

if (context.sensorId) {
    await probe("sensors.get", () => linxio.sensors.get(context.sensorId));
}

await probe("sensors.deviceTemperatureHumidityReport", () =>
    linxio.sensors.deviceTemperatureHumidityReport({ limit: 1, page: 1 }),
);
await probe("sensors.vehicleTemperatureHumidityReport", () =>
    linxio.sensors.vehicleTemperatureHumidityReport({ limit: 1, page: 1 }),
);

await probe("fuel.records", () => linxio.fuel.records({ limit: 1, page: 1 }));
await probe("fuel.summary", () => linxio.fuel.summary({ limit: 1, page: 1 }));
await probe("fuel.recordsByVehicle", () =>
    linxio.fuel.recordsByVehicle({ limit: 1, page: 1 }),
);
await probe("fuel.fuelTypes", () => linxio.fuel.fuelTypes());
await probe("cameras.events", () =>
    linxio.cameras.events({ limit: 1, page: 1 }),
);
await probe("cameras.eventTypes", () => linxio.cameras.eventTypes());
await probe("reports.scheduled", () =>
    linxio.reports.scheduled({ limit: 1, page: 1 }),
);
await probe("reports.scheduledTemplate", () =>
    linxio.reports.scheduledTemplate(),
);
await probe("digitalForms.list", () => linxio.digitalForms.list(), {
    collect: (forms) => {
        context.formId = forms?.[0]?.id;
    },
});

if (context.formId) {
    await probe("digitalForms.get", () =>
        linxio.digitalForms.get(context.formId),
    );
}

await probe("metadata.countries", () => linxio.metadata.countries());
await probe("metadata.roles", () => linxio.metadata.roles());
await probe("metadata.plans", () => linxio.metadata.plans());
await probe("metadata.timezones", () => linxio.metadata.timezones());
await probe("metadata.themes", () => linxio.metadata.themes());
await probe("metadata.myTheme", () => linxio.metadata.myTheme());
await probe("metadata.currentPlan", () => linxio.metadata.currentPlan());
await probe("metadata.platformDomain", () => linxio.metadata.platformDomain());
await probe("metadata.languages", () => linxio.metadata.languages());
await probe("metadata.mapApiOptions", () => linxio.metadata.mapApiOptions());
await probe("metadata.providers", () => linxio.metadata.providers());
await probe("metadata.digitalFormSettings", () =>
    linxio.metadata.digitalFormSettings(),
);
await probe("metadata.ecoSpeedSettings", () =>
    linxio.metadata.ecoSpeedSettings(),
);
await probe("metadata.excessiveIdlingSettings", () =>
    linxio.metadata.excessiveIdlingSettings(),
);

const mutationProbes = mutationsEnabled
    ? await runMutationProbes()
    : [
          {
              name: "mutations",
              ok: true,
              skipped:
                  "Pass --mutations to create and clean up scratch records.",
          },
      ];

const failed = probes.filter((entry) => !entry.ok);
const output = {
    generatedAt: new Date().toISOString(),
    mutationsEnabled,
    ok: failed.length === 0 && mutationProbes.every((entry) => entry.ok),
    probeCount: probes.length,
    readOnlyFailures: failed.length,
    probes,
    mutationProbes,
};

console.log(JSON.stringify(output, null, 2));

if (!output.ok) {
    process.exit(1);
}

async function probe(name, operation, options = {}) {
    try {
        const result = await operation();
        if (result?.error) {
            probes.push({
                error: safeError(result.error),
                name,
                ok: false,
            });
            return;
        }

        const value = Object.hasOwn(result ?? {}, "data")
            ? result.data
            : result;
        options.collect?.(value, result);
        probes.push({
            meta: result?.meta ? summarizeValue(result.meta) : undefined,
            name,
            ok: true,
            value: summarizeValue(value),
        });
    } catch (error) {
        probes.push({
            error: safeError(error),
            name,
            ok: false,
        });
    }
}

async function runMutationProbes() {
    const createdAreaIds = [];
    const marker = `SDK-CONTRACT-${new Date()
        .toISOString()
        .replace(/[-:.TZ]/g, "")
        .slice(0, 14)}`;
    const results = [];

    try {
        const created = await linxio.geofences.create({
            color: "#2bb100",
            coordinates: [{ lat: -31.9523, lng: 115.8613 }],
            name: `${marker} geofence`,
            radius: 50,
            type: "circle",
        });

        if (created.error) {
            results.push({
                error: safeError(created.error),
                name: "geofences.createScratch",
                ok: false,
            });
            return results;
        }

        const areaId = created.data.id;
        createdAreaIds.push(areaId);
        results.push({
            name: "geofences.createScratch",
            ok: true,
            value: summarizeValue(created.data),
        });

        for (const [name, action] of [
            [
                "geofences.updateScratch",
                () =>
                    linxio.geofences.update(areaId, {
                        name: `${marker} updated`,
                    }),
            ],
            [
                "geofences.archiveScratch",
                () => linxio.geofences.archive(areaId),
            ],
            [
                "geofences.restoreScratch",
                () => linxio.geofences.restore(areaId),
            ],
            ["geofences.deleteScratch", () => linxio.geofences.delete(areaId)],
        ]) {
            const result = await action();
            results.push(
                result.error
                    ? { error: safeError(result.error), name, ok: false }
                    : { name, ok: true, value: summarizeValue(result.data) },
            );
        }

        createdAreaIds.pop();
        return results;
    } finally {
        for (const areaId of createdAreaIds) {
            const cleanup = await linxio.geofences.delete(areaId);
            results.push(
                cleanup.error
                    ? {
                          error: safeError(cleanup.error),
                          name: "geofences.cleanupScratch",
                          ok: false,
                      }
                    : {
                          name: "geofences.cleanupScratch",
                          ok: true,
                          value: summarizeValue(cleanup.data),
                      },
            );
        }
    }
}

function routeWindow() {
    const dateTo = new Date();
    const dateFrom = new Date(dateTo.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
        fields: ["address"],
    };
}

function coordinateWindow() {
    const dateTo = new Date();
    const dateFrom = new Date(dateTo.getTime() - 24 * 60 * 60 * 1000);

    return {
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
    };
}

function summarizeValue(value, depth = 0) {
    if (depth > 3) {
        return kindOf(value);
    }

    if (Array.isArray(value)) {
        return {
            first: summarizeValue(value[0], depth + 1),
            length: value.length,
            type: "array",
        };
    }

    if (!value || typeof value !== "object") {
        return kindOf(value);
    }

    return {
        keys: Object.keys(value).sort(),
        sample: Object.fromEntries(
            Object.entries(value)
                .sort(([left], [right]) => left.localeCompare(right))
                .slice(0, 16)
                .map(([key, entry]) => [key, summarizeValue(entry, depth + 1)]),
        ),
        type: "object",
    };
}

function kindOf(value) {
    if (value === null) {
        return "null";
    }

    if (Array.isArray(value)) {
        return "array";
    }

    return typeof value;
}

function safeError(error) {
    return {
        message: error?.message,
        method: error?.method,
        name: error?.name,
        path: redactPath(error?.path),
        status: error?.status,
    };
}

function redactPath(path) {
    if (!path) {
        return path;
    }

    return String(path)
        .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "{email}")
        .replace(/\/\d+(?=\/|$|\?)/g, "/{id}");
}
