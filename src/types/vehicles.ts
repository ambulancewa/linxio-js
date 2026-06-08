import type {
    ISODateString,
    LatLng,
    LinxioId,
    LinxioRecord,
    ListParams,
} from "./common";

/** Common field names for Linxio vehicle list responses. */
export type VehicleField =
    | "id"
    | "regNo"
    | "defaultLabel"
    | "model"
    | "depotName"
    | "groupsList"
    | "driver"
    | "status"
    | "lastLoggedAt"
    | "lastCoordinates"
    | "todayData"
    | (string & {});

/** Vehicle record returned by Linxio vehicle endpoints. */
export type LinxioVehicle = LinxioRecord & {
    defaultLabel?: string | null;
    depotName?: string | null;
    driver?: string | null;
    driverId?: LinxioId | null;
    groupsList?: string | null;
    id: LinxioId;
    lastCoordinates?: (LatLng & { ts?: ISODateString }) | null;
    lastLoggedAt?: ISODateString | null;
    model?: string | null;
    regNo?: string | null;
    status?: string | null;
    todayData?: {
        avgSpeed?: number;
        distance?: number;
        duration?: number;
    } | null;
};

/** Parameters for `client.vehicles.list()`. */
export type LinxioVehicleListParams = ListParams<VehicleField>;

/** Payload for creating or updating a vehicle. */
export type LinxioVehiclePayload = LinxioRecord & {
    defaultLabel?: string;
    depotId?: LinxioId | null;
    groupIds?: LinxioId[];
    model?: string;
    regNo?: string;
    typeId?: LinxioId;
    vin?: string;
};

/** Vehicle odometer reading returned by Linxio. */
export type LinxioOdometer = LinxioRecord & {
    accuracy?: number | null;
    deviceId?: LinxioId | null;
    driverId?: LinxioId | null;
    id?: LinxioId | null;
    isSyncedWithDevice?: boolean;
    lastTrackerRecordOccurredAt?: ISODateString | null;
    lastTrackerRecordOdometer?: number | null;
    occurredAt?: ISODateString | null;
    odometer: number;
    vehicleId: LinxioId;
};

/** Optional parameters for fetching odometer values. */
export type LinxioOdometerParams = {
    occurredAt?: ISODateString;
};

/** Payload for recalibrating a vehicle odometer. */
export type LinxioOdometerRecalibration = {
    occurredAt: ISODateString;
    odometer: number;
};

/** Current engine-hours reading for a vehicle. */
export type LinxioEngineHours = LinxioRecord & {
    engineHours: number;
    occurredAt?: ISODateString | null;
    vehicleId: LinxioId;
};
