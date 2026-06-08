import type { LinxioId, LinxioRecord, ListParams } from "./common";

/** Common field names for driver list responses. */
export type DriverField =
    | "id"
    | "fullName"
    | "email"
    | "phone"
    | "role"
    | (string & {});

/** Driver user record. */
export type LinxioDriver = LinxioRecord & {
    email?: string | null;
    fullName?: string | null;
    id: LinxioId;
    phone?: string | null;
};

/** Parameters for `client.drivers.list()`. */
export type LinxioDriverListParams = ListParams<DriverField> & {
    clientId?: LinxioId;
};
