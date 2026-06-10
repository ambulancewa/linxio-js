import type { LinxioClient, LinxioLoginResponse } from "../../../src";

export type LinxioSdkScratchContext = {
    linxio: LinxioClient;
    requestBody?: unknown;
    session: LinxioLoginResponse;
};

/**
 * Edit this function while `pnpm docs:dev` is running, then call
 * `/api/sdk-scratch` to execute it against the local SDK source.
 *
 * The default example is read-only and intentionally requests a small field set.
 */
export async function runLinxioSdkScratch({ linxio }: LinxioSdkScratchContext) {
    const { data: vehicles } = await linxio.vehicles.list({
        limit: 5,
        page: 1,
    });

    return { vehicles };
}
