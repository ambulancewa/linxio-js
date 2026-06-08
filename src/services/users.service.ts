import { collectPages, streamPages } from "../pagination";
import type { LinxioPageResult, LinxioResult } from "../result";
import type { LinxioId } from "../types/common";
import type {
    LinxioUser,
    LinxioUserListParams,
    LinxioUserPayload,
} from "../types/users";
import { BaseService } from "./base.service";

/** User management endpoints. */
export class UsersService extends BaseService {
    /** List users from the dashboard-derived endpoint. */
    list(
        params: LinxioUserListParams = {},
    ): Promise<LinxioPageResult<LinxioUser>> {
        return this.getPage("/users", params);
    }

    /** Load every user page into a single result. */
    iterate(
        params: LinxioUserListParams = {},
    ): Promise<LinxioResult<LinxioUser[]>> {
        return collectPages((pageParams) => this.list(pageParams), params);
    }

    /** Stream every user page without loading every user at once. */
    stream(
        params: LinxioUserListParams = {},
    ): AsyncGenerator<LinxioUser, void, undefined> {
        return streamPages((pageParams) => this.list(pageParams), params);
    }

    /** Fetch one user by ID. */
    get(userId: LinxioId): Promise<LinxioResult<LinxioUser>> {
        return this.result(() => this.http.get(`/users/${userId}`));
    }

    /** Create a user. */
    create(payload: LinxioUserPayload): Promise<LinxioResult<LinxioUser>> {
        return this.result(() => this.http.post("/users", payload));
    }

    /** Update a user. */
    update(
        userId: LinxioId,
        payload: LinxioUserPayload,
    ): Promise<LinxioResult<LinxioUser>> {
        return this.result(() => this.http.patch(`/users/${userId}`, payload));
    }

    /** Soft-archive a user. */
    archive(userId: LinxioId): Promise<LinxioResult<void>> {
        return this.result(() =>
            this.http.patch(`/users/${userId}/archive`, {}),
        );
    }

    /** Restore a previously archived user. */
    restore(userId: LinxioId): Promise<LinxioResult<void>> {
        return this.result(() =>
            this.http.patch(`/users/${userId}/restore`, {}),
        );
    }
}
