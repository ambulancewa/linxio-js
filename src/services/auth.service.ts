import type { HttpClient } from "../http";
import type { LinxioResult } from "../result";
import type {
    LinxioCurrentUser,
    LinxioLoginRequest,
    LinxioLoginResponse,
    LinxioOtpVerificationRequest,
    LinxioSession,
} from "../types/auth";
import type { FieldSelector } from "../types/common";
import { BaseService } from "./base.service";

/** Authentication and session-related Linxio endpoints. */
export class AuthService extends BaseService {
    constructor(
        http: HttpClient,
        private readonly setSession: (session: LinxioSession) => void,
    ) {
        super(http);
    }

    /**
     * Log in with Linxio credentials.
     *
     * The returned JWT and refresh token are stored in the parent client so
     * subsequent requests are authenticated automatically.
     */
    async login(
        request: LinxioLoginRequest,
    ): Promise<LinxioResult<LinxioLoginResponse>> {
        const result = await this.result(() =>
            this.http.post<LinxioLoginResponse>("/login", request, {
                skipAuth: true,
                skipAuthRefresh: true,
            }),
        );

        if (!result.error) {
            this.applySession(result.data);
        }

        return result;
    }

    /** Verify a one-time password when Linxio requires OTP for the account. */
    async verifyOtp(
        request: LinxioOtpVerificationRequest,
    ): Promise<LinxioResult<LinxioLoginResponse>> {
        const result = await this.result(() =>
            this.http.post<LinxioLoginResponse>("/login/otp", request, {
                skipAuth: true,
                skipAuthRefresh: true,
            }),
        );

        if (!result.error) {
            this.applySession(result.data);
        }

        return result;
    }

    /** Refresh a JWT manually and update the client session. */
    async refresh(refreshToken: string): Promise<LinxioResult<LinxioSession>> {
        const result = await this.result(() =>
            this.http.post<LinxioLoginResponse>(
                "/token/refresh",
                { refreshToken },
                { skipAuthRefresh: true },
            ),
        );

        if (result.error) {
            return result;
        }

        const session = {
            expireAt: result.data.expireAt,
            refreshToken: result.data.refreshToken ?? refreshToken,
            token: result.data.token,
        };
        this.setSession(session);
        return { data: session, error: null };
    }

    /** Fetch the current authenticated Linxio user. */
    me(
        fields?: FieldSelector<string>,
    ): Promise<LinxioResult<LinxioCurrentUser>> {
        return this.result(() =>
            this.http.get("/me", {
                params: fields?.length
                    ? { "fields[]": [...fields] }
                    : undefined,
            }),
        );
    }

    /** Log out the current Linxio session server-side. */
    logout(): Promise<LinxioResult<void>> {
        return this.result(() => this.http.post("/logout", {}));
    }

    private applySession(response: LinxioLoginResponse): void {
        this.setSession({
            expireAt: response.expireAt,
            refreshToken: response.refreshToken,
            token: response.token,
        });
    }
}
