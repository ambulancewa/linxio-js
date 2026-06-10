import { collectPages, streamPages } from "../pagination";
import type { LinxioPageResult, LinxioResult } from "../result";
import type { LinxioId, LinxioRecord } from "../types/common";
import type {
    LinxioDevice,
    LinxioDeviceCamera,
    LinxioDeviceCoordinate,
    LinxioDeviceCoordinateParams,
    LinxioDeviceInstallation,
    LinxioDeviceInstallationLookupParams,
    LinxioDeviceInstallationPayload,
    LinxioDeviceListParams,
    LinxioDevicePayload,
    LinxioDeviceUninstallPayload,
    LinxioDeviceVendor,
} from "../types/devices";
import type { LinxioSensor, LinxioSensorListParams } from "../types/sensors";
import { BaseService } from "./base.service";

/** Device inventory, install, uninstall, coordinate, and sensor endpoints. */
export class DevicesService extends BaseService {
    /** List devices using Linxio's documented `/devices/json` endpoint. */
    list(
        params: LinxioDeviceListParams = {},
    ): Promise<LinxioPageResult<LinxioDevice>> {
        return this.getPage("/devices/json", params);
    }

    /** Load every device page into a single result. */
    iterate(
        params: LinxioDeviceListParams = {},
    ): Promise<LinxioResult<LinxioDevice[]>> {
        return collectPages((pageParams) => this.list(pageParams), params);
    }

    /** Stream every device page without loading the whole inventory at once. */
    stream(
        params: LinxioDeviceListParams = {},
    ): AsyncGenerator<LinxioDevice, void, undefined> {
        return streamPages((pageParams) => this.list(pageParams), params);
    }

    /** Fetch one device by internal Linxio device ID. */
    get(deviceId: LinxioId): Promise<LinxioResult<LinxioDevice>> {
        return this.result(() => this.http.get(`/devices/${deviceId}`));
    }

    /** Create a device. */
    create(payload: LinxioDevicePayload): Promise<LinxioResult<LinxioDevice>> {
        return this.result(() => this.http.post("/devices", payload));
    }

    /** Update a device using Linxio's documented PATCH endpoint. */
    update(
        deviceId: LinxioId,
        payload: LinxioDevicePayload,
    ): Promise<LinxioResult<LinxioDevice>> {
        return this.result(() =>
            this.http.patch(`/devices/${deviceId}`, payload),
        );
    }

    /** Install a device into a vehicle. */
    install(
        deviceId: LinxioId,
        payload: LinxioDeviceInstallationPayload,
    ): Promise<LinxioResult<LinxioDevice>> {
        return this.result(() =>
            this.http.post(`/devices/${deviceId}/install`, payload),
        );
    }

    /** Uninstall a device from its current vehicle. */
    uninstall(
        deviceId: LinxioId,
        payload: LinxioDeviceUninstallPayload = {},
    ): Promise<LinxioResult<LinxioDevice>> {
        return this.result(() =>
            this.http.post(`/devices/${deviceId}/uninstall`, payload),
        );
    }

    /** Soft-archive a device when the dashboard endpoint is available. */
    archive(deviceId: LinxioId): Promise<LinxioResult<void>> {
        return this.result(() =>
            this.http.patch(`/devices/${deviceId}/archive`, {}),
        );
    }

    /** Restore a previously archived device. */
    restore(deviceId: LinxioId): Promise<LinxioResult<void>> {
        return this.result(() =>
            this.http.patch(`/devices/${deviceId}/restore`, {}),
        );
    }

    /** Fetch recent coordinates for a device from the dashboard-derived endpoint. */
    coordinates(
        deviceId: LinxioId,
        params: LinxioDeviceCoordinateParams = {},
    ): Promise<LinxioResult<LinxioDeviceCoordinate[]>> {
        return this.result(() =>
            this.http.get(`/devices/${deviceId}/coordinates`, { params }),
        );
    }

    /** List sensor history rows for a device. */
    sensors(
        deviceId: LinxioId,
        params: LinxioSensorListParams = {},
    ): Promise<LinxioPageResult<LinxioSensor>> {
        return this.getPage(`/devices/${deviceId}/sensors/history`, params);
    }

    /** Fetch device history entries from the dashboard-derived endpoint. */
    history(deviceId: LinxioId): Promise<LinxioResult<LinxioRecord[]>> {
        return this.result(() => this.http.get(`/devices/${deviceId}/history`));
    }

    /** List device vendors from the dashboard-derived endpoint. */
    vendors(): Promise<LinxioResult<LinxioDeviceVendor[]>> {
        return this.result(() => this.http.get("/devices/vendors/"));
    }

    /** Look up a device installation by device IMEI or vehicle registration. */
    installation(
        params: LinxioDeviceInstallationLookupParams = {},
    ): Promise<LinxioResult<LinxioDeviceInstallation | null>> {
        return this.result(async () => {
            const installation = await this.http.get<LinxioDeviceInstallation>(
                "/devices/installation/",
                { params },
            );

            return isEmptyRecord(installation) ? null : installation;
        });
    }

    /** Backwards-compatible alias for `installation()`. */
    installations(
        params: LinxioDeviceInstallationLookupParams = {},
    ): Promise<LinxioResult<LinxioDeviceInstallation | null>> {
        return this.installation(params);
    }

    /** List cameras attached to a device from the dashboard-derived endpoint. */
    cameras(deviceId: LinxioId): Promise<LinxioResult<LinxioDeviceCamera[]>> {
        return this.result(() => this.http.get(`/devices/${deviceId}/cameras`));
    }
}

function isEmptyRecord(value: unknown): boolean {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        Object.keys(value).length === 0
    );
}
