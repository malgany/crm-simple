"use client";

import {
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  Pencil,
  Plus,
  SunMoon,
  Trash2,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ResetPasswordDialog } from "@/components/kanban/reset-password-dialog";
import { AppHeader } from "@/components/layout/app-header";
import { useTheme } from "@/components/theme/theme-provider";
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
import type { UserManagementItem } from "@/lib/app.types";
import { requestApi } from "@/lib/client-api";

type MemberManagementPageProps = {
  companyId: string;
  companyName: string;
  initialUsers: UserManagementItem[];
  userEmail: string;
  viewerName: string;
};

type CreateMemberForm = {
  confirmPassword: string;
  email: string;
  name: string;
  password: string;
};

type EditMemberForm = {
  confirmPassword: string;
  email: string;
  id: string;
  name: string;
  password: string;
  status: "active" | "inactive";
};

const emptyCreateForm: CreateMemberForm = {
  confirmPassword: "",
  email: "",
  name: "",
  password: "",
};

const selectClassName =
  "flex h-11 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--input-surface)] px-4 text-sm text-[var(--foreground)] outline-none transition-shadow focus:border-transparent focus:ring-2 focus:ring-[var(--ring)]";

function buildEditForm(user: UserManagementItem): EditMemberForm {
  return {
    confirmPassword: "",
    email: user.email,
    id: user.id,
    name: user.name,
    password: "",
    status: user.status === "inactive" ? "inactive" : "active",
  };
}

