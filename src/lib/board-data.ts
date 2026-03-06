import "server-only";
import { loadBoardData as loadCompanyBoardData } from "@/lib/crm";

export async function loadBoardData(companyId: string) {
  return loadCompanyBoardData(companyId);
}
