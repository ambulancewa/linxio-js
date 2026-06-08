import type { LatLng, LinxioId, LinxioRecord, ListParams } from "./common";

/** Shape type accepted by Linxio geofence/area endpoints. */
export type GeofenceType =
    | "circle"
    | "polygon"
    | "polyline"
    | "rectangle"
    | (string & {});

/** Geofence object. Linxio's API calls these `areas`. */
export type LinxioGeofence = LinxioRecord & {
    color?: string | null;
    coordinates?: LatLng[];
    id: LinxioId;
    name: string;
    radius?: number | null;
    type?: GeofenceType;
};

/** Parameters for `client.geofences.list()`. */
export type LinxioGeofenceListParams = ListParams;

/** Payload for creating or updating a geofence. */
export type LinxioGeofencePayload = LinxioRecord & {
    color?: string;
    coordinates?: LatLng[];
    name: string;
    radius?: number;
    type: GeofenceType;
};

/** Dashboard area group record. */
export type LinxioAreaGroup = LinxioRecord & {
    id: LinxioId;
    name: string;
};

/** Payload accepted by dashboard-derived area group endpoints. */
export type LinxioAreaGroupPayload = LinxioRecord & {
    name: string;
};
