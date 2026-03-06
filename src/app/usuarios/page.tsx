import { redirect } from "next/navigation";
import { MemberManagementPage } from "@/components/admin/member-management-page";
import { requirePageContext } from "@/lib/auth";
import { listCompanyMembers } from "@/lib/crm";

type UsersPageProps = {
  searchParams: Promise<{
    companyId?: string | string[];
  }>;
};

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;
  const companyId = getSearchParam(params.companyId);
  const context = await requirePageContext({
    companyId,
    requireAdmin: true,
    requireCompany: true,
    superadminFallback: "/admin/empresas",
  });

  if (context.viewer.isSuperadmin) {
    redirect(`/admin/empresas/${context.company!.id}`);
  }

  const users = await listCompanyMembers(context.company!.id);

  return (
    <MemberManagementPage
      companyId={context.company!.id}
      companyName={context.company!.name}
      initialUsers={users}
    />
  );
}
