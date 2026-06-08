import type { LinxioId, LinxioRecord, ListParams } from "./common";

/** Client account record. */
export type LinxioClientAccount = LinxioRecord & {
    id: LinxioId;
    name?: string | null;
    timezone?: LinxioId | null;
};

/** Parameters for client user list endpoints. */
export type LinxioClientUserListParams = ListParams & {
    role?: string;
};

/** Reseller account record. */
export type LinxioReseller = LinxioRecord & {
    id: LinxioId;
    name?: string | null;
};
