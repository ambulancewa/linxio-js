import type { LinxioResult } from "../result";
import type {
    LinxioCountry,
    LinxioCurrentPlan,
    LinxioDigitalFormSettings,
    LinxioEcoSpeedSettings,
    LinxioExcessiveIdlingSettings,
    LinxioLanguage,
    LinxioMapApiOption,
    LinxioPlan,
    LinxioPlatformDomain,
    LinxioProviderSetting,
    LinxioRole,
    LinxioTheme,
    LinxioTimezone,
} from "../types/metadata";
import { BaseService } from "./base.service";

/** Read-only dashboard reference data and tenant settings. */
export class MetadataService extends BaseService {
    /** List country options used by Linxio address and tenant forms. */
    countries(): Promise<LinxioResult<LinxioCountry[]>> {
        return this.result(() => this.http.get("/country/list"));
    }

    /** List user roles available to the authenticated Linxio account. */
    roles(): Promise<LinxioResult<LinxioRole[]>> {
        return this.result(() => this.http.get("/roles"));
    }

    /** List plan definitions visible to the authenticated Linxio account. */
    plans(): Promise<LinxioResult<LinxioPlan[]>> {
        return this.result(() => this.http.get("/plans"));
    }

    /** List timezone options used by Linxio tenant and user settings. */
    timezones(): Promise<LinxioResult<LinxioTimezone[]>> {
        return this.result(() => this.http.get("/timezones"));
    }

    /** List dashboard theme definitions. */
    themes(): Promise<LinxioResult<LinxioTheme[]>> {
        return this.result(() => this.http.get("/themes"));
    }

    /** Fetch the current user's active dashboard theme. */
    myTheme(): Promise<LinxioResult<LinxioTheme>> {
        return this.result(() => this.http.get("/themes/my"));
    }

    /** Fetch current-plan permission and feature information. */
    currentPlan(): Promise<LinxioResult<LinxioCurrentPlan>> {
        return this.result(() => this.http.get("/permissions/current-plan"));
    }

    /** Fetch the hosted-domain settings for the current platform. */
    platformDomain(): Promise<LinxioResult<LinxioPlatformDomain>> {
        return this.result(() => this.http.get("/platform-settings/domain"));
    }

    /** List language options used by Linxio settings screens. */
    languages(): Promise<LinxioResult<LinxioLanguage[]>> {
        return this.result(() => this.http.get("/settings/language/list"));
    }

    /** List map API provider options available to the current tenant. */
    mapApiOptions(): Promise<LinxioResult<LinxioMapApiOption[]>> {
        return this.result(() => this.http.get("/settings/mapApiOptions"));
    }

    /** Fetch dashboard provider settings visible to the current account. */
    providers(): Promise<LinxioResult<LinxioProviderSetting[]>> {
        return this.result(() => this.http.get("/settings/provider"));
    }

    /** Fetch tenant-level digital-form settings. */
    digitalFormSettings(): Promise<LinxioResult<LinxioDigitalFormSettings>> {
        return this.result(() => this.http.get("/settings/digitalForm"));
    }

    /** Fetch tenant-level eco-speed settings. */
    ecoSpeedSettings(): Promise<LinxioResult<LinxioEcoSpeedSettings>> {
        return this.result(() => this.http.get("/settings/ecoSpeed"));
    }

    /** Fetch tenant-level excessive-idling settings. */
    excessiveIdlingSettings(): Promise<
        LinxioResult<LinxioExcessiveIdlingSettings>
    > {
        return this.result(() => this.http.get("/settings/excessiveIdling"));
    }
}
