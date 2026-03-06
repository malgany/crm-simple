"use client";

import { LoaderCircle, Pencil, Plus, Trash2, UserX } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MemberManagementPageProps = {
  companyId: string;
  companyName: string;
  initialUsers: UserManagementItem[];
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
}: MemberManagementPageProps) {
  const [users, setUsers] = useState(initialUsers);
  const [createForm, setCreateForm] = useState<CreateMemberForm>(emptyCreateForm);
  const [isCreating, setIsCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<EditMemberForm | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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
      <section className="surface-shadow rounded-[1.75rem] border border-white/60 bg-[linear-gradient(180deg,#fffdf9_0%,#f4efe5_100%)] px-5 py-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
          Usuarios
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          Gestao de usuarios comuns
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Empresa: <strong>{companyName}</strong>
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild type="button" variant="outline">
            <Link href="/negociacoes">Voltar ao Kanban</Link>
          </Button>
        </div>
      </section>

      <section className="surface-shadow mt-4 rounded-[1.75rem] border border-white/60 bg-white/90 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-[var(--primary)]" />
          <h2 className="text-lg font-semibold text-slate-950">Novo usuario comum</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
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
              id="member-email"
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, email: event.target.value }))
              }
              value={createForm.email}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="member-password">Senha</Label>
            <Input
              id="member-password"
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
              id="member-password-confirm"
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
        </div>
        <div className="mt-4 flex justify-end">
          <Button disabled={isCreating} onClick={submitCreate} type="button">
            {isCreating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Criar usuario
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
                <p className="text-sm text-slate-600">{user.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
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
                <Button onClick={() => toggleStatus(user)} type="button" variant="outline">
                  <UserX className="h-4 w-4" />
                  {user.status === "active" ? "Inativar" : "Reativar"}
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
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>
              Atualize dados do usuario comum ou altere o status de acesso.
            </DialogDescription>
          </DialogHeader>
          {editingUser ? (
            <div className="space-y-4">
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
                  id="edit-member-email"
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
                  className="flex h-11 w-full rounded-2xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--foreground)] outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--ring)]"
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
                    id="edit-member-password"
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
                    id="edit-member-confirm"
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
                <Button disabled={isSavingEdit} onClick={saveEdit} type="button">
                  {isSavingEdit ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  Salvar alteracoes
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </main>
  );
}
