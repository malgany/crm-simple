function assertEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Variavel de ambiente ausente: ${name}`);
  }

  return value;
}

function getOptionalEnv(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
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

export function getSupabaseServiceEnv() {
  return {
    url: assertEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    serviceRoleKey: assertEnv(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
  };
}

export function getSiteLeadIntegrationEnv() {
  return {
    token: assertEnv("CRM_SITE_LEADS_TOKEN", process.env.CRM_SITE_LEADS_TOKEN),
    ownerUserId: assertEnv(
      "CRM_SITE_LEADS_OWNER_USER_ID",
      process.env.CRM_SITE_LEADS_OWNER_USER_ID,
    ),
    stageId: getOptionalEnv(process.env.CRM_SITE_LEADS_STAGE_ID),
  };
}
