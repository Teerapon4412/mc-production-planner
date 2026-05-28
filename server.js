import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;
const dataFile = path.join(__dirname, "app-data.json");
const publicDir = path.join(__dirname, "public");

app.use(express.json({ limit: "10mb" }));

const pool = process.env.DATABASE_URL
  ? new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined
    })
  : null;
const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasSupabase = Boolean(supabaseUrl && supabaseKey);

async function supabaseRequest(pathname, options = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${pathname}`, {
    ...options,
    headers: {
      apikey: supabaseKey,
      authorization: `Bearer ${supabaseKey}`,
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase request failed ${response.status}: ${text}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

async function initDb() {
  if (!pool) return;
  await pool.query(`
    create table if not exists planner_kv (
      key text primary key,
      value jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);
}

async function readLocalStore() {
  try {
    return JSON.parse(await fs.readFile(dataFile, "utf8"));
  } catch {
    return { state: null, history: [] };
  }
}

async function writeLocalStore(store) {
  await fs.writeFile(dataFile, JSON.stringify(store, null, 2), "utf8");
}

async function getValue(key, fallback) {
  if (pool) {
    const result = await pool.query("select value from planner_kv where key = $1", [key]);
    return result.rows[0]?.value ?? fallback;
  }
  if (hasSupabase) {
    const rows = await supabaseRequest(`planner_kv?key=eq.${encodeURIComponent(key)}&select=value`);
    return rows[0]?.value ?? fallback;
  }
  const store = await readLocalStore();
  return store[key] ?? fallback;
}

async function setValue(key, value) {
  if (pool) {
    await pool.query(
      `insert into planner_kv (key, value, updated_at)
       values ($1, $2, now())
       on conflict (key) do update set value = excluded.value, updated_at = now()`,
      [key, JSON.stringify(value)]
    );
    return;
  }
  if (hasSupabase) {
    await supabaseRequest("planner_kv", {
      method: "POST",
      headers: { prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ key, value, updated_at: new Date().toISOString() })
    });
    return;
  }
  const store = await readLocalStore();
  store[key] = value;
  await writeLocalStore(store);
}

app.get("/api/state", async (_req, res) => {
  res.json(await getValue("state", null));
});

app.put("/api/state", async (req, res) => {
  await setValue("state", req.body ?? null);
  res.json({ ok: true });
});

app.get("/api/history", async (_req, res) => {
  res.json(await getValue("history", []));
});

app.post("/api/history", async (req, res) => {
  const items = await getValue("history", []);
  const item = req.body;
  const next = [item, ...items.filter((x) => x.id !== item.id)].slice(0, 100);
  await setValue("history", next);
  res.json(item);
});

app.delete("/api/history/:id", async (req, res) => {
  const items = await getValue("history", []);
  const next = items.filter((x) => x.id !== req.params.id);
  await setValue("history", next);
  res.json({ ok: true });
});

app.use(express.static(publicDir));
app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "mc-production-planner.html"));
});

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`MC Production Planner running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
