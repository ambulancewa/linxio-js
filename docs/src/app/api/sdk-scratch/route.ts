import { NextResponse } from "next/server";
import { runLinxioSdkScratch } from "@/scratch/linxio-sdk-scratch";
import { createClient, LinxioError } from "../../../../../src";
import { isScratchEnabled, readScratchConfig } from "./scratch-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
    return executeScratch();
}

export async function POST(request: Request) {
    return executeScratch(await readOptionalJson(request));
}

async function executeScratch(requestBody?: unknown) {
    if (!isScratchEnabled()) {
        return NextResponse.json(
            {
                error: "SDK scratch route is disabled in production unless LINXIO_SDK_SCRATCH_ENABLED=true.",
                ok: false,
            },
            { status: 404 },
        );
    }

    const configResult = readScratchConfig();
    if (!configResult.ok) {
        return NextResponse.json(
            {
                error: "Missing Linxio SDK scratch environment variables.",
                missing: configResult.missing,
                ok: false,
            },
            { status: 503 },
        );
    }

    const { baseUrl, domain, email, password } = configResult.config;
    const linxio = createClient({
        baseUrl,
        retry: { delayMs: 250, retries: 1 },
        timeoutMs: 30_000,
    });

    const login = await linxio.auth.login({
        ...(domain ? { domain } : {}),
        email,
        password,
    });

    if (login.error) {
        return NextResponse.json(
            {
                error: "Linxio SDK scratch login failed.",
                details: serializeScratchError(login.error),
                ok: false,
            },
            { status: 502 },
        );
    }

    try {
        const result = await runLinxioSdkScratch({
            linxio,
            requestBody,
            session: login.data,
        });

        return NextResponse.json({ ok: true, result });
    } catch (error) {
        return NextResponse.json(
            {
                error: "Linxio SDK scratch execution failed.",
                details: serializeScratchError(error),
                ok: false,
            },
            { status: 500 },
        );
    }
}

async function readOptionalJson(request: Request): Promise<unknown> {
    const text = await request.text();

    if (!text.trim()) {
        return undefined;
    }

    return JSON.parse(text);
}

function serializeScratchError(error: unknown) {
    if (error instanceof LinxioError) {
        return {
            message: error.message,
            method: error.method,
            name: error.name,
            path: error.path,
            requestId: error.requestId,
        };
    }

    if (error instanceof Error) {
        return {
            message: error.message,
            name: error.name,
        };
    }

    return { message: "Unknown scratch error." };
}
