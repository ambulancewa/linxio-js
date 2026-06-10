import type { LinxioId, LinxioRecord, ListParams } from "./common";

/** Common field names for user list responses. */
export type UserField =
    | "id"
    | "email"
    | "fullName"
    | "name"
    | "surname"
    | "role"
    | "status"
    | (string & {});

/** User record returned by Linxio user endpoints. */
export type LinxioUser = LinxioRecord & {
    email?: string | null;
    fullName?: string | null;
    id: LinxioId;
    name?: string | null;
    role?: string | null;
    status?: string | null;
    surname?: string | null;
};

/** Payload for creating or updating a user. */
export type LinxioUserPayload = LinxioRecord & {
    email?: string;
    firstName?: string;
    fullName?: string;
    lastName?: string;
    name?: string;
    phone?: string;
    roleId?: LinxioId;
    surname?: string;
};

/** Parameters for `client.users.list()`. */
export type LinxioUserListParams = ListParams<UserField> & {
    role?: string;
};
