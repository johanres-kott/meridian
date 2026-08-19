import { supabase } from "../supabase.js";

// Skrivningar mot manual_assets går via vår egen API-proxy (/api/manual-assets)
// i stället för direkt mot Supabase — Safari avbröt direkta POST:ar mot
// *.supabase.co ("TypeError: Load failed"). Läsningar sker fortfarande direkt
// (de fungerar överallt och cachas inte här).

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Ingen inloggning hittades");
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function createManualAsset(payload) {
  const res = await fetch("/api/manual-assets", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

export async function deleteManualAsset(id) {
  const res = await fetch(`/api/manual-assets?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}
