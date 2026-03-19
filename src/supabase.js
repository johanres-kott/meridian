import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://acostgikldxkdmcoavkf.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjb3N0Z2lrbGR4a2RtY29hdmtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNDUzMTgsImV4cCI6MjA4ODcyMTMxOH0.lgIR-b3FpyTaO5Aa9SPnUHl-gyy5hloBvMTmnOfSLpw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
