import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/auth";
import { getCompanyIdFromUrl, jsonError, parseJsonBody } from "@/lib/api-helpers";
import { assignDeal } from "@/lib/crm";
import { assignDealSchema } from "@/lib/validation";

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
    const payload = assignDealSchema.parse({
      ...(await parseJsonBody<Record<string, unknown>>(request)),
      dealId: routeParams.dealId,
    });
    const assignedUser = await assignDeal(
      context.company!.id,
      payload.dealId,
      payload.assignedUserId,
    );

    return NextResponse.json({
      ok: true,
      assignedUser,
    });
  } catch (error) {
    return jsonError(error, "Nao foi possivel atualizar a assinatura do card.");
  }
}
