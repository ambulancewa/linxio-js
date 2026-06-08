import { collectPages, streamPages } from "../pagination";
import type { LinxioPageResult, LinxioResult } from "../result";
import type { LinxioId } from "../types/common";
import type {
    LinxioCount,
    LinxioEngineHours,
    LinxioOdometer,
    LinxioOdometerParams,
    LinxioOdometerRecalibration,
    LinxioVehicle,
    LinxioVehicleCountParams,
    LinxioVehicleListParams,
    LinxioVehiclePayload,
    LinxioVehicleType,
    LinxioVehicleTypeParams,
} from "../types/vehicles";
import { BaseService } from "./base.service";

/** Vehicle inventory, odometer, and vehicle lifecycle endpoints. */
export class VehiclesService extends BaseService {
    /** List vehicles using Linxio's documented `/vehicles/fields/json` endpoint. */
    list(
        params: LinxioVehicleListParams = {},
    ): Promise<LinxioPageResult<LinxioVehicle>> {
        return this.getPage("/vehicles/fields/json", params);
    }

    /** Load every vehicle page into a single result. */
    iterate(
        params: LinxioVehicleListParams = {},
    ): Promise<LinxioResult<LinxioVehicle[]>> {
        return collectPages((pageParams) => this.list(pageParams), params);
    }

    /** Stream every vehicle page without loading the whole fleet at once. */
    stream(
        params: LinxioVehicleListParams = {},
    ): AsyncGenerator<LinxioVehicle, void, undefined> {
        return streamPages((pageParams) => this.list(pageParams), params);
    }

    /** Fetch one vehicle by internal Linxio vehicle ID. */
    get(vehicleId: LinxioId): Promise<LinxioResult<LinxioVehicle>> {
        return this.result(() => this.http.get(`/vehicles/${vehicleId}`));
    }

    /** Create a vehicle. Validate payloads carefully against your Linxio tenant requirements. */
    create(
        payload: LinxioVehiclePayload,
    ): Promise<LinxioResult<LinxioVehicle>> {
        return this.result(() => this.http.post("/vehicles", payload));
    }

    /** Update a vehicle using Linxio's documented POST update endpoint. */
    update(
        vehicleId: LinxioId,
        payload: LinxioVehiclePayload,
    ): Promise<LinxioResult<LinxioVehicle>> {
        return this.result(() =>
            this.http.post(`/vehicles/${vehicleId}`, payload),
        );
    }

    /** Soft-archive a vehicle when the dashboard endpoint is available. */
    archive(vehicleId: LinxioId): Promise<LinxioResult<void>> {
        return this.result(() =>
            this.http.patch(`/vehicles/${vehicleId}/archive`, {}),
        );
    }

    /** Restore a previously archived vehicle when the dashboard endpoint is available. */
    restore(vehicleId: LinxioId): Promise<LinxioResult<void>> {
        return this.result(() =>
            this.http.post(`/vehicles/${vehicleId}/restore`, {}),
        );
    }

    /** Get a vehicle odometer reading, optionally at a specific occurrence time. */
    getOdometer(
        vehicleId: LinxioId,
        params: LinxioOdometerParams = {},
    ): Promise<LinxioResult<LinxioOdometer>> {
        return this.result(() =>
            this.http.get(`/vehicles/${vehicleId}/odometer`, { params }),
        );
    }

    /** Recalibrate a vehicle odometer in metres. */
    recalibrateOdometer(
        vehicleId: LinxioId,
        payload: LinxioOdometerRecalibration,
    ): Promise<LinxioResult<LinxioOdometer>> {
        return this.result(() =>
            this.http.post(`/vehicles/${vehicleId}/odometer`, payload),
        );
    }

    /** Fetch current engine hours from the dashboard-derived endpoint. */
    getEngineHours(
        vehicleId: LinxioId,
    ): Promise<LinxioResult<LinxioEngineHours>> {
        return this.result(() =>
            this.http.get(`/vehicles/${vehicleId}/engine-hours/current`),
        );
    }

    /** Count vehicles using the dashboard-derived count endpoint. */
    count(
        params: LinxioVehicleCountParams = {},
    ): Promise<LinxioResult<LinxioCount>> {
        return this.result(() => this.http.get("/vehicles/count", { params }));
    }

    /** List vehicle types using the dashboard-derived vehicle type endpoint. */
    types(
        params: LinxioVehicleTypeParams = {},
    ): Promise<LinxioResult<LinxioVehicleType[]>> {
        return this.result(() =>
            this.http.get("/vehicles/types", {
                params: {
                    limit: 1000,
                    sort: "order",
                    ...params,
                },
            }),
        );
    }
}
