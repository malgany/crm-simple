import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/auth";
import { getCompanyIdFromUrl, jsonError, parseJsonBody } from "@/lib/api-helpers";
import { addNote } from "@/lib/crm";
import { noteSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{
    dealId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const context = await requireApiContext({
      companyId: getCompanyIdFromUrl(request),
      requireCompany: true,
    });
    const routeParams = await params;
    const payload = noteSchema.parse(await parseJsonBody(request));
    const note = await addNote(context.company!.id, routeParams.dealId, payload, {
      authUserId: context.user.id,
      isSuperadmin: context.viewer.isSuperadmin,
      name: context.viewer.isSuperadmin ? "Superadmin" : context.viewer.name,
    });

    return NextResponse.json({
      ok: true,
      note,
    });
  } catch (error) {
    return jsonError(error, "Não foi possível registrar a observacao.");
  }
}
