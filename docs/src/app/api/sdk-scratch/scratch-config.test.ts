import { describe, expect, it } from "vitest";
import { isScratchEnabled, readScratchConfig } from "./scratch-config";

describe("SDK scratch route configuration", () => {
  it("is enabled in development without an explicit flag", () => {
    expect(isScratchEnabled({}, "development")).toBe(true);
  });

  it("requires an explicit flag in production", () => {
    expect(isScratchEnabled({}, "production")).toBe(false);
    expect(
      isScratchEnabled({ LINXIO_SDK_SCRATCH_ENABLED: "true" }, "production"),
    ).toBe(true);
  });

  it("reports missing credentials without echoing secret values", () => {
    expect(
      readScratchConfig({ LINXIO_SDK_SCRATCH_EMAIL: "user@example.com" }),
    ).toEqual({
      ok: false,
      missing: ["LINXIO_SDK_SCRATCH_PASSWORD"],
    });
  });

  it("reads the optional domain and base URL", () => {
    expect(
      readScratchConfig({
        LINXIO_SDK_SCRATCH_BASE_URL: "https://api.example.test/api",
        LINXIO_SDK_SCRATCH_DOMAIN: "ambulancewa",
        LINXIO_SDK_SCRATCH_EMAIL: "user@example.com",
        LINXIO_SDK_SCRATCH_PASSWORD: "secret",
      }),
    ).toEqual({
      config: {
        baseUrl: "https://api.example.test/api",
        domain: "ambulancewa",
        email: "user@example.com",
        password: "secret",
      },
      ok: true,
    });
  });
});
