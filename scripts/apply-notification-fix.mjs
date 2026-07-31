/**
 * Diagnose + apply notification triggers against live Supabase Postgres.
 * Usage (PowerShell):
 *   $env:SUPABASE_DB_PASSWORD = '<db password from project settings>'
 *   node scripts/apply-notification-fix.mjs
 *
 * Or set DATABASE_URL / SUPABASE_DB_URL to a full postgres connection string.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvLocal() {
  const path = resolve(root, ".env.local");
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

const env = { ...loadEnvLocal(), ...process.env };
const projectRef = env.SUPABASE_PROJECT_REF || "nwygelibbklfvgnfmtrd";
const password = env.SUPABASE_DB_PASSWORD || env.POSTGRES_PASSWORD;
const connectionString =
  env.DATABASE_URL ||
  env.SUPABASE_DB_URL ||
  (password
    ? `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`
    : null);

if (!connectionString) {
  console.error(
    "Missing DB credentials. Set SUPABASE_DB_PASSWORD in .env.local (Project Settings → Database),\n" +
      "or DATABASE_URL to a full postgres:// connection string, then re-run."
  );
  process.exit(1);
}

const migrationPath = resolve(
  root,
  "supabase/migrations/20260731120000_10_notification_triggers_realtime.sql"
);
const migrationSql = readFileSync(migrationPath, "utf8");

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const diagnoseSql = `
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;

select event_object_table as table_name, trigger_name, action_timing, event_manipulation
from information_schema.triggers
where trigger_schema = 'public'
order by event_object_table, trigger_name;

select p.proname as function_name
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname ilike '%notif%'
order by 1;

select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
order by tablename;
`;

async function main() {
  await client.connect();
  console.log("Connected. Running diagnosis…\n");

  const tables = await client.query(`
    select table_name from information_schema.tables
    where table_schema = 'public' order by table_name`);
  console.log("TABLES:", tables.rows.map((r) => r.table_name).join(", "));

  const triggers = await client.query(`
    select event_object_table as table_name, trigger_name, action_timing, event_manipulation
    from information_schema.triggers
    where trigger_schema = 'public'
    order by 1, 2`);
  console.log("\nTRIGGERS:");
  for (const t of triggers.rows) {
    console.log(`  ${t.table_name}.${t.trigger_name} (${t.action_timing} ${t.event_manipulation})`);
  }

  const funcs = await client.query(`
    select p.proname as function_name
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname ilike '%notif%'
    order by 1`);
  console.log("\nNOTIFY FUNCS:", funcs.rows.map((r) => r.function_name).join(", ") || "(none)");

  const pub = await client.query(`
    select tablename from pg_publication_tables
    where pubname = 'supabase_realtime' order by 1`);
  console.log("\nREALTIME PUB:", pub.rows.map((r) => r.tablename).join(", ") || "(empty)");

  console.log("\nApplying migration 10…");
  await client.query(migrationSql);
  console.log("Migration applied.");

  const after = await client.query(`
    select event_object_table as table_name, trigger_name
    from information_schema.triggers
    where trigger_schema = 'public'
      and trigger_name in (
        'trg_notify_on_like',
        'trg_notify_on_comment',
        'trg_notify_on_friend_request',
        'trg_handle_friend_accept'
      )
    order by 1, 2`);
  console.log("\nVERIFY TRIGGERS:");
  for (const t of after.rows) console.log(`  OK ${t.table_name}.${t.trigger_name}`);

  const pub2 = await client.query(`
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications'`);
  console.log(
    pub2.rowCount
      ? "OK notifications is in supabase_realtime"
      : "FAIL notifications missing from supabase_realtime"
  );

  await client.end();
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
