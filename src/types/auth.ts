import type { ISODateString, JsonObject, LinxioId } from "./common";

/** Linxio team type returned by login and current-user endpoints. */
export type LinxioTeamType = "admin" | "client" | "reseller" | (string & {});

/** Credentials for `client.auth.login()`. */
export type LinxioLoginRequest = {
    domain?: string;
    email: string;
    password: string;
};

/** Response returned by the documented `/login` endpoint. */
export type LinxioLoginResponse = {
    expireAt?: ISODateString;
    loginWithId?: boolean;
    otp_required?: boolean;
    refreshToken?: string;
    roleId?: LinxioId;
    teamType?: LinxioTeamType;
    token: string;
};

/** Response returned by `/token/refresh`. */
export type LinxioRefreshTokenResponse = {
    expireAt?: ISODateString;
    refreshToken?: string;
    token: string;
};

/** In-memory token state used by {@link import("../client").LinxioClient}. */
export type LinxioSession = {
    expireAt?: ISODateString;
    refreshToken?: string;
    token?: string;
};

/** Payload for OTP verification when Linxio requires a one-time password. */
export type LinxioOtpVerificationRequest = {
    code: string;
    email: string;
};

/** Current-user object returned by `/me`; fields vary by role and requested selectors. */
export type LinxioCurrentUser = JsonObject & {
    dateFormat?: string;
    email?: string;
    fullName?: string;
    id?: LinxioId;
    permissions?: string[];
    team?: JsonObject & {
        clientId?: LinxioId;
        id?: LinxioId;
        name?: string;
        resellerId?: LinxioId;
    };
    teamType?: LinxioTeamType;
};
