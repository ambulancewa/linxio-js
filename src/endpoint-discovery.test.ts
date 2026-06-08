import { describe, expect, it } from "vitest";
import {
    compareDashboardEndpointCoverage,
    extractDashboardEndpoints,
    flattenEndpointDefinitions,
} from "./endpoint-discovery";
import * as publicApi from "./index";

describe("extractDashboardEndpoints", () => {
    it("extracts API paths, normalizes dynamic segments, and aggregates evidence", () => {
        const endpoints = extractDashboardEndpoints([
            {
                filename: "main.js",
                content: `
                    service.http.get("/clients/json");
                    service.http.post(\`/clients/\${clientId}/users\`, payload);
                    service.http.patch(\`/vehicles/\${vehicleId}/archive\`, {});
                    const duplicate = api.get("/clients/json");
                    const dateFormat = "/MM/YYYY";
                    const socket = "/socket.io";
                `,
            },
            {
                filename: "chunk.js",
                content: `
                    repository.delete(\`/areas/\${areaId}\`);
                    const appRoute = "https://app.linxio.com/admin/clients";
                `,
            },
        ]);

        expect(endpoints).toEqual([
            {
                files: ["chunk.js"],
                methods: ["DELETE"],
                occurrences: 1,
                path: "/areas/{param}",
            },
            {
                files: ["main.js"],
                methods: ["GET"],
                occurrences: 2,
                path: "/clients/json",
            },
            {
                files: ["main.js"],
                methods: ["POST"],
                occurrences: 1,
                path: "/clients/{param}/users",
            },
            {
                files: ["main.js"],
                methods: ["PATCH"],
                occurrences: 1,
                path: "/vehicles/{param}/archive",
            },
        ]);
    });

    it("is exported from the package entrypoint for maintainer scripts", () => {
        expect(publicApi.extractDashboardEndpoints).toBe(
            extractDashboardEndpoints,
        );
    });

    it("compares extracted dashboard endpoints against SDK endpoint definitions", () => {
        const comparison = compareDashboardEndpointCoverage({
            dashboardEndpoints: [
                {
                    files: ["main.js"],
                    methods: ["GET"],
                    occurrences: 1,
                    path: "/clients/{param}/users",
                },
                {
                    files: ["main.js"],
                    methods: ["PATCH"],
                    occurrences: 1,
                    path: "/vehicles/{param}/archive",
                },
                {
                    files: ["main.js"],
                    methods: ["GET"],
                    occurrences: 1,
                    path: "/unwrapped",
                },
            ],
            sdkEndpoints: [
                {
                    method: "GET",
                    path: "/clients/{clientId}/users?role=driver",
                    source: "public-docs",
                },
                {
                    method: "PATCH",
                    path: "/vehicles/{vehicleId}/archive",
                    source: "dashboard",
                },
                {
                    method: "POST",
                    path: "/sdk-only",
                    source: "public-docs",
                },
            ],
        });

        expect(comparison.dashboardCovered.map((entry) => entry.path)).toEqual([
            "/clients/{param}/users",
            "/vehicles/{param}/archive",
        ]);
        expect(comparison.dashboardOnly.map((entry) => entry.path)).toEqual([
            "/unwrapped",
        ]);
        expect(comparison.sdkOnly.map((entry) => entry.path)).toEqual([
            "/sdk-only",
        ]);
    });

    it("flattens nested SDK endpoint catalogues", () => {
        const endpoints = flattenEndpointDefinitions({
            ignored: true,
            vehicles: {
                get: {
                    method: "GET",
                    path: "/vehicles/{vehicleId}",
                    source: "public-docs",
                },
                routes: {
                    method: "GET",
                    path: "/vehicles/{vehicleId}/routes",
                    source: "public-docs",
                },
            },
        });

        expect(endpoints).toEqual([
            {
                method: "GET",
                path: "/vehicles/{vehicleId}",
                source: "public-docs",
            },
            {
                method: "GET",
                path: "/vehicles/{vehicleId}/routes",
                source: "public-docs",
            },
        ]);
    });
});
