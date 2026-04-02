/**
 * Shared Supabase client for API routes.
 * Reads credentials from environment variables with hardcoded fallbacks
 * for backwards compatibility.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://acostgikldxkdmcoavkf.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjb3N0Z2lrbGR4a2RtY29hdmtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNDUzMTgsImV4cCI6MjA4ODcyMTMxOH0.lgIR-b3FpyTaO5Aa9SPnUHl-gyy5hloBvMTmnOfSLpw";

export function getSupabase(options) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, options);
}

export { SUPABASE_URL, SUPABASE_ANON_KEY };
