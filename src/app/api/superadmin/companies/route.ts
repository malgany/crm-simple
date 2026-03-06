import { NextResponse } from "next/server";
import { AppHttpError, requireApiContext } from "@/lib/auth";
import { jsonError, parseJsonBody } from "@/lib/api-helpers";
import { createCompany, listCompanies } from "@/lib/crm";
import { companyCreateSchema } from "@/lib/validation";

export async function GET() {
  try {
    const context = await requireApiContext();

    if (!context.viewer.isSuperadmin) {
      throw new AppHttpError(403, "Area restrita ao superadmin.");
    }

    const companies = await listCompanies();

    return NextResponse.json({
      ok: true,
      companies,
    });
  } catch (error) {
    return jsonError(error, "Nao foi possivel carregar as empresas.");
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireApiContext();

    if (!context.viewer.isSuperadmin) {
      throw new AppHttpError(403, "Area restrita ao superadmin.");
    }

    const payload = companyCreateSchema.parse(await parseJsonBody(request));
    const company = await createCompany(payload);

    return NextResponse.json({
      ok: true,
      company,
    });
  } catch (error) {
    return jsonError(error, "Nao foi possivel criar a empresa.");
  }
}
