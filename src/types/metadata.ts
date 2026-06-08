import type { LinxioId, LinxioRecord } from "./common";

/**
 * Shared shape for dashboard reference-data records whose complete schema is
 * tenant-configurable or not fully visible in the captured dashboard bundles.
 */
export type LinxioMetadataRecord = LinxioRecord & {
    /** Stable identifier when the endpoint returns one. */
    id?: LinxioId;
    /** Machine-readable code, slug, or setting key. */
    code?: string;
    /** Human-readable label. */
    label?: string;
    /** Human-readable name. */
    name?: string;
    /** Sort order used by dashboard dropdowns. */
    order?: number;
    /** Machine-readable value used by dashboard dropdowns. */
    value?: string;
};

/** Country option returned by the dashboard country reference endpoint. */
export type LinxioCountry = LinxioMetadataRecord & {
    /** ISO-style country code when supplied by Linxio. */
    code?: string;
    /** Country display name. */
    name?: string;
};

/** Role option returned by the dashboard roles endpoint. */
export type LinxioRole = LinxioMetadataRecord & {
    /** Role display name. */
    name?: string;
    /** Role scope or team type when supplied. */
    type?: string;
};

/** Plan option returned by the dashboard plans endpoint. */
export type LinxioPlan = LinxioMetadataRecord & {
    /** Plan display name. */
    name?: string;
};

/** Timezone option returned by the dashboard timezones endpoint. */
export type LinxioTimezone = LinxioMetadataRecord & {
    /** IANA timezone name or Linxio timezone value. */
    name?: string;
    /** UTC offset label when supplied. */
    offset?: string;
};

/** Theme definition returned by the dashboard theme endpoints. */
export type LinxioTheme = LinxioMetadataRecord & {
    /** Theme display name. */
    name?: string;
};

/** Current-plan permission summary returned by Linxio. */
export type LinxioCurrentPlan = LinxioRecord & {
    /** Enabled feature keys when Linxio returns a feature list. */
    features?: string[];
    /** Plan identifier when supplied by Linxio. */
    planId?: LinxioId;
    /** Permission flags keyed by feature or module name. */
    permissions?: LinxioRecord;
};

/** Platform domain settings used by hosted Linxio tenants. */
export type LinxioPlatformDomain = LinxioRecord & {
    /** Tenant domain when supplied. */
    domain?: string;
    /** Hostname when supplied. */
    host?: string;
};

/** Language option returned by the dashboard language settings endpoint. */
export type LinxioLanguage = LinxioMetadataRecord & {
    /** Locale or language code. */
    code?: string;
    /** Language display name. */
    name?: string;
};

/** Map API provider option returned by Linxio settings. */
export type LinxioMapApiOption = LinxioMetadataRecord;

/** Provider setting returned by the dashboard provider endpoint. */
export type LinxioProviderSetting = LinxioMetadataRecord;

/** Digital-form feature settings returned by Linxio. */
export type LinxioDigitalFormSettings = LinxioRecord;

/** Eco-speed feature settings returned by Linxio. */
export type LinxioEcoSpeedSettings = LinxioRecord;

/** Excessive-idling feature settings returned by Linxio. */
export type LinxioExcessiveIdlingSettings = LinxioRecord;
