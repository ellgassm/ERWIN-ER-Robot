import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getPublicConfig, hasPublicSupabaseConfig } from "@/config/public";

let client: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const { supabaseUrl, supabaseAnonKey } = getPublicConfig();
  if (!hasPublicSupabaseConfig({ supabaseUrl, supabaseAnonKey })) {
    throw new Error("Vite Supabase configuration is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart Vite.");
  }

  client = createClient(supabaseUrl, supabaseAnonKey);
  return client;
}
