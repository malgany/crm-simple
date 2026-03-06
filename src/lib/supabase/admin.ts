import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getSupabaseServiceEnv } from "@/lib/env";

let adminClient: ReturnType<typeof createClient<Database>> | undefined;

export function createAdminSupabaseClient() {
  if (!adminClient) {
    const { serviceRoleKey, url } = getSupabaseServiceEnv();
    adminClient = createClient<Database>(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}
