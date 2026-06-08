import type { HttpClient, LinxioHttpRequestOptions } from "../http";
import { mergeParams, toPage } from "../params";
import { pageFail, pageOk, toResult } from "../result";
import type { LinxioPageResult, LinxioResult } from "../result";
import type {
    FieldSelector,
    LinxioPageEnvelope,
    ListParams,
    QueryParams,
} from "../types/common";

export abstract class BaseService {
    constructor(protected readonly http: HttpClient) {}

    protected async getPage<TData, TField extends string = string>(
        path: string,
        params: ListParams<TField> = {},
        options: LinxioHttpRequestOptions = {},
    ): Promise<LinxioPageResult<TData>> {
        try {
            const response = await this.http.get<LinxioPageEnvelope<TData>>(
                path,
                {
                    ...options,
                    params: this.listParams(params),
                },
            );

            return pageOk(toPage(response));
        } catch (error) {
            return pageFail<TData>(error);
        }
    }

    protected result<TData>(
        operation: () => Promise<TData>,
    ): Promise<LinxioResult<TData>> {
        return toResult(operation);
    }

    protected listParams<TField extends string>(
        params: ListParams<TField> = {},
    ): QueryParams {
        const { fields, ...rest } = params;
        return mergeParams(rest, fields as FieldSelector<string> | undefined);
    }
}
