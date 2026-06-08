import { collectPages, streamPages } from "../pagination";
import type { LinxioPageResult, LinxioResult } from "../result";
import type {
    LinxioClientAccount,
    LinxioClientUserListParams,
    LinxioReseller,
} from "../types/clients";
import type { LinxioId } from "../types/common";
import type { LinxioUser, LinxioUserPayload } from "../types/users";
import { BaseService } from "./base.service";

/** Client account and client-user endpoints. */
export class ClientsService extends BaseService {
    /** List client accounts from the dashboard-derived endpoint. */
    list(
        params: LinxioClientUserListParams = {},
    ): Promise<LinxioPageResult<LinxioClientAccount>> {
        return this.getPage("/clients/json", params);
    }

    /** Fetch one client account by ID. */
    get(clientId: LinxioId): Promise<LinxioResult<LinxioClientAccount>> {
        return this.result(() => this.http.get(`/clients/${clientId}`));
    }

    /** List users for a client account. */
    listUsers(
        clientId: LinxioId,
        params: LinxioClientUserListParams = {},
    ): Promise<LinxioPageResult<LinxioUser>> {
        return this.getPage(`/clients/${clientId}/users`, params);
    }

    /** Load every user page for a client account into a single result. */
    iterateUsers(
        clientId: LinxioId,
        params: LinxioClientUserListParams = {},
    ): Promise<LinxioResult<LinxioUser[]>> {
        return collectPages(
            (pageParams) => this.listUsers(clientId, pageParams),
            params,
        );
    }

    /** Stream users for a client account without loading every user at once. */
    streamUsers(
        clientId: LinxioId,
        params: LinxioClientUserListParams = {},
    ): AsyncGenerator<LinxioUser, void, undefined> {
        return streamPages(
            (pageParams) => this.listUsers(clientId, pageParams),
            params,
        );
    }

    /** Create a user within a client account. */
    createUser(
        clientId: LinxioId,
        payload: LinxioUserPayload,
    ): Promise<LinxioResult<LinxioUser>> {
        return this.result(() =>
            this.http.post(`/clients/${clientId}/users`, payload),
        );
    }

    /** Update a user within a client account. */
    updateUser(
        clientId: LinxioId,
        userId: LinxioId,
        payload: LinxioUserPayload,
    ): Promise<LinxioResult<LinxioUser>> {
        return this.result(() =>
            this.http.post(`/clients/${clientId}/users/${userId}`, payload),
        );
    }

    /** Fetch one user within a client account. */
    getUser(
        clientId: LinxioId,
        userId: LinxioId,
    ): Promise<LinxioResult<LinxioUser>> {
        return this.result(() =>
            this.http.get(`/clients/${clientId}/users/${userId}`),
        );
    }
}

/** Reseller endpoints discovered from the dashboard bundle. */
export class ResellersService extends BaseService {
    /** List reseller accounts. */
    list(): Promise<LinxioResult<LinxioReseller[]>> {
        return this.result(() => this.http.get("/reseller"));
    }

    /** Fetch one reseller account by ID. */
    get(resellerId: LinxioId): Promise<LinxioResult<LinxioReseller>> {
        return this.result(() => this.http.get(`/reseller/${resellerId}`));
    }
}
