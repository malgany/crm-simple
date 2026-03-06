import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/negociacoes");
  }

  return (
    <main className="grid min-h-screen gap-8 px-4 py-8 md:grid-cols-[1.15fr_0.85fr] md:px-8 md:py-10">
      <section className="surface-shadow grid-pattern relative overflow-hidden rounded-[2rem] border border-white/60 bg-[radial-gradient(circle_at_top_left,rgba(20,94,99,0.16),transparent_38%),linear-gradient(180deg,#fbfaf5_0%,#f5f1e8_100%)] p-8 md:p-12">
        <div className="max-w-xl space-y-8">
          <span className="inline-flex rounded-full border border-emerald-900/10 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
            CRM Kanban Simplificado
          </span>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-950 md:text-6xl">
              Atendimento enxuto para lembrar o contexto e agir rapido.
            </h1>
            <p className="max-w-lg text-base leading-7 text-slate-700 md:text-lg">
              Organize leads em etapas, mova negociacoes no Kanban e abra
              WhatsApp, telefone ou e-mail sem copiar nada.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="surface-shadow rounded-[1.75rem] border border-white/60 bg-white/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Etapas
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">4+</p>
              <p className="mt-1 text-sm text-slate-600">Configuraveis</p>
            </div>
            <div className="surface-shadow rounded-[1.75rem] border border-white/60 bg-white/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Contexto
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">1000</p>
              <p className="mt-1 text-sm text-slate-600">caracteres por nota</p>
            </div>
            <div className="surface-shadow rounded-[1.75rem] border border-white/60 bg-white/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Deploy
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                Vercel
              </p>
              <p className="mt-1 text-sm text-slate-600">Serverless</p>
            </div>
          </div>
        </div>
      </section>
      <section className="flex items-center justify-center">
        <div className="surface-shadow w-full max-w-md rounded-[2rem] border border-white/60 bg-white/95 p-6 md:p-8">
          <div className="mb-6 space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
              Acesso
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Entrar no CRM
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              As contas deste MVP sao provisionadas manualmente no Supabase
              Auth.
            </p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
