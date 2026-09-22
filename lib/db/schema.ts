// Visualizer quota/lead-capture database schema (SQLite, via Node.js built-in SQLite).
// Idempotent DDL — safe to run on every process start (lib/db/client.ts does so).
// No migration framework: this is a fresh table set, not an evolving legacy schema.

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS visitors (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  lead_id TEXT NULL REFERENCES leads(id),
  lead_linked_at TEXT NULL,
  last_generation_at TEXT NULL,
  ip TEXT NULL,
  user_agent TEXT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'flagged', 'blocked')),
  flag_reason TEXT NULL
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL REFERENCES visitors(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  email_raw TEXT NOT NULL,
  phone TEXT NULL,
  ip TEXT NULL,
  user_agent TEXT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_visitor ON leads(visitor_id);

CREATE TABLE IF NOT EXISTS generations (
  id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL REFERENCES visitors(id),
  lead_id TEXT NULL REFERENCES leads(id),
  is_post_lead INTEGER NOT NULL DEFAULT 0,
  provider TEXT NOT NULL,
  model TEXT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'error', 'timeout')),
  is_fallback INTEGER NOT NULL DEFAULT 0,
  is_delivered INTEGER NOT NULL DEFAULT 0,
  wood_species TEXT NULL,
  preferred_style TEXT NULL,
  options_json TEXT NOT NULL,
  input_image_ref TEXT NULL,
  output_image_ref TEXT NULL,
  error_message TEXT NULL,
  ip TEXT NULL,
  user_agent TEXT NULL,
  created_at TEXT NOT NULL,
  finalized_at TEXT NULL
);
CREATE INDEX IF NOT EXISTS idx_generations_visitor_created ON generations(visitor_id, created_at);

CREATE TABLE IF NOT EXISTS request_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id TEXT NOT NULL,
  ip TEXT NULL,
  outcome TEXT NOT NULL,
  reason TEXT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_request_events_ip_created ON request_events(ip, created_at);
`
