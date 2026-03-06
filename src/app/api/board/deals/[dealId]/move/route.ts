import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/auth";
import { getCompanyIdFromUrl, jsonError, parseJsonBody } from "@/lib/api-helpers";
import { moveDeal } from "@/lib/crm";
import { moveDealSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{
    dealId: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const context = await requireApiContext({
      companyId: getCompanyIdFromUrl(request),
      requireCompany: true,
    });
    const routeParams = await params;
    const payload = moveDealSchema.parse({
      ...(await parseJsonBody<Record<string, unknown>>(request)),
      dealId: routeParams.dealId,
    });
    const moved = await moveDeal(context.company!.id, payload.dealId, payload.stageId);

    return NextResponse.json({
      ok: true,
      moved,
    });
  } catch (error) {
    return jsonError(error, "Nao foi possivel mover o card.");
  }
}
