import { mergeParams } from "../params";
import type { LinxioResult } from "../result";
import type { LinxioId } from "../types/common";
import type {
    LinxioVehicleRoutesGroup,
    LinxioVehicleRoutesParams,
} from "../types/routes";
import { BaseService } from "./base.service";

/** Vehicle route history endpoints. */
export class RoutesService extends BaseService {
    /**
     * Fetch route history for a vehicle.
     *
     * Requesting `fields: ["coordinates"]` can return very large responses, so
     * only include coordinates when your script really needs every point.
     */
    getVehicleRoutes(
        vehicleId: LinxioId,
        params: LinxioVehicleRoutesParams,
    ): Promise<LinxioResult<LinxioVehicleRoutesGroup[]>> {
        const { fields, ...rest } = params;
        return this.result(() =>
            this.http.get(`/vehicles/${vehicleId}/routes`, {
                params: mergeParams(rest, fields),
            }),
        );
    }
}
