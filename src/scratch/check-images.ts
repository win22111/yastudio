import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Manually parse .env file
const envPath = path.resolve(process.cwd(), ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
envContent.split("\n").forEach(line => {
  const match = line.match(/^\s*([^#=]+)\s*=\s*["']?(.*?)["']?\s*$/);
  if (match) {
    env[match[1]] = match[2].trim();
  }
});

const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY in parsed env:", env);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  global: {
    headers: {},
  }
});

async function main() {
  const { data: products } = await supabase.from("products").select("id, name_en, image_url");
  const { data: barbers } = await supabase.from("barbers").select("id, name_en, photo_url");
  const { data: portfolio } = await supabase.from("portfolio_items").select("id, title_en, url");

  console.log("=== Products ===");
  products?.forEach(p => console.log(`Product ${p.id} (${p.name_en}): ${p.image_url}`));

  console.log("\n=== Barbers ===");
  barbers?.forEach(b => console.log(`Barber ${b.id} (${b.name_en}): ${b.photo_url}`));

  console.log("\n=== Portfolio Items ===");
  portfolio?.forEach(p => console.log(`Portfolio ${p.id} (${p.title_en}): ${p.url}`));
}

main().catch(console.error);
