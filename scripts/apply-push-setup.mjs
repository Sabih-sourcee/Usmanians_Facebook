/**
 * Apply push_subscriptions migration + configure webhook secret GUC / vault.
 * Reads .env.local + .env.push.local
 *
 *   node scripts/apply-push-setup.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
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
  ...loadEnvFile(".env.example"),
  ...loadEnvFile(".env.local"),
  ...loadEnvFile(".env.push.local"),
  ...process.env,
};

const projectRef = env.SUPABASE_PROJECT_REF || "nwygelibbklfvgnfmtrd";
const password = env.SUPABASE_DB_PASSWORD || env.POSTGRES_PASSWORD;
const connectionString =
  env.DATABASE_URL ||
  env.SUPABASE_DB_URL ||
  (password
    ? `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`
    : null);

if (!connectionString) {
  console.error("Missing SUPABASE_DB_PASSWORD / DATABASE_URL");
  process.exit(1);
}

if (!env.PUSH_WEBHOOK_SECRET || !(env.VAPID_PUBLIC_KEY || env.VITE_VAPID_PUBLIC_KEY) || !env.VAPID_PRIVATE_KEY) {
  console.error("Missing keys in .env.push.local — run: node scripts/generate-pwa-assets.mjs");
  process.exit(1);
}

env.VAPID_PUBLIC_KEY = env.VAPID_PUBLIC_KEY || env.VITE_VAPID_PUBLIC_KEY;

const migrationPath = resolve(
  root,
  "supabase/migrations/20260731140000_11_push_subscriptions.sql"
);
const migrationSql = readFileSync(migrationPath, "utf8");

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function ensureVaultSecret(name, value) {
  try {
    // Create secret if vault is available (Supabase Pro+ / enabled projects)
    await client.query(
      `select vault.create_secret($1::text, $2::text, $3::text)
       where not exists (
         select 1 from vault.secrets where name = $2
       )`,
      [value, name, `Usmanian ${name}`]
    );
    // Update existing
    await client.query(
      `update vault.secrets
       set secret = $1
       where name = $2`,
      [value, name]
    );
    console.log(`vault: set ${name}`);
  } catch (err) {
    console.warn(`vault unavailable for ${name}:`, err.message);
  }
}

async function main() {
  await client.connect();
  console.log("Applying push_subscriptions migration…");
  await client.query(migrationSql);
  console.log("Migration OK");

  const fnUrl = `https://${projectRef}.supabase.co/functions/v1/send-push-notification`;
  await ensureVaultSecret("push_webhook_url", fnUrl);
  await ensureVaultSecret("push_webhook_secret", env.PUSH_WEBHOOK_SECRET);

  // Session + database-level GUC fallback (may fail on hosted without privileges)
  try {
    await client.query(`select set_config('app.settings.push_webhook_secret', $1, false)`, [
      env.PUSH_WEBHOOK_SECRET,
    ]);
    console.log("set_config app.settings.push_webhook_secret OK (session)");
  } catch (err) {
    console.warn("set_config failed:", err.message);
  }

  try {
    await client.query(
      `alter database postgres set app.settings.push_webhook_secret = '${env.PUSH_WEBHOOK_SECRET.replace(/'/g, "''")}'`
    );
    console.log("alter database GUC OK");
  } catch (err) {
    console.warn("alter database GUC skipped:", err.message);
  }

  const check = await client.query(`
    select to_regclass('public.push_subscriptions') as table_name,
           exists(
             select 1 from information_schema.triggers
             where event_object_table = 'notifications'
               and trigger_name = 'trg_enqueue_push_notification'
           ) as has_trigger
  `);
  console.log("verify:", check.rows[0]);

  await client.end();

  // Deploy edge function + secrets if supabase CLI is logged in
  const accessToken = env.SUPABASE_ACCESS_TOKEN;
  if (accessToken || existsSync(resolve(process.env.USERPROFILE || "", ".supabase"))) {
    console.log("Attempting supabase functions deploy…");
    const secretArgs = [
      "secrets",
      "set",
      `VAPID_PUBLIC_KEY=${env.VAPID_PUBLIC_KEY}`,
      `VAPID_PRIVATE_KEY=${env.VAPID_PRIVATE_KEY}`,
      `VAPID_SUBJECT=${env.VAPID_SUBJECT || "mailto:admin@usmanian.app"}`,
      `PUSH_WEBHOOK_SECRET=${env.PUSH_WEBHOOK_SECRET}`,
      "--project-ref",
      projectRef,
    ];
    const secrets = spawnSync("npx", ["supabase", ...secretArgs], {
      cwd: root,
      encoding: "utf8",
      shell: true,
      env: process.env,
    });
    console.log(secrets.stdout || "");
    if (secrets.stderr) console.warn(secrets.stderr);

    const deploy = spawnSync(
      "npx",
      [
        "supabase",
        "functions",
        "deploy",
        "send-push-notification",
        "--project-ref",
        projectRef,
        "--no-verify-jwt",
      ],
      { cwd: root, encoding: "utf8", shell: true, env: process.env }
    );
    console.log(deploy.stdout || "");
    if (deploy.stderr) console.warn(deploy.stderr);
    if (deploy.status !== 0) {
      console.warn(
        "CLI deploy failed. Deploy manually:\n" +
          `  npx supabase login\n` +
          `  npx supabase functions deploy send-push-notification --project-ref ${projectRef} --no-verify-jwt\n` +
          `  npx supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... PUSH_WEBHOOK_SECRET=... --project-ref ${projectRef}`
      );
    }
  } else {
    console.warn(
      "Supabase CLI not authenticated. Migration is applied; deploy the edge function manually (see docs above)."
    );
  }
}

main().catch(async (err) => {
  console.error(err);
  try {
    await client.end();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
