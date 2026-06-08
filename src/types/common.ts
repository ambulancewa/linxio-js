/** Linxio identifiers are usually numbers, but some dashboard payloads emit strings. */
export type LinxioId = number | string;

/** ISO-8601 date/time string, usually with a timezone offset. */
export type ISODateString = string;

export type JsonPrimitive = boolean | null | number | string;

export type JsonValue =
    | JsonPrimitive
    | JsonValue[]
    | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export type QueryPrimitive = boolean | number | string;

export type QueryValue =
    | Date
    | QueryPrimitive
    | QueryPrimitive[]
    | readonly QueryPrimitive[]
    | null
    | undefined;

/** Query parameter bag accepted by low-level requests and list methods. */
export type QueryParams = Record<string, QueryValue>;

export type SortDirection = "asc" | "desc";

/** File formats accepted by Linxio export/report endpoints. */
export type LinxioFileFormat = "csv" | "pdf" | "xlsx";

export type LinxioResourceStatus =
    | "active"
    | "archived"
    | "deleted"
    | "disabled"
    | "inactive";

/** Open object shape used for dashboard-derived payloads with partially inferred fields. */
export type LinxioRecord = Record<string, unknown>;

/** Field names to request via Linxio's `fields[]` query parameter. */
export type FieldSelector<TField extends string = string> =
    | readonly TField[]
    | TField[];

/** Common paginated-list parameters used across Linxio endpoints. */
export type ListParams<TField extends string = string> = QueryParams & {
    fields?: FieldSelector<TField>;
    limit?: number;
    page?: number;
    sort?: string;
};

/** Date-range parameters used by report and route endpoints. */
export type DateRangeParams = {
    dateFrom?: ISODateString;
    dateTo?: ISODateString;
    endDate?: ISODateString;
    startDate?: ISODateString;
};

/** Normalized pagination metadata returned by SDK list methods. */
export type LinxioPaginationMeta = {
    limit: number;
    page: number;
    total: number;
};

/** Normalized page returned by SDK list methods. */
export type LinxioPage<TData> = LinxioPaginationMeta & {
    additionalFields?: Record<string, unknown>;
    aggregations?: unknown;
    data: TData[];
    meta: LinxioPaginationMeta;
};

export type LinxioPageEnvelope<TData> = {
    additionalFields?: Record<string, unknown>;
    aggregations?: unknown;
    data?: TData[];
    limit?: number;
    meta?: Partial<LinxioPaginationMeta>;
    page?: number;
    total?: number;
};

/** Latitude/longitude coordinate. */
export type LatLng = {
    lat: number;
    lng: number;
};

export type LinxioUserSummary = {
    fullName?: string | null;
    id: LinxioId;
};

export type LinxioCurrency = {
    code: string;
    decimals?: number;
    id?: LinxioId;
    name?: string;
    symbol?: string;
};
