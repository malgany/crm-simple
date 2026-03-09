import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { getHomeDestination, getAppContext } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function SignupPage() {
  const context = await getAppContext();

  if (context) {
    redirect(await getHomeDestination());
  }

  return (
    <AuthCard
      description="O cadastro publico foi desativado. Novos acessos sao criados pelo superadmin ou pelo admin da empresa."
      eyebrow="Acesso"
      footer={
        <p>
          Já tem acesso?{" "}
          <Link className="font-semibold text-[var(--primary)]" href="/login">
            Entrar
          </Link>
        </p>
      }
      title="Cadastro desativado"
    >
      <Button asChild className="w-full" size="lg">
        <Link href="/login">Voltar ao login</Link>
      </Button>
    </AuthCard>
  );
}
