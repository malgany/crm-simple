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
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="surface-shadow w-full max-w-md rounded-[2rem] border border-white/60 bg-white/95 p-6 md:p-8">
        <div className="mb-6 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
            Acesso
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Entrar no CRM
          </h2>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
