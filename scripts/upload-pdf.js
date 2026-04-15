/**
 * Upload a PDF to Supabase Storage.
 * Usage: node scripts/upload-pdf.js <local-path> <storage-path>
 * Example: node scripts/upload-pdf.js public/analyses/ag-equipment-deep-dive.pdf ag-equipment-deep-dive.pdf
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 * (service role key bypasses RLS for storage uploads)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Load env vars
for (const envFile of [".env", ".env.local"]) {
  try {
    const lines = readFileSync(envFile, "utf-8").split("\n");
    for (const line of lines) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim();
    }
  } catch {}
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY in .env");
  console.error("The service role key is found in Supabase → Settings → API → service_role (secret)");
  process.exit(1);
}

const [localPath, storagePath] = process.argv.slice(2);
if (!localPath || !storagePath) {
  console.error("Usage: node scripts/upload-pdf.js <local-path> <storage-path>");
  process.exit(1);
}

const supabase = createClient(url, key);
const fileBuffer = readFileSync(localPath);

const { data, error } = await supabase.storage
  .from("analyses")
  .upload(storagePath, fileBuffer, {
    contentType: "application/pdf",
    upsert: true,
  });

if (error) {
  console.error("Upload failed:", error.message);
  process.exit(1);
}

console.log("Uploaded:", data.path);
console.log("\nNow update the analysis record:");
console.log(`  UPDATE analyses SET pdf_url = '${storagePath}' WHERE slug = 'ag-equipment';`);
