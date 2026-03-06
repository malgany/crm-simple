import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { SignupForm } from "@/components/auth/signup-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function SignupPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/negociacoes");
  }

  return (
    <AuthCard
      description="Crie seu acesso e confirme o e-mail para entrar no CRM."
      eyebrow="Cadastro"
      footer={
        <p>
          Ja tem acesso?{" "}
          <Link className="font-semibold text-[var(--primary)]" href="/login">
            Entrar
          </Link>
        </p>
      }
      title="Criar conta"
    >
      <SignupForm />
    </AuthCard>
  );
}
