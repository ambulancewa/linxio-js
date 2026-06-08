import { io, type Socket } from "socket.io-client";
import { LinxioRealtimeError } from "./errors";
import type { LinxioId } from "./types/common";
import type {
    LinxioNotification,
    LinxioRealtimeNamespace,
    LinxioRealtimeSubscribeAck,
    LinxioTrackingPosition,
} from "./types/tracking";

/** Configuration for Linxio Socket.IO connections. */
export type RealtimeClientOptions = {
    /** Realtime host. Defaults to `https://track.linxio.com`. */
    baseUrl?: string;
    /** Token provider used when `connect()` is called without an explicit token. */
    getToken?: () => string | undefined;
    /** Socket.IO path. Linxio uses `/socket.io`. */
    path?: string;
    /** Maximum reconnection attempts before Socket.IO gives up. */
    reconnectionAttempts?: number;
};

/** Handler called when a realtime payload is received. */
export type RealtimeEventHandler<TPayload> = (payload: TPayload) => void;

/** Function returned by realtime listeners to detach the handler. */
export type RealtimeUnsubscribe = () => void;

const DEFAULT_REALTIME_BASE_URL = "https://track.linxio.com";

/**
 * Socket.IO client for Linxio live tracking and notifications.
 *
 * Linxio documents two namespaces: `coordinates` for live vehicle positions and
 * `notifications` for configured notification messages.
 */
export class RealtimeClient {
    private readonly baseUrl: string;
    private readonly getToken: () => string | undefined;
    private readonly path: string;
    private readonly reconnectionAttempts: number;
    private readonly sockets = new Map<LinxioRealtimeNamespace, Socket>();

    constructor(options: RealtimeClientOptions = {}) {
        this.baseUrl = (options.baseUrl ?? DEFAULT_REALTIME_BASE_URL).replace(
            /\/+$/,
            "",
        );
        this.getToken = options.getToken ?? (() => undefined);
        this.path = options.path ?? "/socket.io";
        this.reconnectionAttempts = options.reconnectionAttempts ?? 10;
    }

    /** Connect to a Linxio realtime namespace and reuse existing sockets. */
    connect(
        namespace: LinxioRealtimeNamespace,
        token = this.getToken(),
    ): Socket {
        const existing = this.sockets.get(namespace);
        if (existing) {
            return existing;
        }

        if (!token) {
            throw new LinxioRealtimeError(
                "A Linxio token is required before connecting to realtime sockets.",
            );
        }

        const socket = io(`${this.baseUrl}/${namespace}`, {
            path: this.path,
            query: { token },
            reconnection: true,
            reconnectionAttempts: this.reconnectionAttempts,
            reconnectionDelay: 5_000,
            reconnectionDelayMax: 10_000,
            timeout: 20_000,
            transports: ["websocket"],
        });

        socket.on("error", (error) => {
            if (error === "AUTH_FAILED") {
                socket.disconnect();
            }
        });

        this.sockets.set(namespace, socket);
        return socket;
    }

    /** Subscribe the current realtime socket to a set of vehicle IDs. */
    subscribe(
        vehicleIds: readonly LinxioId[],
        namespace: LinxioRealtimeNamespace = "coordinates",
    ): Promise<LinxioRealtimeSubscribeAck> {
        const socket = this.connect(namespace);
        return new Promise((resolve) => {
            socket.emit(
                "subscribe",
                { vehicleIds: vehicleIds.map(Number) },
                (ack: LinxioRealtimeSubscribeAck) => resolve(ack),
            );
        });
    }

    /**
     * Subscribe to live vehicle coordinates.
     *
     * The returned function removes event handlers. It does not disconnect the
     * socket, allowing other subscriptions to keep running.
     */
    onPosition(
        vehicleIds: readonly LinxioId[],
        handler: RealtimeEventHandler<LinxioTrackingPosition>,
    ): RealtimeUnsubscribe {
        const socket = this.connect("coordinates");
        const subscribe = () => {
            socket.emit("subscribe", { vehicleIds: vehicleIds.map(Number) });
        };

        socket.on("connect", subscribe);
        socket.on("reconnect", subscribe);
        socket.on("coordinates", handler);

        if (socket.connected) {
            subscribe();
        }

        return () => {
            socket.off("connect", subscribe);
            socket.off("reconnect", subscribe);
            socket.off("coordinates", handler);
        };
    }

    /** Listen for Linxio notification messages. */
    onNotification(
        handler: RealtimeEventHandler<LinxioNotification>,
    ): RealtimeUnsubscribe {
        const socket = this.connect("notifications");
        socket.on("notification", handler);
        socket.on("notifications", handler);

        return () => {
            socket.off("notification", handler);
            socket.off("notifications", handler);
        };
    }

    /** Listen for a custom notification event type emitted by Linxio. */
    onNotificationType<TPayload = LinxioNotification>(
        type: string,
        handler: RealtimeEventHandler<TPayload>,
    ): RealtimeUnsubscribe {
        const socket = this.connect("notifications");
        socket.on(type, handler);
        return () => socket.off(type, handler);
    }

    /** Disconnect one namespace or every active realtime socket. */
    disconnect(namespace?: LinxioRealtimeNamespace): void {
        if (namespace) {
            this.sockets.get(namespace)?.disconnect();
            this.sockets.delete(namespace);
            return;
        }

        for (const socket of this.sockets.values()) {
            socket.disconnect();
        }
        this.sockets.clear();
    }
}
