import { NextResponse } from "next/server";
import { AppHttpError, requireApiContext } from "@/lib/auth";
import { jsonError, parseJsonBody } from "@/lib/api-helpers";
import { softDeleteCompanyUser, updateCompanyUser } from "@/lib/crm";
import { companyUserUpdateSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{
    companyId: string;
    companyUserId: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const context = await requireApiContext();

    if (!context.viewer.isSuperadmin) {
      throw new AppHttpError(403, "Area restrita ao superadmin.");
    }

    const routeParams = await params;
    const payload = companyUserUpdateSchema.parse(await parseJsonBody(request));
    const user = await updateCompanyUser(routeParams.companyId, routeParams.companyUserId, {
      email: payload.email.trim(),
      name: payload.name.trim(),
      password: payload.password?.trim() || undefined,
      role: payload.role,
      status: payload.status,
    });

    return NextResponse.json({
      ok: true,
      user,
    });
  } catch (error) {
    return jsonError(error, "Nao foi possivel atualizar o usuario da empresa.");
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const context = await requireApiContext();

    if (!context.viewer.isSuperadmin) {
      throw new AppHttpError(403, "Area restrita ao superadmin.");
    }

    const routeParams = await params;
    await softDeleteCompanyUser(routeParams.companyId, routeParams.companyUserId);

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    return jsonError(error, "Nao foi possivel excluir o usuario da empresa.");
  }
}
