import type {
    FieldSelector,
    LinxioPage,
    LinxioPageEnvelope,
    QueryParams,
    QueryValue,
} from "./types/common";

export function normalisePath(path: string): string {
    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    return path.startsWith("/") ? path : `/${path}`;
}

export function mergeParams(
    params?: QueryParams,
    fields?: FieldSelector<string>,
): QueryParams {
    const merged: QueryParams = { ...(params ?? {}) };
    delete merged.fields;

    if (fields?.length) {
        merged["fields[]"] = [...fields];
    }

    return merged;
}

export function appendQueryParams(url: URL, params?: QueryParams): URL {
    if (!params) {
        return url;
    }

    for (const [key, value] of Object.entries(params)) {
        appendQueryParam(url, key, value);
    }

    return url;
}

function appendQueryParam(url: URL, key: string, value: QueryValue): void {
    if (value === null || value === undefined) {
        return;
    }

    if (Array.isArray(value)) {
        const arrayKey = key.endsWith("[]") ? key : `${key}[]`;
        for (const item of value) {
            url.searchParams.append(arrayKey, String(item));
        }
        return;
    }

    url.searchParams.append(
        key,
        value instanceof Date ? value.toISOString() : String(value),
    );
}

export function toPage<TData>(
    envelope: LinxioPageEnvelope<TData>,
): LinxioPage<TData> {
    const meta = {
        limit: Number(envelope.limit ?? envelope.meta?.limit ?? 0),
        page: Number(envelope.page ?? envelope.meta?.page ?? 1),
        total: Number(envelope.total ?? envelope.meta?.total ?? 0),
    };

    return {
        additionalFields: envelope.additionalFields,
        aggregations: envelope.aggregations,
        data: Array.isArray(envelope.data) ? envelope.data : [],
        ...meta,
        meta,
    };
}

export function stripUndefined<T extends Record<string, unknown>>(value: T): T {
    return Object.fromEntries(
        Object.entries(value).filter(([, entry]) => entry !== undefined),
    ) as T;
}
