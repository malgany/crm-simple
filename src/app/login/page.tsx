import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { getHomeDestination, getAppContext } from "@/lib/auth";

export default async function LoginPage() {
  const context = await getAppContext();

  if (context) {
    redirect(await getHomeDestination());
  }

  return (
    <AuthCard
      description="Entre com seu e-mail e senha para acessar sua empresa ou a área global."
      eyebrow="Acesso"
      footer={
        <p>
          Precisa de acesso?{" "}
          <Link className="font-semibold text-[var(--primary)]" href="/cadastro">
            Solicite ao administrador
          </Link>
        </p>
      }
      title="Entrar no CRM"
    >
      <LoginForm />
    </AuthCard>
  );
}
