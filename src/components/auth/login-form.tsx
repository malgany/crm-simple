"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const loginSchema = z.object({
  email: z.email("Informe um e-mail valido."),
  password: z.string().min(1, "Informe sua senha."),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createBrowserSupabaseClient();
  const nextPath = searchParams.get("next") || "/";
  const form = useForm<LoginValues>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Login realizado.");
    router.replace(nextPath);
    router.refresh();
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="login-email">E-mail</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            autoComplete="email"
            className="pl-11"
            id="login-email"
            placeholder="voce@empresa.com"
            {...form.register("email")}
          />
        </div>
        <p className="text-sm text-[var(--danger)]">
          {form.formState.errors.email?.message}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password">Senha</Label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            autoComplete="current-password"
            className="pl-11"
            id="login-password"
            type="password"
            {...form.register("password")}
          />
        </div>
        <p className="text-sm text-[var(--danger)]">
          {form.formState.errors.password?.message}
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
        Entrar
      </Button>
    </form>
  );
}
