import path from "node:path"
import { fileURLToPath } from "node:url"
import { mkdirSync, existsSync } from "node:fs"
import type { Database } from "better-sqlite3"
import DatabaseConstructor from "better-sqlite3"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let dbInstance: Database | null = null

function getDbPath(): string {
  const fromEnv = process.env.DATABASE_PATH
  if (fromEnv) {
    if (fromEnv === ":memory:") return fromEnv
    return path.isAbsolute(fromEnv) ? fromEnv : path.join(process.cwd(), fromEnv)
  }
  return path.join(__dirname, "..", "data", "tasks.db")
}

function migrateSortOrder(db: Database) {
  const rows = db.prepare("PRAGMA table_info(tasks)").all() as { name: string }[]
  if (!rows.some((c) => c.name === "sort_order")) {
    db.exec("ALTER TABLE tasks ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0")
  }
}

function openDb(): Database {
  const dbPath = getDbPath()
  if (dbPath !== ":memory:") {
    const dir = path.dirname(dbPath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
  }
  const db = new DatabaseConstructor(dbPath)
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK (status IN ('todo', 'in-progress', 'done')),
      priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
      created_at TEXT NOT NULL
    );
  `)
  migrateSortOrder(db)
  return db
}

export function getDb(): Database {
  if (!dbInstance) {
    dbInstance = openDb()
  }
  return dbInstance
}

/** For tests: reset the singleton after changing DATABASE_PATH. */
export function __resetDbForTests(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}
