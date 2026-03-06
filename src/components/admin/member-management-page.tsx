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
import { AppHeader } from "@/components/layout/app-header";
import { useTheme } from "@/components/theme/theme-provider";
import { ResetPasswordDialog } from "@/components/kanban/reset-password-dialog";
import type { UserManagementItem } from "@/lib/app.types";
import { requestApi } from "@/lib/client-api";
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
  const [createForm, setCreateForm] = useState<CreateMemberForm>(emptyCreateForm);
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
      toast.success("Usuario criado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel criar o usuario.");
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
        response.user.status === "active" ? "Usuario reativado." : "Usuario inativado.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel atualizar o usuario.");
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
      toast.success("Usuario excluido.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel excluir o usuario.");
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
      toast.success("Usuario atualizado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel atualizar o usuario.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-5 md:px-8 md:py-6">
      <AppHeader
        companyName={companyName}
        menuItems={[
          {
            icon: LayoutDashboard,
            label: "Kanban",
            onSelect: () => router.push("/negociacoes"),
          },
          {
            icon: SunMoon,
            label: "Alternar tema (Claro / Escuro)",
            onSelect: toggleTheme,
          },
          {
            icon: LockKeyhole,
            label: "Redefinir senha",
            onSelect: () => setResetPasswordOpen(true),
          },
        ]}
        roleLabel={viewerName}
      />

      <section className="mt-4 px-1">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Gestao de usuarios</h1>
      </section>

      <section
        className="surface-shadow mt-4 rounded-[1.75rem] border border-white/60 p-5"
        style={{ background: "var(--panel-surface)" }}
      >
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-[var(--primary)]" />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Novo usuario</h2>
        </div>
        <form
          autoComplete="off"
          className="grid gap-4 md:grid-cols-2"
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
                setCreateForm((current) => ({ ...current, name: event.target.value }))
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
                setCreateForm((current) => ({ ...current, email: event.target.value }))
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
                setCreateForm((current) => ({ ...current, password: event.target.value }))
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
          <div className="md:col-span-2 mt-4 flex justify-end">
            <Button disabled={isCreating} type="submit">
              {isCreating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Criar usuario
            </Button>
          </div>
        </form>
      </section>

      <section className="mt-4 space-y-3">
        {users.map((user) => (
          <article
            className="surface-shadow rounded-[1.5rem] border border-white/60 p-4"
            key={user.id}
            style={{ background: "var(--panel-surface)" }}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-base font-semibold text-[var(--foreground)]">{user.name}</p>
                <p className="text-sm text-[var(--muted-foreground)]">{user.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold text-[var(--muted-foreground)]"
                  style={{ background: "var(--subtle-surface)" }}
                >
                  {user.status === "active" ? "Ativo" : "Inativo"}
                </span>
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
                  className="hover:border-slate-300 hover:bg-[var(--subtle-surface)]"
                  onClick={() => toggleStatus(user)}
                  type="button"
                  variant="outline"
                >
                  <UserX className="h-4 w-4" />
                  {user.status === "active" ? "Inativar" : "Reativar"}
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

      <div className="mt-4 flex justify-start">
        <Button asChild type="button" variant="outline">
          <Link href="/negociacoes">Voltar ao Kanban</Link>
        </Button>
      </div>

      <Dialog onOpenChange={(open) => !open && setEditingUser(null)} open={!!editingUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>
              Atualize dados do usuario ou altere o status de acesso.
            </DialogDescription>
          </DialogHeader>
          {editingUser ? (
            <form
              autoComplete="off"
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void saveEdit();
              }}
            >
              <FormAutofillGuard />
              <div className="space-y-2">
                <Label htmlFor="edit-member-name">Nome</Label>
                <Input
                  id="edit-member-name"
                  onChange={(event) =>
                    setEditingUser((current) =>
                      current ? { ...current, name: event.target.value } : current,
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
                      current ? { ...current, email: event.target.value } : current,
                    )
                  }
                  value={editingUser.email}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-member-status">Status</Label>
                <select
                  className="flex h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--input-surface)] px-4 text-sm text-[var(--foreground)] outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--ring)]"
                  id="edit-member-status"
                  onChange={(event) =>
                    setEditingUser((current) =>
                      current
                        ? {
                            ...current,
                            status: event.target.value as "active" | "inactive",
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
                        current ? { ...current, password: event.target.value } : current,
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
                  Salvar alteracoes
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
