// Server-only SQLite client using Node.js' built-in `node:sqlite` module.
// This intentionally avoids native npm SQLite addons (such as better-sqlite3),
// so Hostinger does not need a matching prebuilt binary or GLIBC version.
//
// Requires Node.js 24+.
// The connection is process-local and synchronous, matching the previous synchronous access pattern. SQLite itself provides file locking/WAL.

import { existsSync, mkdirSync } from "node:fs"
import path from "node:path"
import { DatabaseSync } from "node:sqlite"
import { SCHEMA_SQL } from "@/lib/db/schema"

const DATA_DIR = path.join(process.cwd(), "data")
const DB_PATH = path.join(DATA_DIR, "visualizer.db")

function createConnection(): DatabaseSync {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })

  const connection = new DatabaseSync(DB_PATH, {
    timeout: 5000,
    enableForeignKeyConstraints: true,
  })

  connection.exec("PRAGMA journal_mode = WAL")
  connection.exec("PRAGMA synchronous = NORMAL")
  connection.exec(SCHEMA_SQL)
  return connection
}

// Next.js dev mode can re-evaluate this module on hot reload; stash the
// singleton on globalThis (Node runtime only, never Edge) so a reload does
// not open a second connection to the same WAL-mode file.
const globalForDb = globalThis as unknown as { __visualizerDb?: DatabaseSync }

export const db: DatabaseSync = globalForDb.__visualizerDb ?? createConnection()

if (process.env.NODE_ENV !== "production") {
  globalForDb.__visualizerDb = db
}

/**
 * Execute a synchronous SQLite transaction.
 *
 * BEGIN IMMEDIATE reserves the write lock before quota checks, preserving the
 * atomic check-and-reserve behavior of the previous synchronous SQLite transaction.
 */
export function withTransaction<T>(database: DatabaseSync, fn: () => T): T {
  database.exec("BEGIN IMMEDIATE")
  try {
    const result = fn()
    database.exec("COMMIT")
    return result
  } catch (error) {
    try {
      database.exec("ROLLBACK")
    } catch {
      // Preserve the original database/application error.
    }
    throw error
  }
}
