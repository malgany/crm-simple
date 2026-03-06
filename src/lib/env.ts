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

export function getAppEnv() {
  return {
    superadminEmail: assertEnv(
      "CRM_SUPERADMIN_EMAIL",
      process.env.CRM_SUPERADMIN_EMAIL,
    ).trim().toLowerCase(),
  };
}

export function getSiteLeadIntegrationEnv() {
  return {
    companyId: assertEnv(
      "CRM_SITE_LEADS_COMPANY_ID",
      process.env.CRM_SITE_LEADS_COMPANY_ID,
    ),
    stageId: getOptionalEnv(process.env.CRM_SITE_LEADS_STAGE_ID),
    token: assertEnv("CRM_SITE_LEADS_TOKEN", process.env.CRM_SITE_LEADS_TOKEN),
  };
}
