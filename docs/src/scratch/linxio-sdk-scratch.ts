import type {
  LinxioClient,
  LinxioLoginResponse,
  LinxioVehicle,
} from "../../../src";

export type LinxioSdkScratchContext = {
  linxio: LinxioClient;
  requestBody?: unknown;
  session: LinxioLoginResponse;
};

export type LinxioSdkScratchResult = {
  vehicles: Awaited<ReturnType<LinxioClient["vehicles"]["list"]>>;
};

/**
 * Edit this function while `pnpm docs:dev` is running, then call
 * `/api/sdk-scratch` to execute it against the local SDK source.
 *
 * The default example is read-only and intentionally requests a small field set.
 */
export async function runLinxioSdkScratch({
  linxio,
}: LinxioSdkScratchContext): Promise<LinxioSdkScratchResult> {
  const vehicles = await linxio.vehicles.list({
    fields: [
      "id",
      "regNo",
      "defaultLabel",
      "status",
      "lastLoggedAt",
    ] satisfies (keyof LinxioVehicle | string)[],
    limit: 5,
    page: 1,
  });

  return { vehicles };
}
