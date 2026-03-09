import { NextResponse } from "next/server";
import { AppHttpError } from "@/lib/auth";
import { getErrorMessage } from "@/lib/utils";

export function getCompanyIdFromUrl(request: Request) {
  return new URL(request.url).searchParams.get("companyId");
}

export async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new AppHttpError(400, "Payload inválido.");
  }
}

export function jsonError(error: unknown, fallback: string) {
  if (error instanceof AppHttpError) {
    return NextResponse.json(
      {
        ok: false,
        message: error.message,
      },
      { status: error.status },
    );
  }

  return NextResponse.json(
    {
      ok: false,
      message: getErrorMessage(error, fallback),
    },
    { status: 500 },
  );
}
