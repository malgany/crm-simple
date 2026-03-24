"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { CSSProperties } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme/theme-provider";
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

const fieldClassName =
  "rounded-[0.55rem] border border-[var(--board-dialog-border)] bg-[var(--board-dialog-input-surface)] pl-11 placeholder:text-[#9fadbc]";

const boardPrimaryButtonClass =
  "border-transparent bg-[#669DF1] text-[#091218] hover:bg-[#7ba9f3] hover:shadow-[0_10px_24px_-18px_rgba(102,157,241,0.95)]";

export function ResetPasswordDialog({
  onOpenChange,
  open,
  userEmail,
}: ResetPasswordDialogProps) {
  const { theme } = useTheme();
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
      toast.error("Não foi possível identificar o usuário da sessão.");
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

  const dialogStyle = {
    ["--border" as string]: "var(--board-dialog-border)",
    ["--input-surface" as string]: "var(--board-dialog-input-surface)",
    background: theme === "light" ? "#ffffff" : "var(--board-dialog-surface)",
    borderColor: "var(--board-dialog-border)",
  } satisfies CSSProperties;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className="w-[min(94vw,34rem)] rounded-[0.9rem]"
        style={dialogStyle}
      >
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
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <Input
                autoComplete="current-password"
                className={fieldClassName}
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
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <Input
                autoComplete="new-password"
                className={fieldClassName}
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
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <Input
                autoComplete="new-password"
                className={fieldClassName}
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
            <Button
              className={boardPrimaryButtonClass}
              disabled={form.formState.isSubmitting}
              type="submit"
            >
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
