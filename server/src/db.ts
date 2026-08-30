import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '..', '..', 'builder.sqlite');

export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS pages (
    id         TEXT PRIMARY KEY,
    name       TEXT UNIQUE NOT NULL,
    slug       TEXT UNIQUE NOT NULL,
    parent_id  TEXT,
    "order"    INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (parent_id) REFERENCES pages(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS rows (
    id       TEXT PRIMARY KEY,
    page_id  TEXT NOT NULL,
    columns  INTEGER NOT NULL CHECK (columns IN (1, 2)),
    position INTEGER NOT NULL,
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS fields (
    id                  TEXT PRIMARY KEY,
    row_id              TEXT NOT NULL,
    type                TEXT NOT NULL CHECK (type IN ('input','textarea','dropdown','radio','image','button')),
    label               TEXT NOT NULL,
    required            INTEGER DEFAULT 0,
    placeholder         TEXT,
    options             TEXT,
    option_list_id      TEXT,
    global_template_id  TEXT,
    position            INTEGER NOT NULL,
    link_type           TEXT,
    link_target_page_id TEXT,
    link_url            TEXT,
    link_action         TEXT,
    link_open_in        TEXT,
    input_mode          TEXT CHECK (input_mode IN (NULL,'numeric','alphabet','alphanumeric')),
    FOREIGN KEY (row_id)              REFERENCES rows(id) ON DELETE CASCADE,
    FOREIGN KEY (link_target_page_id) REFERENCES pages(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS option_lists (
    id       TEXT PRIMARY KEY,
    page_id  TEXT NOT NULL,
    name     TEXT NOT NULL,
    position INTEGER NOT NULL,
    options  TEXT NOT NULL DEFAULT '[]',
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    UNIQUE (page_id, name)
  );

  CREATE TABLE IF NOT EXISTS global_templates (
    id       TEXT PRIMARY KEY,
    name     TEXT UNIQUE NOT NULL,
    type     TEXT NOT NULL,
    options  TEXT NOT NULL DEFAULT '[]',
    input_mode TEXT,
    created_at TEXT NOT NULL
  );
`);

// Migration: ensure global_templates table exists on older builds.
db.exec(`
  CREATE TABLE IF NOT EXISTS global_templates (
    id       TEXT PRIMARY KEY,
    name     TEXT UNIQUE NOT NULL,
    type     TEXT NOT NULL,
    options  TEXT NOT NULL DEFAULT '[]',
    input_mode TEXT,
    created_at TEXT NOT NULL
  );
`);

// Migration: add global_template_id column to fields if missing.
const hasGlobalTemplateId = db
  .prepare("PRAGMA table_info(fields)")
  .all()
  .some((col: any) => col.name === 'global_template_id');
if (!hasGlobalTemplateId) {
  db.exec('ALTER TABLE fields ADD COLUMN global_template_id TEXT');
}

// Migration: add input_mode column to global_templates if missing.
const hasGtInputMode = db
  .prepare("PRAGMA table_info(global_templates)")
  .all()
  .some((col: any) => col.name === 'input_mode');
if (!hasGtInputMode) {
  db.exec("ALTER TABLE global_templates ADD COLUMN input_mode TEXT");
}
