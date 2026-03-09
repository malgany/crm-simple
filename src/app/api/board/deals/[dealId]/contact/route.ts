import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/auth";
import { getCompanyIdFromUrl, jsonError, parseJsonBody } from "@/lib/api-helpers";
import { deleteContact, updateContact } from "@/lib/crm";
import { updateContactSchema } from "@/lib/validation";

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
    const payload = updateContactSchema.parse(await parseJsonBody(request));
    const contact = await updateContact(context.company!.id, routeParams.dealId, payload);

    return NextResponse.json({
      ok: true,
      contact,
    });
  } catch (error) {
    return jsonError(error, "Não foi possível atualizar o contato.");
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const context = await requireApiContext({
      companyId: getCompanyIdFromUrl(request),
      requireCompany: true,
    });
    const routeParams = await params;

    await deleteContact(context.company!.id, routeParams.dealId);

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    return jsonError(error, "Não foi possível excluir o contato.");
  }
}
