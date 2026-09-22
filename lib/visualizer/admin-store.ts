// Simple admin dashboard persistence — which provider is active, and a log of
// recent generation attempts (for the "recent generations" list + the warning
// banner when the active provider starts failing). Deliberately flat JSON
// files rather than a database: this project has no DB today, and a dashboard
// for switching one setting and listing recent attempts doesn't need one.
//
// Server-only. Never imported by a client component.

import { chmod, mkdir, readFile, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"
import type { VisualizerOptions } from "@/lib/visualizer/options"

const scryptAsync = promisify(scrypt)

const DATA_DIR = path.join(process.cwd(), "data")
const CONFIG_PATH = path.join(DATA_DIR, "visualizer-config.json")
const LOG_PATH = path.join(DATA_DIR, "generations.json")
const SECRETS_PATH = path.join(DATA_DIR, "visualizer-secrets.json")

export const AVAILABLE_PROVIDERS = ["mock", "huggingface"] as const
export type ProviderId = (typeof AVAILABLE_PROVIDERS)[number]

const DEFAULT_PROVIDER: ProviderId = "mock"

export interface GenerationLogEntry {
  requestId: string
  createdAt: string
  provider: ProviderId
  status: "success" | "error" | "timeout"
  imageUrl: string | null
  errorMessage: string | null
  options: VisualizerOptions
}

const MAX_LOG_ENTRIES = 200

async function ensureDataDir(): Promise<void> {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true })
}

// ---------------------------------------------------------------------------
// Active provider config
// ---------------------------------------------------------------------------

export async function getActiveProvider(): Promise<ProviderId> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf8")
    const parsed = JSON.parse(raw) as { provider?: unknown }
    if (typeof parsed.provider === "string" && (AVAILABLE_PROVIDERS as readonly string[]).includes(parsed.provider)) {
      return parsed.provider as ProviderId
    }
  } catch {
    // No config file yet, or it's malformed — fall through to the default.
  }
  // Falls back to the env var used during the initial test wiring, then "mock".
  const envDefault = process.env.VISUALIZER_PROVIDER
  if (envDefault && (AVAILABLE_PROVIDERS as readonly string[]).includes(envDefault)) return envDefault as ProviderId
  return DEFAULT_PROVIDER
}

export async function setActiveProvider(provider: ProviderId): Promise<void> {
  await ensureDataDir()
  await writeFile(CONFIG_PATH, JSON.stringify({ provider }, null, 2), "utf8")
}

// ---------------------------------------------------------------------------
// Generation log
// ---------------------------------------------------------------------------

