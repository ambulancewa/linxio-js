#!/usr/bin/env node
import { createClient } from "../dist/index.js";

const email = process.env.LINXIO_EMAIL ?? process.env.LINXIO_USERNAME;
const password = process.env.LINXIO_PASSWORD;
const domain = process.env.LINXIO_DOMAIN;

if (!email || !password) {
    console.error(
        "Set LINXIO_EMAIL and LINXIO_PASSWORD before running pnpm live:smoke.",
    );
    process.exit(1);
}

const linxio = createClient({
    retry: {
        delayMs: 250,
        retries: 1,
    },
    timeoutMs: 20_000,
});

const login = await linxio.auth.login({
    email,
    password,
    ...(domain ? { domain } : {}),
});

if (login.error) {
    fail("auth.login", login.error);
}

const summary = {
    authenticated: true,
    operations: {},
};

summary.operations.vehiclesList = summarizePage(
    await linxio.vehicles.list({
        fields: ["id", "regNo", "lastLoggedAt"],
        limit: 3,
        page: 1,
    }),
);

summary.operations.vehiclesStreamSample = await summarizeStream(
    linxio.vehicles.stream({
        fields: ["id", "regNo", "lastLoggedAt"],
        limit: 3,
    }),
    3,
);

if (process.env.LINXIO_LIVE_FULL_PAGINATION === "1") {
    summary.operations.vehiclesIterate = summarizeResult(
        await linxio.vehicles.iterate({
            fields: ["id", "regNo", "lastLoggedAt"],
            limit: 100,
        }),
    );
}

summary.operations.devicesList = summarizePage(
    await linxio.devices.list({
        fields: ["id", "imei", "status"],
        limit: 3,
        page: 1,
    }),
);

summary.operations.geofencesList = summarizePage(
    await linxio.geofences.list({
        limit: 3,
        page: 1,
    }),
);

console.log(JSON.stringify(summary, null, 2));

function summarizePage(result) {
    if (result.error) {
        failResult(result.error);
    }

    const first = result.data[0];
    return {
        ok: true,
        page: result.page,
        limit: result.limit,
        returned: result.data.length,
        totalAvailable: typeof result.total,
        recordShape: shapeOf(first),
    };
}

function summarizeResult(result) {
    if (result.error) {
        failResult(result.error);
    }

    const first = result.data[0];
    return {
        ok: true,
        returned: result.data.length,
        recordShape: shapeOf(first),
    };
}

async function summarizeStream(stream, maxItems) {
    const items = [];

    for await (const item of stream) {
        items.push(item);

        if (items.length >= maxItems) {
            break;
        }
    }

    return {
        ok: true,
        returned: items.length,
        recordShape: shapeOf(items[0]),
    };
}

function shapeOf(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return typeOf(value);
    }

    return Object.fromEntries(
        Object.entries(value)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entryValue]) => [key, typeOf(entryValue)]),
    );
}

function typeOf(value) {
    if (value === null) {
        return "null";
    }

    if (Array.isArray(value)) {
        return "array";
    }

    if (value instanceof Date) {
        return "date";
    }

    return typeof value;
}

function failResult(error) {
    console.error(
        JSON.stringify(
            {
                message: error.message,
                method: error.method,
                name: error.name,
                path: error.path,
                status: error.status,
            },
            null,
            2,
        ),
    );
    process.exit(1);
}

function fail(operation, error) {
    console.error(`Live smoke operation failed: ${operation}`);
    failResult(error);
}
