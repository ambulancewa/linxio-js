import { extractPageData, extractPageEnvelopeSource } from "./response";
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
    const source = extractPageEnvelopeSource(envelope);
    const sourceMeta =
        source.meta && typeof source.meta === "object" ? source.meta : {};
    const rootMeta =
        envelope.meta && typeof envelope.meta === "object" ? envelope.meta : {};
    const meta = {
        limit: Number(
            source.limit ??
                sourceMeta.limit ??
                envelope.limit ??
                rootMeta.limit ??
                0,
        ),
        page: Number(
            source.page ??
                sourceMeta.page ??
                envelope.page ??
                rootMeta.page ??
                1,
        ),
        total: Number(
            source.total ??
                sourceMeta.total ??
                envelope.total ??
                rootMeta.total ??
                0,
        ),
    };

    return {
        additionalFields:
            (source.additionalFields as Record<string, unknown> | undefined) ??
            envelope.additionalFields,
        aggregations: source.aggregations ?? envelope.aggregations,
        data: extractPageData<TData>(source),
        ...meta,
        meta,
    };
}

export function stripUndefined<T extends Record<string, unknown>>(value: T): T {
    return Object.fromEntries(
        Object.entries(value).filter(([, entry]) => entry !== undefined),
    ) as T;
}
