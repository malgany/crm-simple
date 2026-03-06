import { NextResponse } from "next/server";
import { AppHttpError, requireApiContext } from "@/lib/auth";
import { jsonError, parseJsonBody } from "@/lib/api-helpers";
import { updateCompany } from "@/lib/crm";
import { companyUpdateSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{
    companyId: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const context = await requireApiContext();

    if (!context.viewer.isSuperadmin) {
      throw new AppHttpError(403, "Area restrita ao superadmin.");
    }

    const routeParams = await params;
    const payload = companyUpdateSchema.parse(await parseJsonBody(request));
    const company = await updateCompany(routeParams.companyId, payload);

    return NextResponse.json({
      ok: true,
      company,
    });
  } catch (error) {
    return jsonError(error, "Nao foi possivel atualizar a empresa.");
  }
}
