import { NextResponse } from "next/server";
import { AppHttpError, requireApiContext } from "@/lib/auth";
import { jsonError } from "@/lib/api-helpers";
import { restoreCompanyUser } from "@/lib/crm";

type RouteContext = {
  params: Promise<{
    companyId: string;
    companyUserId: string;
  }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const context = await requireApiContext();

    if (!context.viewer.isSuperadmin) {
      throw new AppHttpError(403, "Area restrita ao superadmin.");
    }

    const routeParams = await params;
    const user = await restoreCompanyUser(routeParams.companyId, routeParams.companyUserId);

    return NextResponse.json({
      ok: true,
      user,
    });
  } catch (error) {
    return jsonError(error, "Nao foi possivel restaurar o usuario da empresa.");
  }
}
