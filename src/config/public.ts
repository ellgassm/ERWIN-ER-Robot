export interface PublicConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export function getPublicConfig(env: ImportMetaEnv = import.meta.env): PublicConfig {
  return {
    supabaseUrl: env.VITE_SUPABASE_URL ?? "",
    supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY ?? "",
  };
}

export function hasPublicSupabaseConfig(config: PublicConfig): boolean {
  return Boolean(config.supabaseUrl && config.supabaseAnonKey);
}
