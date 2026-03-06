import { NextResponse } from "next/server";
import { requireApiContext } from "@/lib/auth";
import { loadBoardData } from "@/lib/crm";
import { getCompanyIdFromUrl, jsonError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const context = await requireApiContext({
      companyId: getCompanyIdFromUrl(request),
      requireCompany: true,
    });
    const board = await loadBoardData(context.company!.id);

    return NextResponse.json({
      ok: true,
      board,
    });
  } catch (error) {
    return jsonError(error, "Nao foi possivel carregar o quadro.");
  }
}
