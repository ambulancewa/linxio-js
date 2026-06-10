import type {
    DateRangeParams,
    ISODateString,
    LatLng,
    LinxioId,
    LinxioRecord,
    ListParams,
    QueryParams,
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
    | "model"
    | "trackerData"
    | "deviceInstallation"
    | (string & {});

/** Device record returned by Linxio device endpoints. */
export type LinxioDevice = LinxioRecord & {
    createdAt?: ISODateString | null;
    createdBy?: LinxioUserAuditSummary | null;
    deviceInstallation?: LinxioDeviceInstallation | null;
    hasCameras?: boolean;
    hw?: string | null;
    iccid?: string | null;
    id: LinxioId;
    imei?: string | null;
    imsi?: string | null;
    installDate?: ISODateString | null;
    isDeactivated?: boolean;
    isFixWithSpeed?: boolean;
    isUnavailable?: boolean;
    lastActiveTime?: ISODateString | null;
    lastCoordinates?: (LatLng & { ts?: ISODateString }) | null;
    lastDataReceivedAt?: ISODateString | null;
    model?: LinxioDeviceModel | string | null;
    phone?: string | null;
    port?: number | null;
    professionalInstall?: boolean | null;
    serial?: string | null;
    sn?: string | null;
    status?: string | null;
    statusExt?: string | null;
    statusUpdatedAt?: ISODateString | null;
    sw?: string | null;
    team?: LinxioTeamSummary | null;
    trackerData?: LinxioRecord | null;
    uninstallDate?: ISODateString | null;
    updatedAt?: ISODateString | null;
    updatedBy?: LinxioUserAuditSummary | null;
    usage?: string | null;
    vehicleId?: LinxioId | null;
    vendor?: LinxioDeviceVendor | string | null;
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

/** Optional filters for recent device coordinates. */
export type LinxioDeviceCoordinateParams = DateRangeParams &
    QueryParams & {
        filter?: string;
        sameTimeEachDay?: boolean;
    };

/** Lookup parameters for the live `/devices/installation/` endpoint. */
export type LinxioDeviceInstallationLookupParams = QueryParams & {
    deviceImei?: string;
    vehicleRegNo?: string;
};

/** Device vendor record from the dashboard-derived vendor endpoint. */
export type LinxioDeviceVendor = LinxioRecord & {
    id?: LinxioId;
    models?: LinxioDeviceModel[];
    name?: string;
};

/** Device model nested under vendor and device responses. */
export type LinxioDeviceModel = LinxioRecord & {
    id?: LinxioId;
    name?: string;
    vendorId?: LinxioId;
};

/** Device installation row from the dashboard-derived installation endpoint. */
export type LinxioDeviceInstallation = LinxioRecord & {
    device?: LinxioRecord | null;
    deviceId?: LinxioId;
    files?: LinxioRecord[];
    id?: LinxioId;
    installDate?: ISODateString | null;
    installedAt?: ISODateString | null;
    odometer?: number | null;
    uninstallDate?: ISODateString | null;
    uninstalledAt?: ISODateString | null;
    vehicle?: LinxioRecord | null;
    vehicleId?: LinxioId;
};

/** Camera record associated with a device. */
export type LinxioDeviceCamera = LinxioRecord & {
    deviceId?: LinxioId;
    expiredAt?: ISODateString | null;
    id?: LinxioId;
    isAvailable?: boolean;
    name?: string;
    status?: string;
    type?: string;
    url?: string;
};

export type LinxioTeamSummary = LinxioRecord & {
    clientId?: LinxioId | null;
    clientName?: string | null;
    id?: LinxioId;
    resellerId?: LinxioId | null;
    resellerName?: string | null;
    type?: string;
};

export type LinxioUserAuditSummary = LinxioRecord & {
    email?: string | null;
    fullName?: string | null;
    id?: LinxioId;
    teamType?: string | null;
};
