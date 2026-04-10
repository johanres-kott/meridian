/**
 * Shared Supabase client for API routes.
 * Reads credentials from environment variables.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables");
}

export function getSupabase(options) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, options);
}

export { SUPABASE_URL, SUPABASE_ANON_KEY };