async function readLog(): Promise<GenerationLogEntry[]> {
  try {
    const raw = await readFile(LOG_PATH, "utf8")
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function appendGenerationLogEntry(entry: GenerationLogEntry): Promise<void> {
  await ensureDataDir()
  const existing = await readLog()
  // Newest first; capped so the log file can't grow without bound.
  const next = [entry, ...existing].slice(0, MAX_LOG_ENTRIES)
  await writeFile(LOG_PATH, JSON.stringify(next, null, 2), "utf8")
}

export async function getRecentGenerations(limit: number = 30): Promise<GenerationLogEntry[]> {
  const all = await readLog()
  return all.slice(0, limit)
}

export async function getLatestGeneration(): Promise<GenerationLogEntry | null> {
  const all = await readLog()
  return all[0] ?? null
}

// ---------------------------------------------------------------------------
// Provider API credentials — editable from the dashboard instead of only via
// .env.local. Stored on disk (data/visualizer-secrets.json, 0600, gitignored
// via /data/) rather than in-memory: a real value must survive a server
// restart the same way an env var would. Full values are written here but
// NEVER returned by getMaskedCredentials() below — only a masked preview.
// ---------------------------------------------------------------------------

export type CredentialKey = "hfToken"
export const CREDENTIAL_KEYS: readonly CredentialKey[] = ["hfToken"]

interface SecretsFile {
  hfToken?: string
  // Never the plaintext password — scrypt hash + its own random salt, hex-encoded.
  adminPasswordHash?: string
  adminPasswordSalt?: string
}

async function readSecrets(): Promise<SecretsFile> {
  try {
    const raw = await readFile(SECRETS_PATH, "utf8")
    const parsed = JSON.parse(raw)
    return typeof parsed === "object" && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

async function writeSecrets(secrets: SecretsFile): Promise<void> {
  await ensureDataDir()
  await writeFile(SECRETS_PATH, JSON.stringify(secrets, null, 2), "utf8")
  // Best-effort: restrict to owner-read/write, same as the POC .env files.
  // Ignored on platforms/filesystems where chmod isn't meaningful.
  try {
    await chmod(SECRETS_PATH, 0o600)
  } catch {
    // Not fatal — the file is already outside the public/ and gitignored.
  }
}

// Returns the effective HF token: a dashboard-set value takes precedence over
// the .env.local value, so updating it from /admin works without a restart.
export async function getHfToken(): Promise<string | undefined> {
  const secrets = await readSecrets()
  return secrets.hfToken || process.env.HF_TOKEN
}

export async function setHfToken(value: string): Promise<void> {
  const secrets = await readSecrets()
  secrets.hfToken = value
  await writeSecrets(secrets)
}

function maskSecret(value: string): string {
  if (value.length <= 4) return "••••"
  return `••••${value.slice(-4)}`
}

// Safe to send to the browser: never the real value, only whether one is set
// (and if so, which source — dashboard override vs. .env.local) and a masked
// last-4-chars preview.
export async function getCredentialStatus(): Promise<{
  hfToken: { configured: boolean; source: "dashboard" | "env" | "none"; masked: string | null }
}> {
  const secrets = await readSecrets()
  if (secrets.hfToken) {
    return { hfToken: { configured: true, source: "dashboard", masked: maskSecret(secrets.hfToken) } }
  }
  if (process.env.HF_TOKEN) {
    return { hfToken: { configured: true, source: "env", masked: maskSecret(process.env.HF_TOKEN) } }
  }
  return { hfToken: { configured: false, source: "none", masked: null } }
}

// ---------------------------------------------------------------------------
// Admin password — changeable from the dashboard instead of only via
// ADMIN_PASSWORD in .env.local (which most hosts, including Hostinger's
// panel-managed env vars, don't let the running app rewrite or hot-reload
// anyway). Same "dashboard value takes precedence, env is the bootstrap
// fallback" convention as the HF token above. Only a scrypt hash + salt is
// ever stored — never the plaintext password, unlike hfToken above (a
// third-party API credential, not the credential that gates this dashboard
// itself, so it gets the stronger treatment).
// ---------------------------------------------------------------------------

const SCRYPT_KEYLEN = 64

async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = randomBytes(16)
  const derived = (await scryptAsync(password, salt, SCRYPT_KEYLEN)) as Buffer
  return { hash: derived.toString("hex"), salt: salt.toString("hex") }
}

export async function setAdminPassword(newPassword: string): Promise<void> {
  const secrets = await readSecrets()
  const { hash, salt } = await hashPassword(newPassword)
  secrets.adminPasswordHash = hash
  secrets.adminPasswordSalt = salt
  await writeSecrets(secrets)
}

export async function hasAdminPasswordOverride(): Promise<boolean> {
  const secrets = await readSecrets()
  return !!(secrets.adminPasswordHash && secrets.adminPasswordSalt)
}

// Constant-time in both branches (dashboard-hash and env-fallback) — a login
// endpoint is exactly the kind of place a timing side-channel matters.
export async function verifyAdminPassword(candidate: string): Promise<boolean> {
  const secrets = await readSecrets()
  if (secrets.adminPasswordHash && secrets.adminPasswordSalt) {
    const salt = Buffer.from(secrets.adminPasswordSalt, "hex")
    const expected = Buffer.from(secrets.adminPasswordHash, "hex")
    const got = (await scryptAsync(candidate, salt, SCRYPT_KEYLEN)) as Buffer
    return expected.length === got.length && timingSafeEqual(expected, got)
  }
  const envPassword = process.env.ADMIN_PASSWORD
  if (!envPassword) return false
  const envBuf = Buffer.from(envPassword)
  const candidateBuf = Buffer.from(candidate)
  return envBuf.length === candidateBuf.length && timingSafeEqual(envBuf, candidateBuf)
}
