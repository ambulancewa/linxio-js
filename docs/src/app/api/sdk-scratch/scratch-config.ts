type ScratchEnvironment = Record<string, string | undefined>;

export type ScratchConfig = {
  baseUrl?: string;
  domain?: string;
  email: string;
  password: string;
};

type ScratchConfigResult =
  | {
      config: ScratchConfig;
      ok: true;
    }
  | {
      missing: string[];
      ok: false;
    };

const REQUIRED_ENV = [
  "LINXIO_SDK_SCRATCH_EMAIL",
  "LINXIO_SDK_SCRATCH_PASSWORD",
] as const;

export function isScratchEnabled(
  env: ScratchEnvironment = process.env,
  nodeEnv = process.env.NODE_ENV,
): boolean {
  return nodeEnv !== "production" || env.LINXIO_SDK_SCRATCH_ENABLED === "true";
}

export function readScratchConfig(
  env: ScratchEnvironment = process.env,
): ScratchConfigResult {
  const missing = REQUIRED_ENV.filter((key) => !env[key]?.trim());

  if (missing.length) {
    return { missing, ok: false };
  }

  return {
    config: {
      baseUrl: optionalEnv(env.LINXIO_SDK_SCRATCH_BASE_URL),
      domain: optionalEnv(env.LINXIO_SDK_SCRATCH_DOMAIN),
      email: env.LINXIO_SDK_SCRATCH_EMAIL as string,
      password: env.LINXIO_SDK_SCRATCH_PASSWORD as string,
    },
    ok: true,
  };
}

function optionalEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}
