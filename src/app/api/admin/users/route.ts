import { NextResponse } from "next/server";
import { AppHttpError, requireApiContext } from "@/lib/auth";
import { getCompanyIdFromUrl, jsonError, parseJsonBody } from "@/lib/api-helpers";
import { createMember, listCompanyMembers } from "@/lib/crm";
import { memberCreateSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const context = await requireApiContext({
      companyId: getCompanyIdFromUrl(request),
      requireAdmin: true,
      requireCompany: true,
    });
    const users = await listCompanyMembers(context.company!.id);

    return NextResponse.json({
      ok: true,
      users,
    });
  } catch (error) {
    return jsonError(error, "Nao foi possivel carregar os usuarios.");
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireApiContext({
      companyId: getCompanyIdFromUrl(request),
      requireAdmin: true,
      requireCompany: true,
    });

    if (context.viewer.isSuperadmin) {
      throw new AppHttpError(
        403,
        "Use a area de empresas para cadastrar admins ou usuarios globais.",
      );
    }

    const payload = memberCreateSchema.parse(await parseJsonBody(request));
    const user = await createMember(context.company!.id, payload);

    return NextResponse.json({
      ok: true,
      user,
    });
  } catch (error) {
    return jsonError(error, "Nao foi possivel criar o usuario.");
  }
}
