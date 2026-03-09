"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const signupSchema = z
  .object({
    email: z.email("Informe um e-mail valido."),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });

type SignupValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const form = useForm<SignupValues>({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Enviamos um link de confirmacao para o seu e-mail.");
    router.replace("/confirmacao?mode=pending");
    router.refresh();
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="signup-email">E-mail</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            autoComplete="email"
            className="pl-11"
            id="signup-email"
            placeholder="você@empresa.com"
            {...form.register("email")}
          />
        </div>
        <p className="text-sm text-[var(--danger)]">
          {form.formState.errors.email?.message}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Senha</Label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            autoComplete="new-password"
            className="pl-11"
            id="signup-password"
            type="password"
            {...form.register("password")}
          />
        </div>
        <p className="text-sm text-[var(--danger)]">
          {form.formState.errors.password?.message}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-confirm-password">Confirmar senha</Label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            autoComplete="new-password"
            className="pl-11"
            id="signup-confirm-password"
            type="password"
            {...form.register("confirmPassword")}
          />
        </div>
        <p className="text-sm text-[var(--danger)]">
          {form.formState.errors.confirmPassword?.message}
        </p>
      </div>
      <Button
        className="w-full"
        disabled={form.formState.isSubmitting}
        size="lg"
        type="submit"
      >
        {form.formState.isSubmitting ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : null}
        Criar conta
      </Button>
    </form>
  );
}
