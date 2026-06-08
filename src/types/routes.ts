import type {
    DateRangeParams,
    ISODateString,
    LatLng,
    LinxioId,
    LinxioRecord,
    ListParams,
} from "./common";

/** Optional vehicle route fields. `coordinates` may produce very large responses. */
export type RouteField =
    | "coordinates"
    | "driver"
    | "vehicle"
    | "address"
    | (string & {});

/** One route coordinate point. */
export type LinxioRouteCoordinate = LinxioRecord &
    LatLng & {
        id?: LinxioId;
        nullable?: boolean;
        ts?: ISODateString;
    };

/** Start or finish point for a route segment. */
export type LinxioRoutePoint = {
    address?: string | null;
    lastCoordinates?: (LatLng & { ts?: ISODateString }) | null;
};

/** One route segment returned by Linxio. */
export type LinxioVehicleRoute = LinxioRecord & {
    address?: string | null;
    avgSpeed?: number | null;
    comment?: string | null;
    coordinates?: LinxioRouteCoordinate[];
    deviceId?: LinxioId | null;
    distance?: number | string | null;
    driverId?: LinxioId | null;
    duration?: number | null;
    id: LinxioId;
    maxSpeed?: number | null;
    pointFinish?: LinxioRoutePoint | null;
    pointStart?: LinxioRoutePoint | null;
    scope?: unknown;
    type?: "driving" | "idle" | "stopped" | (string & {});
    vehicleId: LinxioId;
};

/** Route response group for a vehicle/driver pair. */
export type LinxioVehicleRoutesGroup = LinxioRecord & {
    driverId?: LinxioId | null;
    routes: LinxioVehicleRoute[];
    vehicleId: LinxioId;
};

/** Parameters for `client.routes.getVehicleRoutes()`. */
export type LinxioVehicleRoutesParams = DateRangeParams &
    Omit<ListParams<RouteField>, "fields"> & {
        fields?: RouteField[];
    };
