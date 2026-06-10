import { LinxioError } from "./errors";
import { unwrapLinxioServiceData } from "./response";
import type { LinxioPage, LinxioPaginationMeta } from "./types/common";

/** Successful SDK operation result. */
export type LinxioSuccess<TData> = {
    /** Data returned by Linxio. */
    data: TData;
    /** Always `null` when the operation succeeds. */
    error: null;
};

/** Failed SDK operation result. */
export type LinxioFailure<TError extends LinxioError = LinxioError> = {
    /** Always `null` when the operation fails. */
    data: null;
    /** Typed SDK error with request context where available. */
    error: TError;
};

/** Standard result returned by SDK service methods. */
export type LinxioResult<TData, TError extends LinxioError = LinxioError> =
    | LinxioFailure<TError>
    | LinxioSuccess<TData>;

/** Successful paginated SDK result. */
export type LinxioPageSuccess<TData> = LinxioPaginationMeta & {
    /** Additional fields returned by selected Linxio endpoints. */
    additionalFields?: Record<string, unknown>;
    /** Aggregation data returned by selected Linxio endpoints. */
    aggregations?: unknown;
    /** Records returned for the current page. */
    data: TData[];
    /** Always `null` when the operation succeeds. */
    error: null;
    /** Normalized pagination metadata. */
    meta: LinxioPaginationMeta;
};

/** Failed paginated SDK result. */
export type LinxioPageFailure<TError extends LinxioError = LinxioError> = {
    /** Always `null` when the operation fails. */
    data: null;
    /** Typed SDK error with request context where available. */
    error: TError;
    /** Page limit is unavailable when the request fails. */
    limit: null;
    /** Pagination metadata is unavailable when the request fails. */
    meta: null;
    /** Page number is unavailable when the request fails. */
    page: null;
    /** Total count is unavailable when the request fails. */
    total: null;
};

/** Paginated result returned by SDK list/report methods. */
export type LinxioPageResult<TData, TError extends LinxioError = LinxioError> =
    | LinxioPageFailure<TError>
    | LinxioPageSuccess<TData>;

/** Create a successful result object. */
export function ok<TData>(data: TData): LinxioSuccess<TData> {
    return { data, error: null };
}

/** Create a failed result object from an unknown thrown value. */
export function fail(error: unknown): LinxioFailure<LinxioError> {
    return { data: null, error: toLinxioError(error) };
}

/** Convert a throwing promise factory into a standard SDK result. */
export async function toResult<TData>(
    operation: () => Promise<TData>,
): Promise<LinxioResult<TData>> {
    try {
        return ok(unwrapLinxioServiceData<TData>(await operation()));
    } catch (error) {
        return fail(error);
    }
}

/** Create a successful paginated result object. */
export function pageOk<TData>(
    page: LinxioPage<TData>,
): LinxioPageSuccess<TData> {
    return { ...page, error: null };
}

/** Create a failed paginated result object from an unknown thrown value. */
export function pageFail(error: unknown): LinxioPageFailure<LinxioError> {
    return {
        data: null,
        error: toLinxioError(error),
        limit: null,
        meta: null,
        page: null,
        total: null,
    };
}

/** Return `true` when a result contains a typed SDK error. */
export function isLinxioFailure(
    result: LinxioPageResult<unknown> | LinxioResult<unknown>,
): result is LinxioFailure | LinxioPageFailure {
    return result.error !== null;
}

/** Return the data from a result or throw the contained SDK error. */
export function unwrapLinxioResult<TData>(result: LinxioResult<TData>): TData {
    if (result.error) {
        throw result.error;
    }

    return result.data;
}

/** Return the page result or throw the contained SDK error. */
export function unwrapLinxioPageResult<TData>(
    result: LinxioPageResult<TData>,
): LinxioPageSuccess<TData> {
    if (result.error) {
        throw result.error;
    }

    return result;
}

/** Convert arbitrary thrown values into the SDK base error type. */
export function toLinxioError(error: unknown): LinxioError {
    if (error instanceof LinxioError) {
        return error;
    }

    if (error instanceof Error) {
        return new LinxioError(error.message, { cause: error });
    }

    return new LinxioError("Linxio SDK operation failed.", { cause: error });
}
