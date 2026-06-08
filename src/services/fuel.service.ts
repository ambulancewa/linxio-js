import { collectPages, streamPages } from "../pagination";
import type { LinxioPageResult, LinxioResult } from "../result";
import type { LinxioId, LinxioRecord } from "../types/common";
import type {
    LinxioFuelCard,
    LinxioFuelListParams,
    LinxioFuelRecord,
    LinxioFuelSummaryRecord,
} from "../types/fuel";
import { BaseService } from "./base.service";

/** Fuel card, fuel transaction, and fuel summary endpoints. */
export class FuelService extends BaseService {
    /** List fuel transaction records from the dashboard-derived endpoint. */
    records(
        params: LinxioFuelListParams = {},
    ): Promise<LinxioPageResult<LinxioFuelRecord>> {
        return this.getPage("/fuel-cards/json", params);
    }

    /** Load every fuel transaction page into a single result. */
    iterateRecords(
        params: LinxioFuelListParams = {},
    ): Promise<LinxioResult<LinxioFuelRecord[]>> {
        return collectPages((pageParams) => this.records(pageParams), params);
    }

    /** Stream fuel transaction records without loading every record at once. */
    streamRecords(
        params: LinxioFuelListParams = {},
    ): AsyncGenerator<LinxioFuelRecord, void, undefined> {
        return streamPages((pageParams) => this.records(pageParams), params);
    }

    /** Fetch fuel summary rows. */
    summary(
        params: LinxioFuelListParams = {},
    ): Promise<LinxioPageResult<LinxioFuelSummaryRecord>> {
        return this.getPage("/fuel-summary-report", params);
    }

    /** Fetch fuel transaction records grouped or filtered by vehicle. */
    recordsByVehicle(
        params: LinxioFuelListParams = {},
    ): Promise<LinxioPageResult<LinxioFuelRecord>> {
        return this.getPage("/fuel-cards-by-vehicle/json", params);
    }

    /** List fuel cards. */
    cards(
        params: LinxioFuelListParams = {},
    ): Promise<LinxioPageResult<LinxioFuelCard>> {
        return this.getPage("/fuel-cards/json", params);
    }

    /** List fuel types configured by Linxio. */
    fuelTypes(): Promise<LinxioResult<LinxioRecord[]>> {
        return this.result(() => this.http.get("/fuel-types"));
    }

    /** Assign a fuel transaction to a vehicle. */
    assignTransaction(
        recordId: LinxioId,
        vehicleId: LinxioId,
    ): Promise<LinxioResult<LinxioFuelRecord>> {
        return this.result(() =>
            this.http.patch(`/fuel-cards/record/${recordId}`, { vehicleId }),
        );
    }
}
