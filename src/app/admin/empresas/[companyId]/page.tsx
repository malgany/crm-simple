import { CompanyUsersPage } from "@/components/superadmin/company-users-page";
import { requireSuperadminPage } from "@/lib/auth";
import { getCompanyDetail } from "@/lib/crm";

type CompanyDetailProps = {
  params: Promise<{
    companyId: string;
  }>;
};

export default async function CompanyDetailRoute({ params }: CompanyDetailProps) {
  await requireSuperadminPage();
  const { companyId } = await params;
  const detail = await getCompanyDetail(companyId);

  return <CompanyUsersPage company={detail.company} initialUsers={detail.users} />;
}
