import { collectPages, streamPages } from "../pagination";
import type { LinxioPageResult, LinxioResult } from "../result";
import type { LinxioId } from "../types/common";
import type {
    LinxioAreaGroup,
    LinxioGeofence,
    LinxioGeofenceListParams,
    LinxioGeofencePayload,
} from "../types/geofences";
import { BaseService } from "./base.service";

/** Geofence/area endpoints. Linxio calls geofences `areas` in the API. */
export class GeofencesService extends BaseService {
    /** List geofence objects. */
    list(
        params: LinxioGeofenceListParams = {},
    ): Promise<LinxioPageResult<LinxioGeofence>> {
        return this.getPage("/areas", params);
    }

    /** Load every geofence page into a single result. */
    iterate(
        params: LinxioGeofenceListParams = {},
    ): Promise<LinxioResult<LinxioGeofence[]>> {
        return collectPages((pageParams) => this.list(pageParams), params);
    }

    /** Stream every geofence page without loading every geofence at once. */
    stream(
        params: LinxioGeofenceListParams = {},
    ): AsyncGenerator<LinxioGeofence, void, undefined> {
        return streamPages((pageParams) => this.list(pageParams), params);
    }

    /** Fetch one geofence by Linxio area ID. */
    get(areaId: LinxioId): Promise<LinxioResult<LinxioGeofence>> {
        return this.result(() => this.http.get(`/areas/${areaId}`));
    }

    /** Create a geofence object. */
    create(
        payload: LinxioGeofencePayload,
    ): Promise<LinxioResult<LinxioGeofence>> {
        return this.result(() => this.http.post("/areas", payload));
    }

    /** Update a geofence object using the dashboard-derived endpoint. */
    update(
        areaId: LinxioId,
        payload: Partial<LinxioGeofencePayload>,
    ): Promise<LinxioResult<LinxioGeofence>> {
        return this.result(() => this.http.patch(`/areas/${areaId}`, payload));
    }

    /** Permanently delete a geofence object. Prefer `archive()` if you need reversibility. */
    delete(areaId: LinxioId): Promise<LinxioResult<void>> {
        return this.result(() => this.http.delete(`/areas/${areaId}`));
    }

    /** Soft-archive a geofence object when the dashboard endpoint is available. */
    archive(areaId: LinxioId): Promise<LinxioResult<void>> {
        return this.result(() =>
            this.http.patch(`/areas/${areaId}/archive`, {}),
        );
    }

    /** Restore a previously archived geofence object. */
    restore(areaId: LinxioId): Promise<LinxioResult<void>> {
        return this.result(() =>
            this.http.patch(`/areas/${areaId}/restore`, {}),
        );
    }

    /** List area groups from the dashboard-derived endpoint. */
    listGroups(): Promise<LinxioResult<LinxioAreaGroup[]>> {
        return this.result(() => this.http.get("/area-groups"));
    }
}
