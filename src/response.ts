const envelopeKeys = new Set([
    "additionalFields",
    "aggregations",
    "data",
    "limit",
    "links",
    "meta",
    "page",
    "result",
    "total",
]);

type UnknownRecord = Record<string, unknown>;

export function unwrapLinxioServiceData<TData>(value: unknown): TData {
    const payload = unwrapResultEnvelope(value);

    if (!isRecord(payload)) {
        return payload as TData;
    }

    if (isDataEnvelope(payload)) {
        return payload.data as TData;
    }

    const singletonArray = getSingletonArrayPayload(payload);
    if (singletonArray) {
        return singletonArray as TData;
    }

    return payload as TData;
}

export function extractPageEnvelopeSource(value: unknown): UnknownRecord {
    const root = isRecord(value) ? value : {};
    const result = isRecord(root.result) ? root.result : undefined;

    return result ?? root;
}

export function extractPageData<TData>(source: UnknownRecord): TData[] {
    if (Array.isArray(source.data)) {
        return source.data as TData[];
    }

    return (getSingletonArrayPayload(source) as TData[] | undefined) ?? [];
}

function unwrapResultEnvelope(value: unknown): unknown {
    if (!isRecord(value) || !Object.hasOwn(value, "result")) {
        return value;
    }

    return value.result;
}

function isDataEnvelope(value: UnknownRecord): value is UnknownRecord & {
    data: unknown;
} {
    return (
        Object.hasOwn(value, "data") &&
        Object.keys(value).every((key) => envelopeKeys.has(key))
    );
}

function getSingletonArrayPayload(value: UnknownRecord): unknown[] | undefined {
    const arrayEntries = Object.entries(value).filter(
        ([key, entry]) => !envelopeKeys.has(key) && Array.isArray(entry),
    );

    return arrayEntries.length === 1
        ? (arrayEntries[0]?.[1] as unknown[])
        : undefined;
}

function isRecord(value: unknown): value is UnknownRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
