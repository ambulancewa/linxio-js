![@ambulancewa/linxio-js](https://raw.githubusercontent.com/ambulancewa/linxio-js/refs/heads/main/repo-header.png)

linxio-js is a secure, lightweight, high-performance Node.js SDK for interacting with the [`Linxio`](https://linxio.com/) API. The client is fully-typed for use in Typescript projects, and is available as ECMAScript and CommonJS modules for use pretty much anywhere you can run Javascript. Query vehicles, drivers, and devices, stream live GPS positions, subscribe to real-time notifications, auto-paginate large fleets, export reports, manage geofences and routes, and more!

```ts
import { createClient } from "linxio-js";

const linxio = createClient();

await linxio.auth.login({
    email: process.env.LINXIO_EMAIL!,
    password: process.env.LINXIO_PASSWORD!,
});

const { data, error } = await linxio.vehicles.iterate({
    fields: ["id", "regNo", "lastLoggedAt"],
    limit: 100,
});
```

## Features

- Fully typed TypeScript API.
- Available as both ESM and CommonJS packages.
- Fetch-native HTTP client with timeouts, typed errors, and safe JSON handling.
- Service methods return `{ data, error }` results for straightforward script ergonomics.
- Automatic JWT refresh with concurrent refresh coalescing.
- Exponential backoff retries for idempotent requests.
- Domain services for vehicles, routes, geofences, devices, drivers, sensors, fuel, users, clients, reports, digital forms, cameras, and realtime.
- Auto-pagination helpers and streaming iterators for paginated endpoints.
- Low-level `client.request()` escape hatch for tenant-specific endpoints.
- Socket.IO realtime helpers for live coordinates and notifications.

## Install

```bash
pnpm add linxio-js
```

```bash
npm install linxio-js
```

Full documentation is available at our Open Source Software Projects (OSSP) site: https://linxio-js.ambulancewa.dev

## Authentication

```ts
const login = await linxio.auth.login({
    email,
    password,
    domain: "optional-domain",
});

if (login.error) {
    throw login.error;
}

console.log(login.data.expireAt);
```

The SDK stores tokens in memory. To hydrate a client from your own storage:

```ts
const linxio = createClient({
    token: stored.token,
    refreshToken: stored.refreshToken,
});
```

## Vehicles

```ts
const { data: vehicles, error, meta } = await linxio.vehicles.list({
    fields: ["id", "regNo"],
    limit: 50,
    sort: "regNo",
});

if (error) {
    throw error;
}

console.log(meta.total, vehicles);

const routes = await linxio.routes.getVehicleRoutes(304, {
    dateFrom: "2026-06-01T00:00:00+08:00",
    dateTo: "2026-06-08T00:00:00+08:00",
});
```

## Advanced requests

Use domain services for normal workflows. For tenant-specific or newly
discovered endpoints, `client.request()` keeps the same auth, retry, timeout,
and token-refresh behavior.

```ts
const response = await linxio.request("GET", "/vehicles/count");
```

## Realtime

```ts
const unsubscribe = linxio.realtime.onPosition([304], (position) => {
    console.log(position.vehicleId, position.lat, position.lng);
});

unsubscribe();
```

## Errors

```ts
import { LinxioApiError } from "linxio-js";

const { error } = await linxio.vehicles.create({});

if (error instanceof LinxioApiError) {
    console.error(error.status, error.path, error.body);
}
```

Low-level `client.request()` calls throw typed SDK errors directly.

## Development

```bash
pnpm install
pnpm verify
pnpm docs:build
```

## API evidence

The public API surface is based on Linxio's published API documentation. Additional dashboard-derived helpers were inferred from JavaScript bundles captured from the Linxio dashboard and are typed conservatively where exact response schemas are not publicly documented.
