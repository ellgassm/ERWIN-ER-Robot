export interface ServerConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}

/** Reads trusted server configuration. This module must never be imported by `src/`. */
export function getServerConfig(env: Record<string, string | undefined>): ServerConfig {
  return {
    supabaseUrl: env.SUPABASE_URL ?? "",
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  };
}
