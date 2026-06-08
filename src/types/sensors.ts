import type {
    DateRangeParams,
    ISODateString,
    LinxioId,
    LinxioRecord,
    ListParams,
} from "./common";

/** Sensor record returned by Linxio sensor endpoints. */
export type LinxioSensor = LinxioRecord & {
    deviceId?: LinxioId | null;
    id: LinxioId;
    name?: string | null;
    type?: string | null;
    vehicleId?: LinxioId | null;
};

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
