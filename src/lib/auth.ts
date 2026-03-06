import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { CompanySummary, ViewerSession } from "@/lib/app.types";
import type { TableRow } from "@/lib/database.types";
import { getAppEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type MembershipRow = TableRow<"company_users">;
type CompanyRow = TableRow<"companies">;

export type CompanyRole = Exclude<ViewerSession["role"], "superadmin">;

export type AppContext = {
  company: CompanySummary | null;
  companyContext: boolean;
  effectiveCompanyRole: CompanyRole | null;
  isBlocked: boolean;
  membership: MembershipRow | null;
  user: User;
  viewer: ViewerSession;
};

export class AppHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

function toCompanySummary(company: CompanyRow): CompanySummary {
  return {
    id: company.id,
    name: company.name,
    status: company.status,
  };
}

function buildViewer(user: User, membership: MembershipRow | null, company: CompanyRow | null): ViewerSession {
  const isSuperadmin = normalizeEmail(user.email) === getAppEnv().superadminEmail;

  if (isSuperadmin) {
    return {
      company: company ? toCompanySummary(company) : null,
      companyContext: !!company,
      companyId: company?.id ?? null,
      companyName: company?.name ?? null,
      email: user.email ?? "",
      id: user.id,
      isSuperadmin: true,
      name:
        (typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim()) ||
        user.email ||
        "Superadmin",
      role: "superadmin",
      status: "active",
    };
  }

  return {
    company: company ? toCompanySummary(company) : null,
    companyContext: !!company,
    companyId: company?.id ?? membership?.company_id ?? null,
    companyName: company?.name ?? null,
    email: user.email ?? membership?.email ?? "",
    id: user.id,
    isSuperadmin: false,
    name: membership?.name ?? user.email ?? "Usuario",
    role: membership?.role ?? "member",
    status: membership?.status ?? "inactive",
  };
}

async function loadCompany(companyId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function loadMembership(userId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("company_users")
    .select("*")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getAppContext(options?: {
  companyId?: string | null;
}): Promise<AppContext | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!user) {
    return null;
  }

  const isSuperadmin = normalizeEmail(user.email) === getAppEnv().superadminEmail;

  if (isSuperadmin) {
    const company =
      options?.companyId && options.companyId.trim()
        ? await loadCompany(options.companyId)
        : null;

    if (options?.companyId && !company) {
      throw new AppHttpError(404, "Empresa nao encontrada.");
    }

    const viewer = buildViewer(user, null, company);

    return {
      company: viewer.company,
      companyContext: viewer.companyContext,
      effectiveCompanyRole: company ? "admin" : null,
      isBlocked: false,
      membership: null,
      user,
      viewer,
    };
  }

  const membership = await loadMembership(user.id);
  const company = membership ? await loadCompany(membership.company_id) : null;
  const viewer = buildViewer(user, membership, company);
  const isBlocked =
    !membership ||
    membership.status !== "active" ||
    !company ||
    company.status !== "active";

  return {
    company: viewer.company,
    companyContext: !!company,
    effectiveCompanyRole: !isBlocked ? membership?.role ?? null : null,
    isBlocked,
    membership,
    user,
    viewer,
  };
}

export async function getHomeDestination() {
  const context = await getAppContext();

  if (!context) {
    return "/login";
  }

  if (context.viewer.isSuperadmin) {
    return "/admin/empresas";
  }

  if (context.isBlocked) {
    return "/acesso-bloqueado";
  }

  return "/negociacoes";
}

export async function requirePageContext(options?: {
  companyId?: string | null;
  requireAdmin?: boolean;
  requireCompany?: boolean;
  superadminFallback?: string;
}) {
  const context = await getAppContext(options);

  if (!context) {
    redirect("/login");
  }

  if (context.isBlocked) {
    redirect("/acesso-bloqueado");
  }

  if (options?.requireCompany && !context.companyContext) {
    redirect(options.superadminFallback ?? "/admin/empresas");
  }

  if (options?.requireAdmin && context.effectiveCompanyRole !== "admin") {
    redirect("/negociacoes");
  }

  return context;
}

export async function requireSuperadminPage() {
  const context = await getAppContext();

  if (!context) {
    redirect("/login");
  }

  if (!context.viewer.isSuperadmin) {
    redirect("/negociacoes");
  }

  return context;
}

export async function requireApiContext(options?: {
  companyId?: string | null;
  requireAdmin?: boolean;
  requireCompany?: boolean;
}) {
  const context = await getAppContext(options);

  if (!context) {
    throw new AppHttpError(401, "Sessao nao encontrada.");
  }

  if (context.isBlocked) {
    throw new AppHttpError(403, "Acesso bloqueado para este usuario ou empresa.");
  }

  if (options?.requireCompany && !context.companyContext) {
    throw new AppHttpError(400, "Selecione uma empresa para continuar.");
  }

  if (options?.requireAdmin && context.effectiveCompanyRole !== "admin") {
    throw new AppHttpError(403, "Permissao insuficiente.");
  }

  return context;
}