export function MemberManagementPage({
  companyId,
  companyName,
  initialUsers,
  userEmail,
  viewerName,
}: MemberManagementPageProps) {
  const router = useRouter();
  const { toggleTheme } = useTheme();
  const [users, setUsers] = useState(initialUsers);
  const [createForm, setCreateForm] =
    useState<CreateMemberForm>(emptyCreateForm);
  const [isCreating, setIsCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<EditMemberForm | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);

  const submitCreate = async () => {
    setIsCreating(true);

    try {
      const response = await requestApi<{ user: UserManagementItem }>(
        "/api/admin/users",
        {
          body: JSON.stringify(createForm),
          method: "POST",
        },
        companyId,
      );

      setUsers((current) =>
        [...current, response.user].sort((left, right) =>
          left.name.localeCompare(right.name, "pt-BR"),
        ),
      );
      setCreateForm(emptyCreateForm);
      toast.success("Usuário criado.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível criar o usuário.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const toggleStatus = async (user: UserManagementItem) => {
    try {
      const response = await requestApi<{ user: UserManagementItem }>(
        `/api/admin/users/${user.id}`,
        {
          body: JSON.stringify({
            confirmPassword: "",
            email: user.email,
            name: user.name,
            password: "",
            status: user.status === "active" ? "inactive" : "active",
          }),
          method: "PATCH",
        },
        companyId,
      );

      setUsers((current) =>
        current.map((item) => (item.id === user.id ? response.user : item)),
      );
      toast.success(
        response.user.status === "active"
          ? "Usuário reativado."
          : "Usuário inativado.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o usuário.",
      );
    }
  };

  const deleteUser = async (user: UserManagementItem) => {
    if (!window.confirm(`Excluir o acesso de ${user.name}?`)) {
      return;
    }

    try {
      await requestApi(
        `/api/admin/users/${user.id}`,
        {
          method: "DELETE",
        },
        companyId,
      );

      setUsers((current) => current.filter((item) => item.id !== user.id));
      toast.success("Usuário excluído.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o usuário.",
      );
    }
  };

  const saveEdit = async () => {
    if (!editingUser) {
      return;
    }

    setIsSavingEdit(true);

    try {
      const response = await requestApi<{ user: UserManagementItem }>(
        `/api/admin/users/${editingUser.id}`,
        {
          body: JSON.stringify(editingUser),
          method: "PATCH",
        },
        companyId,
      );

      setUsers((current) =>
        current
          .map((item) => (item.id === editingUser.id ? response.user : item))
          .sort((left, right) => left.name.localeCompare(right.name, "pt-BR")),
      );
      setEditingUser(null);
      toast.success("Usuário atualizado.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o usuário.",
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <main
      className="min-h-screen px-4 py-5 md:px-8 md:py-6"
      style={{ background: "var(--management-background)" }}
    >
      <div className="mx-auto w-full max-w-6xl">
        <AppHeader
          accountEmail={userEmail}
          accountName={viewerName}
          companyName={companyName}
          menuItems={[
            {
              icon: LayoutDashboard,
              label: "Kanban",
              onSelect: () => router.push("/negociacoes"),
            },
            {
              icon: SunMoon,
              label: "Alternar tema",
              onSelect: toggleTheme,
            },
            {
              icon: LockKeyhole,
              label: "Redefinir senha",
              onSelect: () => setResetPasswordOpen(true),
            },
          ]}
          roleLabel="Admin"
        />

        <div className="py-6 md:py-8">
          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              Administração
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">
              Gestão de usuários
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
              Crie acessos, ajuste dados e controle quais usuários da empresa
              continuam ativos.
            </p>
          </section>

          <section
            className="surface-shadow mt-6 overflow-hidden rounded-[0.75rem] border border-[var(--border)]"
            style={{ background: "var(--panel-surface)" }}
          >
            <div
              className="border-b border-[var(--border)] px-5 py-5 md:px-6"
              style={{ background: "var(--panel-accent-surface)" }}
            >
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-[var(--primary)]" />
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  Novo usuário
                </h2>
              </div>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Cadastre um novo membro com nome, e-mail e senha inicial.
              </p>
            </div>

            <form
              autoComplete="off"
              className="grid gap-4 px-5 py-5 md:grid-cols-2 md:px-6 md:py-6"
              onSubmit={(event) => {
                event.preventDefault();
                void submitCreate();
              }}
            >
              <FormAutofillGuard />
              <div className="space-y-2">
                <Label htmlFor="member-name">Nome</Label>
                <Input
                  id="member-name"
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  value={createForm.name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-email">E-mail</Label>
                <Input
                  autoComplete="off"
                  id="member-email"
                  name="member-email"
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  value={createForm.email}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-password">Senha</Label>
                <Input
                  autoComplete="new-password"
                  id="member-password"
                  name="member-password"
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  type="password"
                  value={createForm.password}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-password-confirm">Confirmar senha</Label>
                <Input
                  autoComplete="new-password"
                  id="member-password-confirm"
                  name="member-password-confirm"
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
              <div className="md:col-span-2 flex justify-end pt-2">
                <Button disabled={isCreating} type="submit">
                  {isCreating ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Criar usuário
                </Button>
              </div>
            </form>
          </section>

          <section className="mt-6 space-y-3">
            {users.map((user) => (
              <article
                className="surface-shadow rounded-[0.75rem] border border-[var(--border)] p-4 md:p-5"
                key={user.id}
                style={{ background: "var(--panel-surface)" }}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-[var(--foreground)]">
                      {user.name}
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {user.email}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={
                        user.status === "active"
                          ? "rounded-full bg-[var(--primary)]/15 px-3 py-1 text-xs font-semibold text-[var(--primary)]"
                          : "rounded-full px-3 py-1 text-xs font-semibold text-[var(--muted-foreground)]"
                      }
                      style={
                        user.status === "active"
                          ? undefined
                          : { background: "var(--subtle-surface)" }
                      }
                    >
                      {user.status === "active" ? "Ativo" : "Inativo"}
                    </span>
                    <Button
                      onClick={() => setEditingUser(buildEditForm(user))}
                      type="button"
                      variant="outline"
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      onClick={() => toggleStatus(user)}
                      type="button"
                      variant="outline"
                    >
                      <UserX className="h-4 w-4" />
                      {user.status === "active" ? "Inativar" : "Reativar"}
                    </Button>
                    <Button
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

          <div className="mt-6 flex justify-start">
            <Button asChild type="button" variant="outline">
              <Link href="/negociacoes">Voltar ao Kanban</Link>
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        onOpenChange={(open) => !open && setEditingUser(null)}
        open={!!editingUser}
      >
        <DialogContent className="w-[min(94vw,38rem)]">
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
            <DialogDescription>
              Atualize os dados do usuário ou altere o status de acesso.
            </DialogDescription>
          </DialogHeader>
          {editingUser ? (
            <form
              autoComplete="off"
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                void saveEdit();
              }}
            >
              <FormAutofillGuard />
              <div
                className="space-y-5 rounded-[0.75rem] border border-[var(--border)] p-4 md:p-5"
                style={{ background: "var(--subtle-surface)" }}
              >
                <div className="space-y-2">
                  <Label htmlFor="edit-member-name">Nome</Label>
                  <Input
                    id="edit-member-name"
                    onChange={(event) =>
                      setEditingUser((current) =>
                        current
                          ? { ...current, name: event.target.value }
                          : current,
                      )
                    }
                    value={editingUser.name}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-member-email">E-mail</Label>
                  <Input
                    autoComplete="off"
                    id="edit-member-email"
                    name="edit-member-email"
                    onChange={(event) =>
                      setEditingUser((current) =>
                        current
                          ? { ...current, email: event.target.value }
                          : current,
                      )
                    }
                    value={editingUser.email}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-member-status">Status</Label>
                  <select
                    className={selectClassName}
                    id="edit-member-status"
                    onChange={(event) =>
                      setEditingUser((current) =>
                        current
                          ? {
                              ...current,
                              status: event.target.value as
                                | "active"
                                | "inactive",
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

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-member-password">Nova senha</Label>
                    <Input
                      autoComplete="new-password"
                      id="edit-member-password"
                      name="edit-member-password"
                      onChange={(event) =>
                        setEditingUser((current) =>
                          current
                            ? { ...current, password: event.target.value }
                            : current,
                        )
                      }
                      type="password"
                      value={editingUser.password}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-member-confirm">Confirmar senha</Label>
                    <Input
                      autoComplete="new-password"
                      id="edit-member-confirm"
                      name="edit-member-confirm"
                      onChange={(event) =>
                        setEditingUser((current) =>
                          current
                            ? {
                                ...current,
                                confirmPassword: event.target.value,
                              }
                            : current,
                        )
                      }
                      type="password"
                      value={editingUser.confirmPassword}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  onClick={() => setEditingUser(null)}
                  type="button"
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button disabled={isSavingEdit} type="submit">
                  {isSavingEdit ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : null}
                  Salvar alterações
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <ResetPasswordDialog
        onOpenChange={setResetPasswordOpen}
        open={resetPasswordOpen}
        userEmail={userEmail}
      />
    </main>
  );
}
