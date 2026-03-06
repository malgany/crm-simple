import { CheckCircle2, MailCheck, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";

type ConfirmationMode = "pending" | "success" | "error";

type ConfirmationPageProps = {
  searchParams: Promise<{
    mode?: string | string[];
  }>;
};

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getConfirmationMode(value: string | undefined): ConfirmationMode {
  if (value === "success" || value === "error") {
    return value;
  }

  return "pending";
}

export default async function ConfirmationPage({
  searchParams,
}: ConfirmationPageProps) {
  const params = await searchParams;
  const mode = getConfirmationMode(getSearchParam(params.mode));

  const content = {
    pending: {
      actionHref: "/login",
      actionLabel: "Voltar ao login",
      description:
        "Enviamos um link de confirmacao para o seu e-mail. Abra a mensagem e finalize o cadastro pelo botao recebido.",
      eyebrow: "Cadastro",
      icon: <MailCheck className="h-6 w-6 text-[var(--primary)]" />,
      iconClassName:
        "border-[var(--border)] bg-[rgba(20,94,99,0.08)] text-[var(--primary)]",
      title: "Confira seu e-mail",
    },
    success: {
      actionHref: "/negociacoes",
      actionLabel: "Entrar no CRM",
      description:
        "Seu e-mail foi confirmado e a sessao ja foi validada. Agora voce pode continuar para o CRM.",
      eyebrow: "Confirmacao",
      icon: <CheckCircle2 className="h-6 w-6 text-[var(--primary)]" />,
      iconClassName:
        "border-[var(--border)] bg-[rgba(20,94,99,0.08)] text-[var(--primary)]",
      title: "Tudo certo",
    },
    error: {
      actionHref: "/login",
      actionLabel: "Ir para o login",
      description:
        "O link de confirmacao esta invalido ou expirou. Solicite um novo convite ou refaca o cadastro para receber outro e-mail.",
      eyebrow: "Confirmacao",
      icon: <TriangleAlert className="h-6 w-6 text-[var(--danger)]" />,
      iconClassName:
        "border-[rgba(185,56,47,0.2)] bg-[rgba(185,56,47,0.08)] text-[var(--danger)]",
      title: "Nao foi possivel confirmar",
    },
  }[mode];

  return (
    <AuthCard
      description={content.description}
      eyebrow={content.eyebrow}
      footer={
        mode === "error" ? (
          <p>
            Precisa tentar de novo?{" "}
            <Link className="font-semibold text-[var(--primary)]" href="/cadastro">
              Criar conta novamente
            </Link>
          </p>
        ) : null
      }
      title={content.title}
    >
      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--card)] p-5 text-center">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border ${content.iconClassName}`}
        >
          {content.icon}
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          {mode === "pending"
            ? "Se o e-mail nao aparecer em alguns minutos, verifique spam ou lixo eletronico."
            : mode === "success"
              ? "A confirmacao foi processada sem expor tokens na URL final."
              : "Links de invite e recuperacao tambem devem cair aqui quando estiverem expirados."}
        </p>
      </div>
      <Button asChild className="w-full" size="lg">
        <Link href={content.actionHref}>{content.actionLabel}</Link>
      </Button>
    </AuthCard>
  );
}
