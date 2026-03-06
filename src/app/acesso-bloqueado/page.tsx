import { AuthCard } from "@/components/auth/auth-card";
import { SignOutButton } from "@/components/auth/signout-button";

export default function BlockedAccessPage() {
  return (
    <AuthCard
      description="Este usuario ou a empresa vinculada estao inativos. O acesso ao CRM permanece bloqueado ate reativacao por um administrador."
      eyebrow="Bloqueado"
      title="Acesso indisponivel"
    >
      <div className="rounded-[1.75rem] border border-[rgba(185,56,47,0.2)] bg-[rgba(185,56,47,0.08)] p-5 text-sm leading-6 text-slate-700">
        Se voce acredita que isso e um erro, procure o admin da sua empresa ou o superadmin do sistema.
      </div>
      <SignOutButton className="w-full" label="Sair desta sessao" />
    </AuthCard>
  );
}
