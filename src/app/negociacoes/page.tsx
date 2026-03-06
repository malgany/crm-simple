import { KanbanPage } from "@/components/kanban/kanban-page";
import { requirePageContext } from "@/lib/auth";
import { loadBoardData } from "@/lib/board-data";

type NegotiationsPageProps = {
  searchParams: Promise<{
    companyId?: string | string[];
  }>;
};

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NegotiationsPage({
  searchParams,
}: NegotiationsPageProps) {
  const params = await searchParams;
  const companyId = getSearchParam(params.companyId);
  const context = await requirePageContext({
    companyId,
    requireCompany: true,
    superadminFallback: "/admin/empresas",
  });
  const board = await loadBoardData(context.company!.id);

  return (
    <KanbanPage
      canManageStages={context.effectiveCompanyRole === "admin"}
      canManageUsers={
        !context.viewer.isSuperadmin && context.effectiveCompanyRole === "admin"
      }
      companyId={context.company!.id}
      initialStages={board.stages}
      viewer={context.viewer}
    />
  );
}
