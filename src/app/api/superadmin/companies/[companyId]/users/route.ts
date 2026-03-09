import { NextResponse } from "next/server";
import { AppHttpError, requireApiContext } from "@/lib/auth";
import { jsonError, parseJsonBody } from "@/lib/api-helpers";
import { createCompanyUser } from "@/lib/crm";
import { companyUserCreateSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{
    companyId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const context = await requireApiContext();

    if (!context.viewer.isSuperadmin) {
      throw new AppHttpError(403, "Área restrita ao superadmin.");
    }

    const routeParams = await params;
    const payload = companyUserCreateSchema.parse(await parseJsonBody(request));
    const user = await createCompanyUser(routeParams.companyId, {
      email: payload.email.trim(),
      name: payload.name.trim(),
      password: payload.password,
      role: payload.role,
      status: payload.status,
    });

    return NextResponse.json({
      ok: true,
      user,
    });
  } catch (error) {
    return jsonError(error, "Não foi possível criar o usuário da empresa.");
  }
}
