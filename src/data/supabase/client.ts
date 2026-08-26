import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getPublicConfig } from "@/config/public";

let client: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const { supabaseUrl, supabaseAnonKey } = getPublicConfig();
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase client configuration is missing.");
  }

  client = createClient(supabaseUrl, supabaseAnonKey);
  return client;
}
