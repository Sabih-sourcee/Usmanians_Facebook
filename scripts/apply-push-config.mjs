/**
 * Apply migration 12 + upsert push_webhook_config row from .env.push.local
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvFile(name) {
  const path = resolve(root, name);
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

const env = {
  ...loadEnvFile(".env.local"),
  ...loadEnvFile(".env.push.local"),
  ...process.env,
};

const projectRef = env.SUPABASE_PROJECT_REF || "nwygelibbklfvgnfmtrd";
const password = env.SUPABASE_DB_PASSWORD;
const connectionString = `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`;
const secret = env.PUSH_WEBHOOK_SECRET;
const vapidPublic = env.VAPID_PUBLIC_KEY || env.VITE_VAPID_PUBLIC_KEY;
const fnUrl = `https://${projectRef}.supabase.co/functions/v1/send-push-notification`;

if (!password || !secret) {
  console.error("Need SUPABASE_DB_PASSWORD and PUSH_WEBHOOK_SECRET");
  process.exit(1);
}

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
const sql = readFileSync(
  resolve(root, "supabase/migrations/20260731143000_12_push_webhook_config.sql"),
  "utf8"
);

await client.connect();
await client.query(sql);
await client.query(
  `insert into public.push_webhook_config (id, webhook_url, webhook_secret)
   values (1, $1, $2)
   on conflict (id) do update
     set webhook_url = excluded.webhook_url,
         webhook_secret = excluded.webhook_secret,
         updated_at = now()`,
  [fnUrl, secret]
);
const row = await client.query(
  `select webhook_url, length(webhook_secret) as secret_len from public.push_webhook_config where id = 1`
);
console.log("push_webhook_config:", row.rows[0]);
await client.end();
console.log("Done. VAPID public present:", Boolean(vapidPublic));
