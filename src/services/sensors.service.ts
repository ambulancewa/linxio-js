import { collectPages, streamPages } from "../pagination";
import type { LinxioPageResult, LinxioResult } from "../result";
import type { LinxioId } from "../types/common";
import type {
    LinxioSensor,
    LinxioSensorListParams,
    LinxioSensorReportParams,
    LinxioTemperatureHumidityReading,
} from "../types/sensors";
import { BaseService } from "./base.service";

/** Sensor inventory and temperature/humidity report endpoints. */
export class SensorsService extends BaseService {
    /** List sensors from the dashboard-derived endpoint. */
    list(
        params: LinxioSensorListParams = {},
    ): Promise<LinxioPageResult<LinxioSensor>> {
        return this.getPage("/sensors", params);
    }

    /** Load every sensor page into a single result. */
    iterate(
        params: LinxioSensorListParams = {},
    ): Promise<LinxioResult<LinxioSensor[]>> {
        return collectPages((pageParams) => this.list(pageParams), params);
    }

    /** Stream sensors without loading the whole inventory at once. */
    stream(
        params: LinxioSensorListParams = {},
    ): AsyncGenerator<LinxioSensor, void, undefined> {
        return streamPages((pageParams) => this.list(pageParams), params);
    }

    /** Fetch one sensor by internal Linxio sensor ID. */
    get(sensorId: LinxioId): Promise<LinxioResult<LinxioSensor>> {
        return this.result(() => this.http.get(`/sensors/${sensorId}`));
    }

    /** Install or pair a sensor with a device. */
    install(
        sensorId: LinxioId,
        deviceId: LinxioId,
    ): Promise<LinxioResult<LinxioSensor>> {
        return this.result(() =>
            this.http.post(`/sensors/${sensorId}/install`, { deviceId }),
        );
    }

    /** Fetch the documented temperature/humidity report grouped by device sensor. */
    deviceTemperatureHumidityReport(
        params: LinxioSensorReportParams = {},
    ): Promise<LinxioPageResult<LinxioTemperatureHumidityReading>> {
        return this.getPage(
            "/devices/sensors/report/temp-and-humidity",
            params,
        );
    }

    /** Fetch the documented temperature/humidity report grouped by vehicle. */
    vehicleTemperatureHumidityReport(
        params: LinxioSensorReportParams = {},
    ): Promise<LinxioPageResult<LinxioTemperatureHumidityReading>> {
        return this.getPage(
            "/vehicles/report/sensors/temp-and-humidity",
            params,
        );
    }

    /** Load every device temperature/humidity report page into a single result. */
    iterateDeviceTemperatureHumidityReport(
        params: LinxioSensorReportParams = {},
    ): Promise<LinxioResult<LinxioTemperatureHumidityReading[]>> {
        return collectPages(
            (pageParams) => this.deviceTemperatureHumidityReport(pageParams),
            params,
        );
    }

    /** Stream the device temperature/humidity report one reading at a time. */
    streamDeviceTemperatureHumidityReport(
        params: LinxioSensorReportParams = {},
    ): AsyncGenerator<LinxioTemperatureHumidityReading, void, undefined> {
        return streamPages(
            (pageParams) => this.deviceTemperatureHumidityReport(pageParams),
            params,
        );
    }
}
