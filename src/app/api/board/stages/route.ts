import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/auth";
import { getCompanyIdFromUrl, jsonError, parseJsonBody } from "@/lib/api-helpers";
import { saveStages } from "@/lib/crm";
import { saveStagesSchema } from "@/lib/validation";

export async function PUT(request: Request) {
  try {
    const context = await requireApiContext({
      companyId: getCompanyIdFromUrl(request),
      requireAdmin: true,
      requireCompany: true,
    });
    const payload = saveStagesSchema.parse(await parseJsonBody(request));
    const stages = await saveStages(context.company!.id, payload.drafts);

    return NextResponse.json({
      ok: true,
      stages,
    });
  } catch (error) {
    return jsonError(error, "Não foi possível salvar as etapas.");
  }
}
