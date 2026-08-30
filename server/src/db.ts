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
    position            INTEGER NOT NULL,
    link_type           TEXT,
    link_target_page_id TEXT,
    link_url            TEXT,
    link_action         TEXT,
    link_open_in        TEXT,
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
`);

// Migration: builder.sqlite may already exist with the old `fields` schema.
// CREATE TABLE IF NOT EXISTS above won't add a new column to an existing table.
const hasOptionListId = db
  .prepare("PRAGMA table_info(fields)")
  .all()
  .some((col: any) => col.name === 'option_list_id');
if (!hasOptionListId) {
  db.exec('ALTER TABLE fields ADD COLUMN option_list_id TEXT');
}
