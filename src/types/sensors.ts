import type {
    DateRangeParams,
    ISODateString,
    LinxioId,
    LinxioRecord,
    ListParams,
} from "./common";

/** Common field names for Linxio sensor list responses. */
export type SensorField =
    | "id"
    | "label"
    | "sensorId"
    | "systemStatus"
    | "team"
    | "type"
    | (string & {});

/** Sensor record returned by Linxio sensor endpoints. */
export type LinxioSensor = LinxioRecord & {
    createdAt?: ISODateString | null;
    createdBy?: LinxioRecord | null;
    deviceId?: LinxioId | null;
    id: LinxioId;
    isAutoCreated?: boolean;
    label?: string | null;
    name?: string | null;
    sensorId?: string | null;
    systemStatus?: string | null;
    team?: LinxioRecord | null;
    type?: string | null;
    updatedAt?: ISODateString | null;
    updatedBy?: LinxioRecord | null;
    vehicleId?: LinxioId | null;
};

/** Parameters for `client.sensors.list()`. */
export type LinxioSensorListParams = ListParams<SensorField>;

/** Temperature/humidity reading returned by sensor reports. */
export type LinxioTemperatureHumidityReading = LinxioRecord & {
    humidity?: number | null;
    occurredAt?: ISODateString;
    sensorId?: LinxioId;
    temperature?: number | null;
    vehicleId?: LinxioId;
};

/** Parameters for temperature/humidity sensor reports. */
export type LinxioSensorReportParams = DateRangeParams &
    ListParams & {
        sensorId?: LinxioId;
        vehicleId?: LinxioId;
    };
