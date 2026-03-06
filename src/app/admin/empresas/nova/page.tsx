import { CompanyCreatePage } from "@/components/superadmin/company-create-page";
import { requireSuperadminPage } from "@/lib/auth";

export default async function NewCompanyPage() {
  await requireSuperadminPage();
  return <CompanyCreatePage />;
}
