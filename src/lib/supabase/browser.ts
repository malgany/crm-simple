import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { getSupabaseEnv } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createBrowserSupabaseClient() {
  if (!browserClient) {
    const { anonKey, url } = getSupabaseEnv();
    browserClient = createBrowserClient<Database>(url, anonKey);
  }

  return browserClient;
}
