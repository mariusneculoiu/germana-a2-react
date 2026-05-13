// ============================================================
// Supabase client - reads VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY
// from Vite env at build time.
//
// The PUBLISHABLE key is the anon key - it is meant to be public.
// Actual secrets (like LOVABLE_API_KEY) live as Edge Function secrets
// on the Supabase server side.
// ============================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

let _client: SupabaseClient | null = null;

/** Returns a Supabase client if config is present, else null. */
export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  _client = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false, // no auth needed for our usecase
      autoRefreshToken: false,
    },
  });
  return _client;
}

/** Whether Supabase is configured. */
export function hasSupabase(): boolean {
  return !!(SUPABASE_URL && SUPABASE_KEY);
}
