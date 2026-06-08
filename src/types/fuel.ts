import type {
    ISODateString,
    LinxioId,
    LinxioRecord,
    ListParams,
} from "./common";

/** Common field names for fuel record list responses. */
export type FuelRecordField =
    | "transactionDate"
    | "vehicleIds"
    | "driverId"
    | "refueled"
    | "total"
    | "fuelPrice"
    | "petrolStation"
    | (string & {});

/** Fuel transaction record. */
export type LinxioFuelRecord = LinxioRecord & {
    driver?: string | null;
    fuelCardNumber?: string | null;
    fuelPrice?: number | null;
    id: LinxioId;
    petrolStation?: string | null;
    refueled?: number | null;
    total?: number | null;
    transactionDate?: ISODateString;
    vehicle?: LinxioRecord | null;
};

/** Fuel summary row. */
export type LinxioFuelSummaryRecord = LinxioRecord & {
    depot?: string | null;
    groups?: string | null;
    mileage?: number | null;
    refueled?: number | null;
    regNo?: string | null;
    total?: number | null;
};

/** Parameters for fuel list and summary endpoints. */
export type LinxioFuelListParams = ListParams<FuelRecordField>;

/** Fuel card record. */
export type LinxioFuelCard = LinxioRecord & {
    cardNumber?: string;
    id: LinxioId;
    vehicleId?: LinxioId | null;
};
