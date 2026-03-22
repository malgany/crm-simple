type AuthErrorLike = {
  message?: string;
};

const EXPECTED_NO_SESSION_PATTERNS = [
  "auth session missing",
  "invalid refresh token",
  "refresh token not found",
  "session from session_id claim in jwt does not exist",
];

export function getAuthErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return "";
  }

  const message = (error as AuthErrorLike).message;
  return typeof message === "string" ? message : "";
}

export function isExpectedNoSessionAuthError(error: unknown) {
  const message = getAuthErrorMessage(error).trim().toLowerCase();

  return EXPECTED_NO_SESSION_PATTERNS.some((pattern) => message.includes(pattern));
}

export function isSupabaseAuthCookie(name: string) {
  return (
    name.includes("-auth-token") ||
    name.includes("-code-verifier") ||
    name.includes("supabase-auth-token")
  );
}
