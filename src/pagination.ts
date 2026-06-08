import type { LinxioPageResult, LinxioResult } from "./result";
import { fail, ok, unwrapLinxioPageResult } from "./result";
import type { ListParams } from "./types/common";

/**
 * Load every page from a Linxio paginated endpoint into a single result.
 *
 * Services expose domain-specific wrappers around this helper, but it is
 * exported for advanced users building custom endpoint integrations.
 */
export async function collectPages<TData, TParams extends ListParams>(
    loadPage: (params: TParams) => Promise<LinxioPageResult<TData>>,
    params: TParams = {} as TParams,
): Promise<LinxioResult<TData[]>> {
    try {
        const data: TData[] = [];

        for await (const item of streamPages(loadPage, params)) {
            data.push(item);
        }

        return ok(data);
    } catch (error) {
        return fail(error);
    }
}

/**
 * Stream a Linxio paginated endpoint one item at a time.
 *
 * This helper throws the typed SDK error if any page fails. Use
 * {@link collectPages} when you prefer a `{ data, error }` result.
 */
export async function* streamPages<TData, TParams extends ListParams>(
    loadPage: (params: TParams) => Promise<LinxioPageResult<TData>>,
    params: TParams = {} as TParams,
): AsyncGenerator<TData, void, undefined> {
    let page = Number(params.page ?? 1);
    const limit = Number(params.limit ?? 100);

    while (true) {
        const result = unwrapLinxioPageResult(
            await loadPage({ ...params, limit, page } as TParams),
        );

        for (const item of result.data) {
            yield item;
        }

        const seen = result.meta.page * result.meta.limit;
        if (result.data.length === 0 || seen >= result.meta.total) {
            return;
        }

        page += 1;
    }
}
