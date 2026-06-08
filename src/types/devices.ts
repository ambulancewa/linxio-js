import type {
    ISODateString,
    LatLng,
    LinxioId,
    LinxioRecord,
    ListParams,
} from "./common";

/** Common field names for Linxio device list responses. */
export type DeviceField =
    | "id"
    | "imei"
    | "serial"
    | "status"
    | "vehicle"
    | "usage"
    | "vendor"
    | (string & {});

/** Device record returned by Linxio device endpoints. */
export type LinxioDevice = LinxioRecord & {
    id: LinxioId;
    imei?: string | null;
    lastCoordinates?: (LatLng & { ts?: ISODateString }) | null;
    serial?: string | null;
    status?: string | null;
    usage?: string | null;
    vehicleId?: LinxioId | null;
    vendor?: string | null;
};

/** Parameters for `client.devices.list()`. */
export type LinxioDeviceListParams = ListParams<DeviceField>;

/** Payload for creating or updating a device. */
export type LinxioDevicePayload = LinxioRecord & {
    imei?: string;
    serial?: string;
    typeId?: LinxioId;
    usage?: string;
    vendorId?: LinxioId;
};

/** Payload for installing a device into a vehicle. */
export type LinxioDeviceInstallationPayload = LinxioRecord & {
    installedAt?: ISODateString;
    odometer?: number;
    vehicleId: LinxioId;
};

/** Payload for uninstalling a device from a vehicle. */
export type LinxioDeviceUninstallPayload = LinxioRecord & {
    odometer?: number;
    uninstalledAt?: ISODateString;
};

/** Coordinate reported by a device. */
export type LinxioDeviceCoordinate = LinxioRecord &
    LatLng & {
        deviceId?: LinxioId;
        id?: LinxioId;
        ts?: ISODateString;
    };
