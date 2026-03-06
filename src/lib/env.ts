function assertEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Variavel de ambiente ausente: ${name}`);
  }

  return value;
}

export function getSupabaseEnv() {
  return {
    url: assertEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: assertEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  };
}
