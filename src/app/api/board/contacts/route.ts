import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/auth";
import { getCompanyIdFromUrl, jsonError, parseJsonBody } from "@/lib/api-helpers";
import { createContactWithDeal } from "@/lib/crm";
import { contactSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const context = await requireApiContext({
      companyId: getCompanyIdFromUrl(request),
      requireCompany: true,
    });
    const payload = contactSchema.parse(await parseJsonBody(request));
    const card = await createContactWithDeal(context.company!.id, payload);

    return NextResponse.json({
      ok: true,
      card,
    });
  } catch (error) {
    return jsonError(error, "Não foi possível criar o contato.");
  }
}
