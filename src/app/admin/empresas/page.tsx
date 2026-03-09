import Link from "next/link";
import { SignOutButton } from "@/components/auth/signout-button";
import { ThemeToggleButton } from "@/components/theme/theme-toggle-button";
import { Button } from "@/components/ui/button";
import { requireSuperadminPage } from "@/lib/auth";
import { listCompanies } from "@/lib/crm";

export default async function CompaniesPage() {
  await requireSuperadminPage();
  const companies = await listCompanies();

  return (
    <main className="min-h-screen px-4 py-5 md:px-8 md:py-6">
      <section
        className="surface-shadow rounded-[1.75rem] border border-white/60 px-5 py-4"
        style={{ background: "var(--header-surface)" }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
              Superadmin
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
              Empresas do CRM
            </h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Cadastre, inative, edite empresas e entre no contexto operacional de qualquer uma.
            </p>
            <div className="mt-4">
              <Button asChild className="text-[var(--primary-foreground)]" type="button">
                <Link href="/admin/empresas/nova">Nova empresa</Link>
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggleButton compactLabel variant="outline" />
            <SignOutButton label="Sair" />
          </div>
        </div>
      </section>

      <section className="mt-4 space-y-3">
        {companies.map((company) => (
          <article
            className="surface-shadow rounded-[1.5rem] border border-white/60 p-4"
            key={company.id}
            style={{ background: "var(--panel-surface)" }}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-semibold text-[var(--foreground)]">{company.name}</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {company.totalUsers} usuário(s) • {company.adminCount} admin(s) • {company.memberCount} membro(s)
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold text-[var(--muted-foreground)]"
                  style={{ background: "var(--subtle-surface)" }}
                >
                  {company.status === "active" ? "Ativa" : "Inativa"}
                </span>
                <Button asChild type="button" variant="outline">
                  <Link href={`/admin/empresas/${company.id}`}>Editar</Link>
                </Button>
                <Button asChild type="button" variant="secondary">
                  <Link href={`/negociacoes?companyId=${company.id}`}>Entrar na empresa</Link>
                </Button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

