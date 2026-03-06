import { NextResponse } from "next/server";
import { AppHttpError, requireApiContext } from "@/lib/auth";
import { getCompanyIdFromUrl, jsonError, parseJsonBody } from "@/lib/api-helpers";
import { softDeleteMember, updateMember } from "@/lib/crm";
import { memberUpdateSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{
    companyUserId: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const context = await requireApiContext({
      companyId: getCompanyIdFromUrl(request),
      requireAdmin: true,
      requireCompany: true,
    });

    if (context.viewer.isSuperadmin) {
      throw new AppHttpError(
        403,
        "Use a area de empresas para editar usuarios desta empresa.",
      );
    }

    const routeParams = await params;
    const payload = memberUpdateSchema.parse(await parseJsonBody(request));
    const user = await updateMember(
      context.company!.id,
      routeParams.companyUserId,
      payload,
    );

    return NextResponse.json({
      ok: true,
      user,
    });
  } catch (error) {
    return jsonError(error, "Nao foi possivel atualizar o usuario.");
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const context = await requireApiContext({
      companyId: getCompanyIdFromUrl(request),
      requireAdmin: true,
      requireCompany: true,
    });

    if (context.viewer.isSuperadmin) {
      throw new AppHttpError(
        403,
        "Use a area de empresas para excluir usuarios desta empresa.",
      );
    }

    const routeParams = await params;
    await softDeleteMember(context.company!.id, routeParams.companyUserId);

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    return jsonError(error, "Nao foi possivel excluir o usuario.");
  }
}
