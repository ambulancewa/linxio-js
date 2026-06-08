export type LinxioEndpointSource = "dashboard" | "public-docs";

export type LinxioEndpointDefinition = {
    method: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
    path: string;
    source: LinxioEndpointSource;
};

export const linxioEndpoints = {
    auth: {
        login: { method: "POST", path: "/login", source: "public-docs" },
        logout: { method: "POST", path: "/logout", source: "dashboard" },
        me: { method: "GET", path: "/me", source: "dashboard" },
        refreshToken: {
            method: "POST",
            path: "/token/refresh",
            source: "dashboard",
        },
        verifyOtp: { method: "POST", path: "/login/otp", source: "dashboard" },
    },
    cameras: {
        eventTypes: {
            method: "GET",
            path: "/devices/cameras/events/types",
            source: "dashboard",
        },
        events: {
            method: "GET",
            path: "/devices/cameras/events",
            source: "dashboard",
        },
    },
    clients: {
        get: {
            method: "GET",
            path: "/clients/{clientId}",
            source: "dashboard",
        },
        list: { method: "GET", path: "/clients/json", source: "dashboard" },
        users: {
            create: {
                method: "POST",
                path: "/clients/{clientId}/users",
                source: "public-docs",
            },
            get: {
                method: "GET",
                path: "/clients/{clientId}/users/{userId}",
                source: "public-docs",
            },
            list: {
                method: "GET",
                path: "/clients/{clientId}/users",
                source: "public-docs",
            },
            update: {
                method: "POST",
                path: "/clients/{clientId}/users/{userId}",
                source: "public-docs",
            },
        },
    },
    devices: {
        archive: {
            method: "PATCH",
            path: "/devices/{deviceId}/archive",
            source: "dashboard",
        },
        coordinates: {
            method: "GET",
            path: "/devices/{deviceId}/coordinates",
            source: "dashboard",
        },
        create: { method: "POST", path: "/devices", source: "public-docs" },
        get: {
            method: "GET",
            path: "/devices/{deviceId}",
            source: "public-docs",
        },
        install: {
            method: "POST",
            path: "/devices/{deviceId}/install",
            source: "public-docs",
        },
        list: { method: "GET", path: "/devices/json", source: "public-docs" },
        history: {
            method: "GET",
            path: "/devices/{deviceId}/history",
            source: "dashboard",
        },
        sensors: {
            list: {
                method: "GET",
                path: "/devices/{deviceId}/sensors",
                source: "dashboard",
            },
        },
        uninstall: {
            method: "POST",
            path: "/devices/{deviceId}/uninstall",
            source: "public-docs",
        },
        update: {
            method: "PATCH",
            path: "/devices/{deviceId}",
            source: "public-docs",
        },
    },
    drivers: {
        assignToVehicle: {
            method: "POST",
            path: "/vehicle/{vehicleId}/set-driver/{driverId}",
            source: "public-docs",
        },
        list: {
            method: "GET",
            path: "/clients/{clientId}/users?role=driver",
            source: "public-docs",
        },
        unassignFromVehicle: {
            method: "POST",
            path: "/vehicle/{vehicleId}/unset-driver/{driverId}",
            source: "public-docs",
        },
    },
    fuel: {
        assignTransaction: {
            method: "PATCH",
            path: "/fuel-cards/record/{recordId}",
            source: "dashboard",
        },
        cards: { method: "GET", path: "/fuel-cards/json", source: "dashboard" },
        records: {
            method: "GET",
            path: "/fuel-cards/json",
            source: "dashboard",
        },
        recordsByVehicle: {
            method: "GET",
            path: "/fuel-cards-by-vehicle/json",
            source: "dashboard",
        },
        summary: {
            method: "GET",
            path: "/fuel-summary-report",
            source: "dashboard",
        },
    },
    geofences: {
        archive: {
            method: "PATCH",
            path: "/areas/{areaId}/archive",
            source: "dashboard",
        },
        create: { method: "POST", path: "/areas", source: "public-docs" },
        delete: {
            method: "DELETE",
            path: "/areas/{areaId}",
            source: "public-docs",
        },
        get: { method: "GET", path: "/areas/{areaId}", source: "dashboard" },
        list: { method: "GET", path: "/areas", source: "public-docs" },
        restore: {
            method: "PATCH",
            path: "/areas/{areaId}/restore",
            source: "dashboard",
        },
    },
    realtime: {
        coordinates: {
            method: "GET",
            path: "https://track.linxio.com/coordinates",
            source: "public-docs",
        },
        notifications: {
            method: "GET",
            path: "https://track.linxio.com/notifications",
            source: "public-docs",
        },
    },
    reports: {
        digitalFormAnswer: {
            method: "GET",
            path: "/digital-form/answer/{answerId}",
            source: "dashboard",
        },
        digitalFormAnswerPdf: {
            method: "GET",
            path: "/digital-form/answer/{answerId}/pdf",
            source: "dashboard",
        },
        scheduledReport: {
            method: "GET",
            path: "/scheduled-report",
            source: "dashboard",
        },
    },
    sensors: {
        tempHumidityDeviceReport: {
            method: "GET",
            path: "/devices/sensors/report/temp-and-humidity",
            source: "public-docs",
        },
        tempHumidityVehicleReport: {
            method: "GET",
            path: "/vehicles/report/sensors/temp-and-humidity",
            source: "public-docs",
        },
    },
    vehicles: {
        archive: {
            method: "PATCH",
            path: "/vehicles/{vehicleId}/archive",
            source: "dashboard",
        },
        create: { method: "POST", path: "/vehicles", source: "public-docs" },
        engineHours: {
            method: "GET",
            path: "/vehicles/{vehicleId}/engine-hours",
            source: "dashboard",
        },
        get: {
            method: "GET",
            path: "/vehicles/{vehicleId}",
            source: "public-docs",
        },
        list: {
            method: "GET",
            path: "/vehicles/fields/json",
            source: "public-docs",
        },
        odometer: {
            method: "GET",
            path: "/vehicles/{vehicleId}/odometer",
            source: "public-docs",
        },
        recalibrateOdometer: {
            method: "POST",
            path: "/vehicles/{vehicleId}/odometer",
            source: "public-docs",
        },
        restore: {
            method: "PATCH",
            path: "/vehicles/{vehicleId}/restore",
            source: "dashboard",
        },
        routes: {
            method: "GET",
            path: "/vehicles/{vehicleId}/routes",
            source: "public-docs",
        },
        update: {
            method: "POST",
            path: "/vehicles/{vehicleId}",
            source: "public-docs",
        },
    },
} as const satisfies Record<string, unknown>;
