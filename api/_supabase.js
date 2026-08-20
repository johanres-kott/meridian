/* global process */
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

/**
 * Service role-klient som går förbi RLS — för webhookar och betrodda
 * server-läsningar (premium_subscriptions m.fl.). Samma env-variabel som
 * cronjobben använder. Returnerar null om nyckeln saknas; anroparen avgör
 * om det är ett hårt fel eller om anon-klienten duger som fallback.
 */
export function getServiceSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !serviceKey) return null;
  return createClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false } });
}

export { SUPABASE_URL, SUPABASE_ANON_KEY };
