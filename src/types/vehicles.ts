import type {
    ISODateString,
    LatLng,
    LinxioId,
    LinxioRecord,
    ListParams,
    QueryParams,
} from "./common";
import type { LinxioTeamSummary, LinxioUserAuditSummary } from "./devices";
import type { LinxioUser } from "./users";

/** Common field names for Linxio vehicle list responses. */
export type VehicleField =
    | "id"
    | "regNo"
    | "defaultLabel"
    | "model"
    | "depotName"
    | "depot"
    | "groupsList"
    | "groups"
    | "driver"
    | "type"
    | "typeId"
    | "typeName"
    | "make"
    | "makeModel"
    | "vin"
    | "deviceId"
    | "status"
    | "lastLoggedAt"
    | "lastCoordinates"
    | "todayData"
    | (string & {});

/** Vehicle record returned by Linxio vehicle endpoints. */
export type LinxioVehicle = LinxioRecord & {
    areas?: LinxioVehicleAreaAssignment[];
    averageDailyMileage?: number | null;
    averageFuel?: number | null;
    co2Emissions?: number | null;
    createdAt?: ISODateString | null;
    createdBy?: LinxioUserAuditSummary | null;
    defaultLabel?: string | null;
    depot?: LinxioVehicleDepot | null;
    depotName?: string | null;
    deviceId?: LinxioId | null;
    driver?: LinxioVehicleDriver | string | null;
    driverId?: LinxioId | null;
    ecoSpeed?: number | null;
    emissionClass?: string | null;
    engineCapacity?: number | null;
    engineOnTime?: number | null;
    enginePower?: number | null;
    excessiveIdling?: number | null;
    fuelTankCapacity?: number | null;
    fuelType?: LinxioId | null;
    grossWeight?: number | null;
    groups?: LinxioVehicleGroup[];
    groupsList?: string | null;
    id: LinxioId;
    lastCoordinates?: (LatLng & { ts?: ISODateString }) | null;
    lastLoggedAt?: ISODateString | null;
    make?: string | null;
    makeModel?: string | null;
    model?: string | null;
    picture?: string | null;
    regCertNo?: string | null;
    regDate?: ISODateString | null;
    regNo?: string | null;
    status?: string | null;
    team?: LinxioTeamSummary | null;
    teamId?: LinxioId | null;
    todayData?: {
        avgSpeed?: number;
        distance?: number;
        duration?: number;
        idleDuration?: number;
    } | null;
    type?: string | null;
    typeId?: LinxioId | null;
    typeName?: string | null;
    unavailableMessage?: string | null;
    updatedAt?: ISODateString | null;
    updatedBy?: LinxioUserAuditSummary | null;
    vin?: string | null;
    year?: number | null;
};

/** Depot object nested in vehicle responses. */
export type LinxioVehicleDepot = LinxioRecord & {
    color?: string | null;
    createdAt?: ISODateString | null;
    id: LinxioId;
    name?: string | null;
    status?: LinxioId | string | null;
};

/** Vehicle group object nested in vehicle responses. */
export type LinxioVehicleGroup = LinxioRecord & {
    color?: string | null;
    id: LinxioId;
    name?: string | null;
};

/** Current area assignment nested in vehicle responses. */
export type LinxioVehicleAreaAssignment = LinxioRecord & {
    area?: LinxioRecord & {
        color?: string | null;
        id?: LinxioId;
        name?: string | null;
        status?: string | null;
    };
    arrived?: ISODateString | null;
    departed?: ISODateString | null;
    driverArrived?: ISODateString | null;
    driverDeparted?: ISODateString | null;
    id?: LinxioId;
};

/** Driver object nested in vehicle responses when a driver is assigned. */
export type LinxioVehicleDriver = LinxioUser & {
    driverFOBId?: string | null;
    driverSensorId?: string | null;
    lastLoggedAt?: ISODateString | null;
    name?: string | null;
    surname?: string | null;
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
    id?: LinxioId;
    occurredAt?: ISODateString | null;
    prevEngineHours?: number | null;
    vehicleId: LinxioId;
};

/** Count response returned by dashboard-derived count endpoints. */
export type LinxioCount = LinxioRecord & {
    count?: number;
    total?: number;
};

/** Vehicle type record returned by the dashboard-derived vehicle types endpoint. */
export type LinxioVehicleType = LinxioRecord & {
    default?: string | null;
    driving?: string | null;
    id: LinxioId;
    idling?: string | null;
    name?: string;
    order?: number;
    status?: string | null;
    stopped?: string | null;
};

/** Optional filters accepted by `client.vehicles.count()`. */
export type LinxioVehicleCountParams = QueryParams;

/** Parameters for `client.vehicles.types()`. */
export type LinxioVehicleTypeParams = QueryParams & {
    limit?: number;
    sort?: string;
};
