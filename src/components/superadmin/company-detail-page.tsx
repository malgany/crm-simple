"use client";

import { LoaderCircle, Pencil, Plus, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { SignOutButton } from "@/components/auth/signout-button";
import type { CompanySummary, UserManagementItem } from "@/lib/app.types";
import { requestApi } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CompanyDetailPageProps = {
  company: CompanySummary;
  initialUsers: UserManagementItem[];
};

type CreateUserForm = {
  confirmPassword: string;
  email: string;
  name: string;
  password: string;
  role: "admin" | "member";
  status: "active" | "inactive";
};

type EditUserForm = {
  confirmPassword: string;
  email: string;
  id: string;
  name: string;
  password: string;
  role: "admin" | "member";
  status: "active" | "inactive";
};

const emptyUserForm: CreateUserForm = {
  confirmPassword: "",
  email: "",
  name: "",
  password: "",
  role: "member",
  status: "active",
};

function buildEditForm(user: UserManagementItem): EditUserForm {
  return {
    confirmPassword: "",
    email: user.email,
    id: user.id,
    name: user.name,
    password: "",
    role: user.role,
    status: user.status === "inactive" ? "inactive" : "active",
  };
}

export function CompanyDetailPage({
  company,
  initialUsers,
}: CompanyDetailPageProps) {
  const [companyState, setCompanyState] = useState(company);
  const [users, setUsers] = useState(initialUsers);
  const [createForm, setCreateForm] = useState<CreateUserForm>(emptyUserForm);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<EditUserForm | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const saveCompany = async () => {
    setIsSavingCompany(true);

    try {
      const response = await requestApi<{ company: CompanySummary }>(
        `/api/superadmin/companies/${companyState.id}`,
        {
          body: JSON.stringify({
            name: companyState.name,
            status: companyState.status,
          }),
          method: "PATCH",
        },
      );

      setCompanyState(response.company);
      toast.success("Empresa atualizada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a empresa.");
    } finally {
      setIsSavingCompany(false);
    }
  };

  const createUser = async () => {
    setIsCreatingUser(true);

    try {
      const response = await requestApi<{ user: UserManagementItem }>(
        `/api/superadmin/companies/${companyState.id}/users`,
        {
          body: JSON.stringify(createForm),
          method: "POST",
        },
      );

      setUsers((current) =>
        [...current, response.user].sort((left, right) =>
          left.name.localeCompare(right.name, "pt-BR"),
        ),
      );
      setCreateForm(emptyUserForm);
      toast.success("Usuário criado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar o usuário.");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const saveUserEdit = async () => {
    if (!editingUser) {
      return;
    }

    setIsSavingEdit(true);

    try {
      const response = await requestApi<{ user: UserManagementItem }>(
        `/api/superadmin/companies/${companyState.id}/users/${editingUser.id}`,
        {
          body: JSON.stringify(editingUser),
          method: "PATCH",
        },
      );

      setUsers((current) =>
        current
          .map((item) => (item.id === editingUser.id ? response.user : item))
          .sort((left, right) => left.name.localeCompare(right.name, "pt-BR")),
      );
      setEditingUser(null);
      toast.success("Usuário atualizado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o usuário.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const deleteUser = async (user: UserManagementItem) => {
    if (!window.confirm(`Excluir o acesso de ${user.name}?`)) {
      return;
    }

    try {
      await requestApi(
        `/api/superadmin/companies/${companyState.id}/users/${user.id}`,
        {
          method: "DELETE",
        },
      );
      setUsers((current) => current.filter((item) => item.id !== user.id));
      toast.success("Usuário excluído.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível excluir o usuário.");
    }
  };

  return (
    <main className="min-h-screen px-4 py-5 md:px-8 md:py-6">
      <section className="surface-shadow rounded-[1.75rem] border border-white/60 bg-[linear-gradient(180deg,#fffdf9_0%,#f4efe5_100%)] px-5 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
              Superadmin
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">
              {companyState.name}
            </h1>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild type="button" variant="outline">
                <Link href="/admin/empresas">Voltar para empresas</Link>
              </Button>
              <Button asChild type="button" variant="secondary">
                <Link href={`/negociacoes?companyId=${companyState.id}`}>Entrar na empresa</Link>
              </Button>
            </div>
          </div>
          <SignOutButton label="Sair" />
        </div>
      </section>

      <section className="surface-shadow mt-4 rounded-[1.75rem] border border-white/60 bg-white/90 p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_14rem_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="company-edit-name">Nome da empresa</Label>
            <Input
              id="company-edit-name"
              onChange={(event) =>
                setCompanyState((current) => ({ ...current, name: event.target.value }))
              }
              value={companyState.name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-edit-status">Status</Label>
            <select
              className="flex h-11 w-full rounded-2xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--foreground)] outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--ring)]"
              id="company-edit-status"
              onChange={(event) =>
                setCompanyState((current) => ({
                  ...current,
                  status: event.target.value as CompanySummary["status"],
                }))
              }
              value={companyState.status}
            >
              <option value="active">Ativa</option>
              <option value="inactive">Inativa</option>
            </select>
          </div>
          <Button disabled={isSavingCompany} onClick={saveCompany} type="button">
            {isSavingCompany ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            Salvar empresa
          </Button>
        </div>
      </section>

      <section className="surface-shadow mt-4 rounded-[1.75rem] border border-white/60 bg-white/90 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-[var(--primary)]" />
          <h2 className="text-lg font-semibold text-slate-950">Novo usuário</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, name: event.target.value }))
              }
              value={createForm.name}
            />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, email: event.target.value }))
              }
              value={createForm.email}
            />
          </div>
          <div className="space-y-2">
            <Label>Senha</Label>
            <Input
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, password: event.target.value }))
              }
              type="password"
              value={createForm.password}
            />
          </div>
          <div className="space-y-2">
            <Label>Confirmar senha</Label>
            <Input
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  confirmPassword: event.target.value,
                }))
              }
              type="password"
              value={createForm.confirmPassword}
            />
          </div>
          <div className="space-y-2">
            <Label>Perfil</Label>
            <select
              className="flex h-11 w-full rounded-2xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--foreground)] outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--ring)]"
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  role: event.target.value as CreateUserForm["role"],
                }))
              }
              value={createForm.role}
            >
              <option value="admin">Admin</option>
              <option value="member">Usuário</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <select
              className="flex h-11 w-full rounded-2xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--foreground)] outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--ring)]"
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  status: event.target.value as CreateUserForm["status"],
                }))
              }
              value={createForm.status}
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button disabled={isCreatingUser} onClick={createUser} type="button">
            {isCreatingUser ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Adicionar usuário
          </Button>
        </div>
      </section>

      <section className="mt-4 space-y-3">
        {users.map((user) => (
          <article
            className="surface-shadow rounded-[1.5rem] border border-white/60 bg-white/90 p-4"
            key={user.id}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-base font-semibold text-slate-950">{user.name}</p>
                <p className="text-sm text-slate-600">
                  {user.email} • {user.role === "admin" ? "Admin" : "Usuário"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {user.status === "active" ? "Ativo" : "Inativo"}
                </span>
                <Button onClick={() => setEditingUser(buildEditForm(user))} type="button" variant="outline">
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
                <Button onClick={() => deleteUser(user)} type="button" variant="ghost">
                  <Trash2 className="h-4 w-4 text-[var(--danger)]" />
                  Excluir
                </Button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <Dialog onOpenChange={(open) => !open && setEditingUser(null)} open={!!editingUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuário da empresa</DialogTitle>
            <DialogDescription>
              Atualize papel, dados de acesso e status do usuário.
            </DialogDescription>
          </DialogHeader>
          {editingUser ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  onChange={(event) =>
                    setEditingUser((current) =>
                      current ? { ...current, name: event.target.value } : current,
                    )
                  }
                  value={editingUser.name}
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  onChange={(event) =>
                    setEditingUser((current) =>
                      current ? { ...current, email: event.target.value } : current,
                    )
                  }
                  value={editingUser.email}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Perfil</Label>
                  <select
                    className="flex h-11 w-full rounded-2xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--foreground)] outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--ring)]"
                    onChange={(event) =>
                      setEditingUser((current) =>
                        current
                          ? {
                              ...current,
                              role: event.target.value as EditUserForm["role"],
                            }
                          : current,
                      )
                    }
                    value={editingUser.role}
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Usuário</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    className="flex h-11 w-full rounded-2xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--foreground)] outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--ring)]"
                    onChange={(event) =>
                      setEditingUser((current) =>
                        current
                          ? {
                              ...current,
                              status: event.target.value as EditUserForm["status"],
                            }
                          : current,
                      )
                    }
                    value={editingUser.status}
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nova senha</Label>
                  <Input
                    onChange={(event) =>
                      setEditingUser((current) =>
                        current ? { ...current, password: event.target.value } : current,
                      )
                    }
                    type="password"
                    value={editingUser.password}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirmar senha</Label>
                  <Input
                    onChange={(event) =>
                      setEditingUser((current) =>
                        current
                          ? { ...current, confirmPassword: event.target.value }
                          : current,
                      )
                    }
                    type="password"
                    value={editingUser.confirmPassword}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button onClick={() => setEditingUser(null)} type="button" variant="ghost">
                  Cancelar
                </Button>
                <Button disabled={isSavingEdit} onClick={saveUserEdit} type="button">
                  {isSavingEdit ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  Salvar usuário
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </main>
  );
}

