"use client";

import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { SignOutButton } from "@/components/auth/signout-button";
import type { CompanyUserDraft } from "@/lib/app.types";
import { requestApi } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function createDraft(role: CompanyUserDraft["role"] = "member"): CompanyUserDraft {
  return {
    confirmPassword: "",
    email: "",
    id: crypto.randomUUID(),
    name: "",
    password: "",
    role,
    status: "active",
  };
}

export function CompanyCreatePage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [users, setUsers] = useState<CompanyUserDraft[]>([createDraft("admin")]);
  const [isSaving, setIsSaving] = useState(false);

  const submit = async () => {
    setIsSaving(true);

    try {
      const response = await requestApi<{ company: { id: string } }>(
        "/api/superadmin/companies",
        {
          body: JSON.stringify({
            name: companyName,
            users,
          }),
          method: "POST",
        },
      );

      toast.success("Empresa criada.");
      router.replace(`/admin/empresas/${response.company.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel criar a empresa.");
    } finally {
      setIsSaving(false);
    }
  };

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
            <h1 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">Nova empresa</h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Cadastre a empresa e os usuarios iniciais. Pelo menos um admin ativo e obrigatorio.
            </p>
            <div className="mt-4">
              <Button asChild type="button" variant="outline">
                <Link href="/admin/empresas">Voltar para empresas</Link>
              </Button>
            </div>
          </div>
          <SignOutButton label="Sair" />
        </div>
      </section>

      <section
        className="surface-shadow mt-4 rounded-[1.75rem] border border-white/60 p-5"
        style={{ background: "var(--panel-surface)" }}
      >
        <div className="space-y-2">
          <Label htmlFor="company-name">Nome da empresa</Label>
          <Input
            id="company-name"
            onChange={(event) => setCompanyName(event.target.value)}
            value={companyName}
          />
        </div>
      </section>

      <section className="mt-4 space-y-4">
        {users.map((user, index) => (
          <article
            className="surface-shadow rounded-[1.5rem] border border-white/60 p-4"
            key={user.id}
            style={{ background: "var(--panel-surface)" }}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Usuario {String(index + 1).padStart(2, "0")}
              </p>
              {users.length > 1 ? (
                <Button
                  onClick={() =>
                    setUsers((current) => current.filter((item) => item.id !== user.id))
                  }
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 className="h-4 w-4 text-[var(--danger)]" />
                </Button>
              ) : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  onChange={(event) =>
                    setUsers((current) =>
                      current.map((item) =>
                        item.id === user.id ? { ...item, name: event.target.value } : item,
                      ),
                    )
                  }
                  value={user.name}
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  onChange={(event) =>
                    setUsers((current) =>
                      current.map((item) =>
                        item.id === user.id ? { ...item, email: event.target.value } : item,
                      ),
                    )
                  }
                  value={user.email}
                />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input
                  onChange={(event) =>
                    setUsers((current) =>
                      current.map((item) =>
                        item.id === user.id
                          ? { ...item, password: event.target.value }
                          : item,
                      ),
                    )
                  }
                  type="password"
                  value={user.password}
                />
              </div>
              <div className="space-y-2">
                <Label>Confirmar senha</Label>
                <Input
                  onChange={(event) =>
                    setUsers((current) =>
                      current.map((item) =>
                        item.id === user.id
                          ? { ...item, confirmPassword: event.target.value }
                          : item,
                      ),
                    )
                  }
                  type="password"
                  value={user.confirmPassword}
                />
              </div>
              <div className="space-y-2">
                <Label>Perfil</Label>
                <select
                  className="flex h-11 w-full rounded-2xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--foreground)] outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--ring)]"
                  onChange={(event) =>
                    setUsers((current) =>
                      current.map((item) =>
                        item.id === user.id
                          ? {
                              ...item,
                              role: event.target.value as CompanyUserDraft["role"],
                            }
                          : item,
                      ),
                    )
                  }
                  value={user.role}
                >
                  <option value="admin">Admin</option>
                  <option value="member">Usuario</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status inicial</Label>
                <select
                  className="flex h-11 w-full rounded-2xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--foreground)] outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--ring)]"
                  onChange={(event) =>
                    setUsers((current) =>
                      current.map((item) =>
                        item.id === user.id
                          ? {
                              ...item,
                              status: event.target.value as CompanyUserDraft["status"],
                            }
                          : item,
                      ),
                    )
                  }
                  value={user.status}
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
            </div>
          </article>
        ))}
      </section>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          onClick={() => setUsers((current) => [...current, createDraft()])}
          type="button"
          variant="secondary"
        >
          <Plus className="h-4 w-4" />
          Adicionar usuario
        </Button>
        <Button disabled={isSaving} onClick={submit} type="button">
          {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          Criar empresa
        </Button>
      </div>
    </main>
  );
}

