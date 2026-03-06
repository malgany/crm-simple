import { NextResponse } from "next/server";
import { getSiteLeadIntegrationEnv } from "@/lib/env";
import {
  ingestSiteLead,
  siteLeadIngestSchema,
} from "@/lib/site-lead-integration";
import { getErrorMessage } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let integrationEnv: ReturnType<typeof getSiteLeadIntegrationEnv>;

  try {
    integrationEnv = getSiteLeadIntegrationEnv();
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: getErrorMessage(error, "Integracao indisponivel."),
      },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${integrationEnv.token}`) {
    return NextResponse.json(
      {
        ok: false,
        message: "Token invalido.",
      },
      { status: 401 },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Payload invalido.",
      },
      { status: 400 },
    );
  }

  const parsed = siteLeadIngestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Revise os dados enviados.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const result = await ingestSiteLead(parsed.data);

    return NextResponse.json({
      ok: true,
      action: result.action,
      message: result.message,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: getErrorMessage(error, "Nao foi possivel processar o lead."),
      },
      { status: 500 },
    );
  }
}
