import type { LinxioEndpointDefinition } from "./endpoints";

/** Dashboard source file used by endpoint discovery helpers. */
export type DashboardSourceFile = {
    /** JavaScript source content captured from the Linxio dashboard. */
    content: string;
    /** Source filename used for evidence reporting. */
    filename: string;
};

export type DashboardEndpointMethod =
    | "DELETE"
    | "GET"
    | "PATCH"
    | "POST"
    | "PUT"
    | "UNKNOWN";

/** Endpoint evidence extracted from Linxio dashboard JavaScript bundles. */
export type DashboardEndpointEvidence = {
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
export type DashboardEndpointCoverage = {
    /** Dashboard-observed endpoints represented in the SDK endpoint catalogue. */
    dashboardCovered: DashboardEndpointEvidence[];
    /** Dashboard-observed endpoints not yet represented in the SDK endpoint catalogue. */
    dashboardOnly: DashboardEndpointEvidence[];
    /** SDK catalogue endpoints not observed in the analysed dashboard bundle set. */
    sdkOnly: LinxioEndpointDefinition[];
};

/** Inputs accepted by {@link compareDashboardEndpointCoverage}. */
export type DashboardEndpointCoverageInput = {
    dashboardEndpoints: readonly DashboardEndpointEvidence[];
    sdkEndpoints: readonly LinxioEndpointDefinition[];
};

const HTTP_METHODS = ["DELETE", "GET", "PATCH", "POST", "PUT"] as const;
const METHOD_PATTERN = /\.(delete|get|patch|post|put)\s*\($/i;
const STRING_LITERAL_PATTERN = /(["'`])((?:\\.|(?!\1)[\s\S])*?)\1/g;

/** Extract endpoint candidates from Linxio dashboard JavaScript bundles. */
export function extractDashboardEndpoints(
    sources: readonly DashboardSourceFile[],
): DashboardEndpointEvidence[] {
    const endpoints = new Map<
        string,
        {
            files: Set<string>;
            methods: Set<DashboardEndpointMethod>;
            occurrences: number;
        }
    >();

    for (const source of sources) {
        for (const match of source.content.matchAll(STRING_LITERAL_PATTERN)) {
            const rawValue = match[2];
            if (rawValue === undefined || match.index === undefined) {
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
                files: new Set<string>(),
                methods: new Set<DashboardEndpointMethod>(),
                occurrences: 0,
            };

            evidence.files.add(source.filename);
            evidence.methods.add(method);
            evidence.occurrences += 1;
            endpoints.set(path, evidence);
        }
    }

    return [...endpoints.entries()]
        .map(([path, evidence]) => ({
            files: [...evidence.files].sort((left, right) =>
                left.localeCompare(right),
            ),
            methods: [...evidence.methods].sort(compareMethods),
            occurrences: evidence.occurrences,
            path,
        }))
        .sort((left, right) => compareText(left.path, right.path));
}

/** Compare extracted dashboard endpoints against SDK endpoint definitions. */
export function compareDashboardEndpointCoverage({
    dashboardEndpoints,
    sdkEndpoints,
}: DashboardEndpointCoverageInput): DashboardEndpointCoverage {
    const sdkKeys = new Set(sdkEndpoints.map(endpointKey));
    const dashboardKeys = new Set<string>();
    const dashboardCovered: DashboardEndpointEvidence[] = [];
    const dashboardOnly: DashboardEndpointEvidence[] = [];

    for (const endpoint of dashboardEndpoints) {
        const keys = endpoint.methods.map((method) =>
            endpointKey({ method, path: endpoint.path }),
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
            (endpoint) => !dashboardKeys.has(endpointKey(endpoint)),
        ),
    };
}

/** Flatten a nested SDK endpoint catalogue into endpoint definitions. */
export function flattenEndpointDefinitions(
    catalogue: unknown,
): LinxioEndpointDefinition[] {
    const definitions: LinxioEndpointDefinition[] = [];
    collectEndpointDefinitions(catalogue, definitions);
    return definitions.sort((left, right) => {
        const pathOrder = compareText(left.path, right.path);
        return pathOrder === 0
            ? compareMethods(left.method, right.method)
            : pathOrder;
    });
}

function normalizeDashboardPath(value: string): string | undefined {
    const normalized = value
        .replace(/\\\//g, "/")
        .replace(/\$\{[^}]*\}/g, "{param}")
        .trim();

    if (!normalized.startsWith("/") || normalized.startsWith("//")) {
        return undefined;
    }

    return normalized.replace(/\/+$/, "") || "/";
}

function isLikelyApiEndpoint(path: string): boolean {
    if (
        path === "/" ||
        path.includes(" ") ||
        path.startsWith("/.") ||
        path.startsWith("/MM/") ||
        path.startsWith("/socket.io")
    ) {
        return false;
    }

    return /^\/[a-z][a-z0-9-]*(?:[/?#]|$)/i.test(path);
}

function inferHttpMethod(
    content: string,
    literalIndex: number,
): DashboardEndpointMethod {
    const prefix = content.slice(Math.max(0, literalIndex - 80), literalIndex);
    const match = prefix.match(METHOD_PATTERN);
    if (!match?.[1]) {
        return "UNKNOWN";
    }

    return match[1].toUpperCase() as DashboardEndpointMethod;
}

function compareMethods(
    left: DashboardEndpointMethod,
    right: DashboardEndpointMethod,
): number {
    return methodRank(left) - methodRank(right);
}

function compareText(left: string, right: string): number {
    if (left < right) {
        return -1;
    }

    if (left > right) {
        return 1;
    }

    return 0;
}

function methodRank(method: DashboardEndpointMethod): number {
    const index = HTTP_METHODS.indexOf(method as (typeof HTTP_METHODS)[number]);
    return index === -1 ? HTTP_METHODS.length : index;
}

function endpointKey(endpoint: {
    method: DashboardEndpointMethod | LinxioEndpointDefinition["method"];
    path: string;
}): string {
    return `${endpoint.method}:${normalizeComparablePath(endpoint.path)}`;
}

function normalizeComparablePath(path: string): string {
    const [pathWithoutQuery] = path.split("?");
    return (pathWithoutQuery ?? path).replace(/\{[^}]+\}/g, "{param}");
}

function collectEndpointDefinitions(
    value: unknown,
    definitions: LinxioEndpointDefinition[],
): void {
    if (!isRecord(value)) {
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

function isEndpointDefinition(
    value: Record<string, unknown>,
): value is LinxioEndpointDefinition {
    return (
        typeof value.path === "string" &&
        (value.source === "dashboard" || value.source === "public-docs") &&
        isHttpMethod(value.method)
    );
}

function isHttpMethod(
    value: unknown,
): value is LinxioEndpointDefinition["method"] {
    return (
        value === "DELETE" ||
        value === "GET" ||
        value === "PATCH" ||
        value === "POST" ||
        value === "PUT"
    );
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}
