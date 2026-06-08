import { collectPages, streamPages } from "../pagination";
import type { LinxioPageResult, LinxioResult } from "../result";
import type { LinxioId } from "../types/common";
import type { LinxioDriver, LinxioDriverListParams } from "../types/drivers";
import { BaseService } from "./base.service";

/** Driver listing and vehicle assignment endpoints. */
export class DriversService extends BaseService {
    /** List drivers, optionally via the documented client-users driver endpoint. */
    list(
        params: LinxioDriverListParams = {},
    ): Promise<LinxioPageResult<LinxioDriver>> {
        const { clientId, ...rest } = params;
        if (clientId) {
            return this.getPage(`/clients/${clientId}/users`, {
                ...rest,
                role: "driver",
            });
        }

        return this.getPage("/drivers", rest);
    }

    /** Load every driver page into a single result. */
    iterate(
        params: LinxioDriverListParams = {},
    ): Promise<LinxioResult<LinxioDriver[]>> {
        return collectPages((pageParams) => this.list(pageParams), params);
    }

    /** Stream every driver page without loading every driver at once. */
    stream(
        params: LinxioDriverListParams = {},
    ): AsyncGenerator<LinxioDriver, void, undefined> {
        return streamPages((pageParams) => this.list(pageParams), params);
    }

    /** Assign a driver to a vehicle. */
    assignToVehicle(
        vehicleId: LinxioId,
        driverId: LinxioId,
    ): Promise<LinxioResult<void>> {
        return this.result(() =>
            this.http.post(`/vehicle/${vehicleId}/set-driver/${driverId}`, {}),
        );
    }

    /** Unassign a driver from a vehicle. */
    unassignFromVehicle(
        vehicleId: LinxioId,
        driverId: LinxioId,
    ): Promise<LinxioResult<void>> {
        return this.result(() =>
            this.http.post(
                `/vehicle/${vehicleId}/unset-driver/${driverId}`,
                {},
            ),
        );
    }
}
