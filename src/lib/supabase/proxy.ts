import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { getSupabaseEnv } from "@/lib/env";
import {
  getAuthErrorMessage,
  isExpectedNoSessionAuthError,
  isSupabaseAuthCookie,
} from "@/lib/supabase/auth-errors";

const protectedPrefixes = ["/admin", "/negociacoes", "/usuarios", "/acesso-bloqueado"];
const authRedirectPaths = new Set(["/login", "/cadastro"]);

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function clearInvalidAuthCookies(request: NextRequest, response: NextResponse) {
  for (const { name } of request.cookies.getAll()) {
    if (!isSupabaseAuthCookie(name)) {
      continue;
    }

    request.cookies.delete(name);
    response.cookies.set(name, "", {
      expires: new Date(0),
      maxAge: 0,
      path: "/",
    });
  }
}

export async function updateSession(request: NextRequest) {
  const { anonKey, url } = getSupabaseEnv();
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, options, value }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  let user = null;
  const {
    data,
    error,
  } = await supabase.auth.getUser();
  user = data.user;

  if (error) {
    if (isExpectedNoSessionAuthError(error)) {
      clearInvalidAuthCookies(request, response);
      user = null;
    } else {
      console.error("Auth error in updateSession:", getAuthErrorMessage(error));
    }
  }

  const pathname = request.nextUrl.pathname;

  if (!user && isProtectedPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && authRedirectPaths.has(pathname)) {
    const appUrl = request.nextUrl.clone();
    appUrl.pathname = "/";
    appUrl.search = "";
    return NextResponse.redirect(appUrl);
  }

  return response;
}
