import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Database } from "@/lib/database.types";
import { getSupabaseEnv } from "@/lib/env";

type SupportedOtpType = "email" | "invite" | "recovery";

function getConfirmationRedirect(request: NextRequest, mode: "success" | "error") {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/confirmacao";
  redirectUrl.search = "";
  redirectUrl.searchParams.set("mode", mode);
  return redirectUrl;
}

function getPasswordRedirect(request: NextRequest, mode: "invite" | "recovery") {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/definir-senha";
  redirectUrl.search = "";
  redirectUrl.searchParams.set("mode", mode);
  return redirectUrl;
}

function isSupportedOtpType(value: string | null): value is SupportedOtpType {
  return value === "email" || value === "invite" || value === "recovery";
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  if (!tokenHash || !isSupportedOtpType(type)) {
    return NextResponse.redirect(getConfirmationRedirect(request, "error"));
  }

  const redirectTo =
    type === "email"
      ? getConfirmationRedirect(request, "success")
      : getPasswordRedirect(request, type);

  const response = NextResponse.redirect(redirectTo);
  const { anonKey, url } = getSupabaseEnv();
  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, options, value }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    return NextResponse.redirect(getConfirmationRedirect(request, "error"));
  }

  return response;
}
