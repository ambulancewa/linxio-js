import type { LinxioPageResult, LinxioResult } from "../result";
import type { LinxioRecord, ListParams } from "../types/common";
import { BaseService } from "./base.service";

/** Dash cam event endpoints discovered from the dashboard bundle. */
export class CamerasService extends BaseService {
    /** List camera events. */
    events(params: ListParams = {}): Promise<LinxioPageResult<LinxioRecord>> {
        return this.getPage("/devices/cameras/events", params);
    }

    /** List camera event types. */
    eventTypes(): Promise<LinxioResult<LinxioRecord[]>> {
        return this.result(() =>
            this.http.get("/devices/cameras/events/types"),
        );
    }
}
