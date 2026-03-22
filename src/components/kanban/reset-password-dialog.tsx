"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import {
  changePasswordSchema,
  type ChangePasswordSchema,
} from "@/lib/validation";

type ResetPasswordDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  userEmail: string;
};

export function ResetPasswordDialog({
  onOpenChange,
  open,
  userEmail,
}: ResetPasswordDialogProps) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const form = useForm<ChangePasswordSchema>({
    defaultValues: {
      confirmPassword: "",
      currentPassword: "",
      password: "",
    },
    resolver: zodResolver(changePasswordSchema),
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [form, open]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!userEmail.trim()) {
      toast.error("Não foi possível identificar o usuário da sessao.");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: values.currentPassword,
    });

    if (signInError) {
      toast.error("Senha atual inválida.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    toast.success("Senha atualizada com sucesso.");
    form.reset();
    onOpenChange(false);
    router.refresh();
  });

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="w-[min(94vw,34rem)]">
        <DialogHeader>
          <DialogTitle>Redefinir senha</DialogTitle>
          <DialogDescription>
            Informe a senha atual e confirme a nova senha para concluir a troca.
          </DialogDescription>
        </DialogHeader>
        <form autoComplete="on" className="space-y-5" onSubmit={onSubmit}>
          <input
            aria-hidden="true"
            autoComplete="username"
            className="sr-only"
            name="username"
            readOnly
            tabIndex={-1}
            type="email"
            value={userEmail}
          />
          <div className="space-y-2">
            <Label htmlFor="current-password">Senha atual</Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                autoComplete="current-password"
                className="pl-11"
                id="current-password"
                type="password"
                {...form.register("currentPassword")}
                name="current-password"
              />
            </div>
            <p className="text-sm text-[var(--danger)]">
              {form.formState.errors.currentPassword?.message}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova senha</Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                autoComplete="new-password"
                className="pl-11"
                id="new-password"
                type="password"
                {...form.register("password")}
                name="new-password"
              />
            </div>
            <p className="text-sm text-[var(--danger)]">
              {form.formState.errors.password?.message}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-new-password">Confirmar nova senha</Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                autoComplete="new-password"
                className="pl-11"
                id="confirm-new-password"
                type="password"
                {...form.register("confirmPassword")}
                name="confirm-new-password"
              />
            </div>
            <p className="text-sm text-[var(--danger)]">
              {form.formState.errors.confirmPassword?.message}
            </p>
          </div>
          <div className="flex justify-end">
            <Button disabled={form.formState.isSubmitting} type="submit">
              {form.formState.isSubmitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : null}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
