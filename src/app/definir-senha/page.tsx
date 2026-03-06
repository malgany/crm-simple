import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { SetPasswordForm } from "@/components/auth/set-password-form";
import { Button } from "@/components/ui/button";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PasswordMode = "invite" | "recovery";

type SetPasswordPageProps = {
  searchParams: Promise<{
    mode?: string | string[];
  }>;
};

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getPasswordMode(value: string | undefined): PasswordMode | null {
  if (value === "invite" || value === "recovery") {
    return value;
  }

  return null;
}

export default async function SetPasswordPage({
  searchParams,
}: SetPasswordPageProps) {
  const params = await searchParams;
  const mode = getPasswordMode(getSearchParam(params.mode));
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!mode || !user) {
    return (
      <AuthCard
        description="Esse link nao pode mais ser usado para criar ou redefinir senha."
        eyebrow="Acesso"
        footer={
          <p>
            Precisa de um novo link?{" "}
            <Link className="font-semibold text-[var(--primary)]" href="/login">
              Voltar ao login
            </Link>
          </p>
        }
        title="Link invalido ou expirado"
      >
        <div className="rounded-[1.75rem] border border-[rgba(185,56,47,0.2)] bg-[rgba(185,56,47,0.08)] p-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(185,56,47,0.2)] bg-white/80 text-[var(--danger)]">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Abra novamente o e-mail recebido ou solicite um novo convite para obter uma sessao valida.
          </p>
        </div>
        <Button asChild className="w-full" size="lg" variant="outline">
          <Link href="/confirmacao?mode=error">Ver status da confirmacao</Link>
        </Button>
      </AuthCard>
    );
  }

  const description =
    mode === "invite"
      ? `Finalize o convite definindo a senha de acesso para ${user.email ?? "sua conta"}.`
      : `Defina uma nova senha para ${user.email ?? "sua conta"} e volte ao CRM.`;

  return (
    <AuthCard
      description={description}
      eyebrow={mode === "invite" ? "Convite" : "Recuperacao"}
      title={mode === "invite" ? "Criar senha" : "Redefinir senha"}
    >
      <SetPasswordForm mode={mode} />
    </AuthCard>
  );
}
