import { NextResponse } from "next/server";
import { AppHttpError, requireApiContext } from "@/lib/auth";
import { jsonError } from "@/lib/api-helpers";
import { permanentlyDeleteCompanyUser } from "@/lib/crm";

type RouteContext = {
  params: Promise<{
    companyId: string;
    companyUserId: string;
  }>;
};

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const context = await requireApiContext();

    if (!context.viewer.isSuperadmin) {
      throw new AppHttpError(403, "Área restrita ao superadmin.");
    }

    const routeParams = await params;
    await permanentlyDeleteCompanyUser(routeParams.companyId, routeParams.companyUserId);

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    return jsonError(error, "Não foi possível excluir definitivamente o usuário da empresa.");
  }
}
