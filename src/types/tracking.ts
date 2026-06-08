import type { ISODateString, LatLng, LinxioId, LinxioRecord } from "./common";

/** Linxio realtime Socket.IO namespace. */
export type LinxioRealtimeNamespace = "coordinates" | "notifications";

/** Live vehicle position payload received from the coordinates socket. */
export type LinxioTrackingPosition = LinxioRecord &
    LatLng & {
        address?: string | null;
        deviceId?: LinxioId;
        driverId?: LinxioId | null;
        heading?: number | null;
        speed?: number | null;
        ts?: ISODateString;
        vehicleId: LinxioId;
    };

/** Notification payload received from the notifications socket. */
export type LinxioNotification = LinxioRecord & {
    id?: LinxioId;
    message?: string;
    occurredAt?: ISODateString;
    readAt?: ISODateString | null;
    type?: string;
    vehicleId?: LinxioId | null;
};

/** Acknowledgement returned by Linxio's realtime `subscribe` event. */
export type LinxioRealtimeSubscribeAck = {
    error?: string;
    success?: boolean;
    [key: string]: unknown;
};

/** Subscription handle for code that prefers object cleanup. */
export type LinxioRealtimeSubscription = {
    unsubscribe: () => void;
};
