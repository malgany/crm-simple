"use client";

import {
  LayoutDashboard,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Shield,
  Skull,
  SunMoon,
  Trash2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { useTheme } from "@/components/theme/theme-provider";
import { requestApi } from "@/lib/client-api";
import type { CompanySummary, UserManagementItem } from "@/lib/app.types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormAutofillGuard } from "@/components/ui/form-autofill-guard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CompanyUsersPageProps = {
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

function sortUsers(users: UserManagementItem[]) {
  return [...users].sort((left, right) => {
    if (left.status === "deleted" && right.status !== "deleted") {
      return 1;
    }

    if (left.status !== "deleted" && right.status === "deleted") {
      return -1;
    }

    if (left.role !== right.role) {
      return left.role.localeCompare(right.role);
    }

    return left.name.localeCompare(right.name, "pt-BR");
  });
}

export function CompanyUsersPage({
  company,
  initialUsers,
}: CompanyUsersPageProps) {
  const router = useRouter();
  const { toggleTheme } = useTheme();
  const [companyState, setCompanyState] = useState(company);
  const [users, setUsers] = useState(() => sortUsers(initialUsers));
  const [createForm, setCreateForm] = useState<CreateUserForm>(emptyUserForm);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<EditUserForm | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [restoringUserId, setRestoringUserId] = useState<string | null>(null);
  const [permanentlyDeletingUserId, setPermanentlyDeletingUserId] = useState<string | null>(null);

  const activeUsers = useMemo(
    () => users.filter((user) => user.status !== "deleted"),
    [users],
  );
  const deletedUsers = useMemo(
    () => users.filter((user) => user.status === "deleted"),
    [users],
  );

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

      setUsers((current) => sortUsers([...current, response.user]));
      setCreateForm({ ...emptyUserForm });
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
        sortUsers(
          current.map((item) => (item.id === editingUser.id ? response.user : item)),
        ),
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
      setUsers((current) =>
        sortUsers(
          current.map((item) =>
            item.id === user.id ? { ...item, status: "deleted" } : item,
          ),
        ),
      );
      toast.success("Usuário excluído.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível excluir o usuário.");
    }
  };

  const restoreUser = async (user: UserManagementItem) => {
    setRestoringUserId(user.id);

    try {
      const response = await requestApi<{ user: UserManagementItem }>(
        `/api/superadmin/companies/${companyState.id}/users/${user.id}/restore`,
        {
          method: "POST",
        },
      );

      setUsers((current) =>
        sortUsers(current.map((item) => (item.id === user.id ? response.user : item))),
      );
      toast.success("Usuário restaurado como inativo.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível restaurar o usuário.");
    } finally {
      setRestoringUserId(null);
    }
  };

  const permanentlyDeleteUser = async (user: UserManagementItem) => {
    if (
      !window.confirm(
        `Excluir definitivamente ${user.name}? Esta ação remove o usuário e os vínculos relacionados sem possibilidade de restauração.`,
      )
    ) {
      return;
    }

    setPermanentlyDeletingUserId(user.id);

    try {
      await requestApi(
        `/api/superadmin/companies/${companyState.id}/users/${user.id}/permanent-delete`,
        {
          method: "DELETE",
        },
      );

      setUsers((current) => current.filter((item) => item.id !== user.id));
      toast.success("Usuário excluído definitivamente.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir definitivamente o usuário.",
      );
    } finally {
      setPermanentlyDeletingUserId(null);
    }
  };

  return (
    <main className="min-h-screen px-4 py-5 md:px-8 md:py-6">
      <AppHeader
        companyName={companyState.name}
        menuItems={[
          {
            icon: LayoutDashboard,
            label: "Kanban",
            onSelect: () => router.push(`/negociacoes?companyId=${companyState.id}`),
          },
          {
            icon: SunMoon,
            label: "Alternar tema",
            onSelect: toggleTheme,
          },
          {
            icon: Shield,
            label: "Voltar para empresas",
            onSelect: () => router.push("/admin/empresas"),
          },
        ]}
        roleLabel="Superadmin"
      />

      <section className="mt-4 px-1">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Gestão da empresa</h1>
      </section>

      <section
        className="surface-shadow mt-4 rounded-[1.75rem] border border-white/60 p-5"
        style={{ background: "var(--panel-surface)" }}
      >
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
              className="flex h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--input-surface)] px-4 text-sm text-[var(--foreground)] outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--ring)]"
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

      <section
        className="surface-shadow mt-4 rounded-[1.75rem] border border-white/60 p-5"
        style={{ background: "var(--panel-surface)" }}
      >
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-[var(--primary)]" />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Novo usuário</h2>
        </div>
        <form
          autoComplete="off"
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void createUser();
          }}
        >
          <FormAutofillGuard />
          <div className="space-y-2">
            <Label htmlFor="company-user-name">Nome</Label>
            <Input
              id="company-user-name"
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, name: event.target.value }))
              }
              value={createForm.name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-user-email">E-mail</Label>
            <Input
              autoComplete="off"
              id="company-user-email"
              name="company-user-email"
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, email: event.target.value }))
              }
              value={createForm.email}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-user-password">Senha</Label>
            <Input
              autoComplete="new-password"
              id="company-user-password"
              name="company-user-password"
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, password: event.target.value }))
              }
              type="password"
              value={createForm.password}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-user-confirm">Confirmar senha</Label>
            <Input
              autoComplete="new-password"
              id="company-user-confirm"
              name="company-user-confirm"
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
            <Label htmlFor="company-user-role">Perfil</Label>
            <select
              className="flex h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--input-surface)] px-4 text-sm text-[var(--foreground)] outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--ring)]"
              id="company-user-role"
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
            <Label htmlFor="company-user-status">Status</Label>
            <select
              className="flex h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--input-surface)] px-4 text-sm text-[var(--foreground)] outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--ring)]"
              id="company-user-status"
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
          <div className="md:col-span-2 mt-4 flex justify-end">
            <Button disabled={isCreatingUser} type="submit">
              {isCreatingUser ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Adicionar usuário
            </Button>
          </div>
        </form>
      </section>

      <section className="mt-4 space-y-3">
        {activeUsers.map((user) => (
          <article
            className="surface-shadow rounded-[1.5rem] border border-white/60 p-4"
            key={user.id}
            style={{ background: "var(--panel-surface)" }}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-base font-semibold text-[var(--foreground)]">{user.name}</p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {user.email} - {user.role === "admin" ? "Admin" : "Usuário"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {user.status === "active" ? (
                  <span className="rounded-full bg-[var(--primary)]/15 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                    Ativo
                  </span>
                ) : (
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold text-[var(--muted-foreground)]"
                    style={{ background: "var(--subtle-surface)" }}
                  >
                    Inativo
                  </span>
                )}
                <Button
                  className="hover:border-slate-300 hover:bg-[var(--subtle-surface)]"
                  onClick={() => setEditingUser(buildEditForm(user))}
                  type="button"
                  variant="outline"
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
                <Button
                  className="hover:bg-[var(--subtle-surface)]"
                  onClick={() => deleteUser(user)}
                  type="button"
                  variant="ghost"
                >
                  <Trash2 className="h-4 w-4 text-[var(--danger)]" />
                  Excluir
                </Button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {deletedUsers.length ? (
        <section className="mt-6">
          <div className="mb-3 px-1">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Usuários deletados</h2>
          </div>
          <div className="space-y-3">
            {deletedUsers.map((user) => (
              <article
                className="surface-shadow rounded-[1.5rem] border border-dashed border-[var(--border)] p-4 opacity-80"
                key={user.id}
                style={{ background: "var(--subtle-surface)" }}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-base font-semibold text-[var(--muted-foreground)]">
                      {user.name}
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {user.email} - {user.role === "admin" ? "Admin" : "Usuário"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[var(--danger)]/15 px-3 py-1 text-xs font-semibold text-[var(--danger)]">
                      Excluído
                    </span>
                    <Button
                      className="border-[var(--danger)]/30 text-[var(--danger)] hover:border-[var(--danger)]/40 hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]"
                      disabled={permanentlyDeletingUserId === user.id || restoringUserId === user.id}
                      onClick={() => permanentlyDeleteUser(user)}
                      type="button"
                      variant="outline"
                    >
                      {permanentlyDeletingUserId === user.id ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Skull className="h-4 w-4" />
                      )}
                      Excluir definitivamente
                    </Button>
                    <Button
                      disabled={restoringUserId === user.id || permanentlyDeletingUserId === user.id}
                      onClick={() => restoreUser(user)}
                      type="button"
                      variant="outline"
                    >
                      {restoringUserId === user.id ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      Restaurar usuário
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <Dialog onOpenChange={(open) => !open && setEditingUser(null)} open={!!editingUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuário da empresa</DialogTitle>
            <DialogDescription>
              Atualize papel, dados de acesso e status do usuário.
            </DialogDescription>
          </DialogHeader>
          {editingUser ? (
            <form
              autoComplete="off"
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void saveUserEdit();
              }}
            >
              <FormAutofillGuard />
              <div className="space-y-2">
                <Label htmlFor="edit-company-user-name">Nome</Label>
                <Input
                  id="edit-company-user-name"
                  onChange={(event) =>
                    setEditingUser((current) =>
                      current ? { ...current, name: event.target.value } : current,
                    )
                  }
                  value={editingUser.name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-company-user-email">E-mail</Label>
                <Input
                  autoComplete="off"
                  id="edit-company-user-email"
                  name="edit-company-user-email"
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
                  <Label htmlFor="edit-company-user-role">Perfil</Label>
                  <select
                    className="flex h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--input-surface)] px-4 text-sm text-[var(--foreground)] outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--ring)]"
                    id="edit-company-user-role"
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
                  <Label htmlFor="edit-company-user-status">Status</Label>
                  <select
                    className="flex h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--input-surface)] px-4 text-sm text-[var(--foreground)] outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--ring)]"
                    id="edit-company-user-status"
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
                  <Label htmlFor="edit-company-user-password">Nova senha</Label>
                  <Input
                    autoComplete="new-password"
                    id="edit-company-user-password"
                    name="edit-company-user-password"
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
                  <Label htmlFor="edit-company-user-confirm">Confirmar senha</Label>
                  <Input
                    autoComplete="new-password"
                    id="edit-company-user-confirm"
                    name="edit-company-user-confirm"
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
                <Button disabled={isSavingEdit} type="submit">
                  {isSavingEdit ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  Salvar usuário
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </main>
  );
}
