const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';

/**
 * Demo mode is the default. The app stays fully usable with clearly-labelled
 * mock data until real Supabase credentials are provided.
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey
);

export const env = {
  supabaseUrl,
  supabasePublishableKey,
  appUrl: import.meta.env.VITE_APP_URL?.trim() ?? '',
  isSupabaseConfigured,
} as const;
