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

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function checkUrlSize(url: string) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    const sizeBytes = res.headers.get("content-length");
    const sizeMb = sizeBytes ? (parseInt(sizeBytes, 10) / (1024 * 1024)).toFixed(3) : "unknown";
    console.log(`${url} -> ${sizeMb} MB (${sizeBytes} bytes)`);
  } catch (err: any) {
    console.error(`Error checking ${url}:`, err.message);
  }
}

async function main() {
  const { data: products } = await supabase.from("products").select("image_url");
  const { data: barbers } = await supabase.from("barbers").select("photo_url");
  const { data: portfolio } = await supabase.from("portfolio_items").select("url");

  console.log("=== Checking Image Sizes ===");
  if (products) {
    for (const p of products) {
      if (p.image_url) await checkUrlSize(p.image_url);
    }
  }
  if (barbers) {
    for (const b of barbers) {
      if (b.photo_url) await checkUrlSize(b.photo_url);
    }
  }
  if (portfolio) {
    for (const p of portfolio) {
      if (p.url) await checkUrlSize(p.url);
    }
  }
}

main().catch(console.error);
