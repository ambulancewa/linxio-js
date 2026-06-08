import type { LinxioId, LinxioRecord, ListParams } from "./common";

/** Common field names for user list responses. */
export type UserField =
    | "id"
    | "email"
    | "fullName"
    | "role"
    | "status"
    | (string & {});

/** User record returned by Linxio user endpoints. */
export type LinxioUser = LinxioRecord & {
    email?: string | null;
    fullName?: string | null;
    id: LinxioId;
    role?: string | null;
    status?: string | null;
};

/** Payload for creating or updating a user. */
export type LinxioUserPayload = LinxioRecord & {
    email?: string;
    firstName?: string;
    fullName?: string;
    lastName?: string;
    phone?: string;
    roleId?: LinxioId;
};

/** Parameters for `client.users.list()`. */
export type LinxioUserListParams = ListParams<UserField> & {
    role?: string;
};
