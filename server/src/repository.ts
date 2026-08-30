import { db } from './db.js';
import { generateId, uniqueSlug } from './slug.js';
import type {
  Page,
  PageSummary,
  Row,
  Field,
  OptionList,
  GlobalTemplate,
  LinkAction,
  LinkOpenIn,
} from './types.js';

interface PageRow {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  order: number;
}

interface RowRow {
  id: string;
  page_id: string;
  columns: number;
  position: number;
}

interface FieldRow {
  id: string;
  row_id: string;
  type: string;
  label: string;
  required: number;
  placeholder: string | null;
  options: string | null;
  option_list_id: string | null;
  global_template_id: string | null;
  position: number;
  link_type: string | null;
  link_target_page_id: string | null;
  link_url: string | null;
  link_action: string | null;
  link_open_in: string | null;
}

interface GlobalTemplateRow {
  id: string;
  name: string;
  type: string;
  options: string;
  created_at: string;
}

interface OptionListRow {
  id: string;
  page_id: string;
  name: string;
  position: number;
  options: string;
}

function mapGlobalTemplate(r: GlobalTemplateRow): GlobalTemplate {
  return {
    id: r.id,
    name: r.name,
    type: r.type as Field['type'],
    options: r.options ? (JSON.parse(r.options) as string[]) : [],
  };
}

function mapPage(r: PageRow): PageSummary {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    parentId: r.parent_id,
    order: r.order,
  };
}

function mapOptionList(r: OptionListRow): OptionList {
  return {
    id: r.id,
    name: r.name,
    position: r.position,
    options: r.options ? (JSON.parse(r.options) as string[]) : [],
  };
}

function mapField(r: FieldRow): Field {
  return {
    id: r.id,
    type: r.type as Field['type'],
    label: r.label,
    required: r.required === 1,
    placeholder: r.placeholder ?? undefined,
    options: r.options ? (JSON.parse(r.options) as string[]) : undefined,
    optionListId: r.option_list_id ?? undefined,
    globalTemplateId: r.global_template_id ?? undefined,
    link: r.link_type
      ? {
          type: r.link_type as 'page' | 'url' | 'action',
          targetPageId: r.link_target_page_id ?? undefined,
          url: r.link_url ?? undefined,
          action: r.link_action as LinkAction | undefined,
          openIn: r.link_open_in as LinkOpenIn | undefined,
        }
      : undefined,
  };
}

export const repository = {
  createGlobalTemplate(name: string, type: Field['type'], options: string[]): GlobalTemplate {
    const nameExists = db.prepare('SELECT 1 FROM global_templates WHERE name = ?').get(name);
    if (nameExists) {
      const err = new Error('NAME_TAKEN') as Error & { code?: string };
      err.code = 'NAME_TAKEN';
      throw err;
    }
    const id = generateId();
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO global_templates (id, name, type, options, created_at) VALUES (?, ?, ?, ?, ?)',
    ).run(id, name, type, JSON.stringify(options), now);
    return { id, name, type, options };
  },

  listGlobalTemplates(): GlobalTemplate[] {
    const rows = db
      .prepare('SELECT id, name, type, options, created_at FROM global_templates ORDER BY created_at')
      .all() as GlobalTemplateRow[];
    return rows.map(mapGlobalTemplate);
  },

  listPages(): PageSummary[] {
    const rows = db
      .prepare('SELECT id, name, slug, parent_id, "order" FROM pages ORDER BY "order", created_at')
      .all() as PageRow[];
    return rows.map(mapPage);
  },

  getPage(id: string): Page | null {
    const page = db
      .prepare('SELECT id, name, slug, parent_id, "order" FROM pages WHERE id = ?')
      .get(id) as PageRow | undefined;
    if (!page) return null;

    const rowRows = db
      .prepare('SELECT id, page_id, columns, position FROM rows WHERE page_id = ? ORDER BY position')
      .all(id) as RowRow[];

    const fieldStmt = db.prepare(
      'SELECT id, row_id, type, label, required, placeholder, options, option_list_id, global_template_id, position, link_type, link_target_page_id, link_url, link_action, link_open_in FROM fields WHERE row_id = ? ORDER BY position',
    );

    const rows: Row[] = rowRows.map((rr) => {
      const fieldRows = fieldStmt.all(rr.id) as FieldRow[];
      return {
        id: rr.id,
        columns: rr.columns as 1 | 2,
        fields: fieldRows.map(mapField),
      };
    });

    const listRows = db
      .prepare('SELECT id, page_id, name, position, options FROM option_lists WHERE page_id = ? ORDER BY position')
      .all(id) as OptionListRow[];
    const optionLists = listRows.map(mapOptionList);

    const templateRows = db
      .prepare('SELECT id, name, type, options, created_at FROM global_templates ORDER BY created_at')
      .all() as GlobalTemplateRow[];
    const globalTemplates = templateRows.map(mapGlobalTemplate);

    return { ...mapPage(page), rows, optionLists, globalTemplates };
  },

  getOptionLists(pageId: string): OptionList[] {
    const rows = db
      .prepare('SELECT id, page_id, name, position, options FROM option_lists WHERE page_id = ? ORDER BY position')
      .all(pageId) as OptionListRow[];
    return rows.map(mapOptionList);
  },

  createOptionList(pageId: string, name: string): OptionList {
    const exists = db.prepare('SELECT 1 FROM option_lists WHERE page_id = ? AND name = ?').get(pageId, name);
    if (exists) {
      const err = new Error('NAME_TAKEN') as Error & { code?: string };
      err.code = 'NAME_TAKEN';
      throw err;
    }
    const id = generateId();
    const maxPos = db
      .prepare('SELECT COALESCE(MAX(position), -1) AS m FROM option_lists WHERE page_id = ?')
      .get(pageId) as { m: number };
    db.prepare(
      'INSERT INTO option_lists (id, page_id, name, position, options) VALUES (?, ?, ?, ?, ?)',
    ).run(id, pageId, name, maxPos.m + 1, JSON.stringify([]));
    return { id, name, position: maxPos.m + 1, options: [] };
  },

  renameOptionList(pageId: string, listId: string, name: string): OptionList {
    const clash = db
      .prepare('SELECT 1 FROM option_lists WHERE page_id = ? AND name = ? AND id != ?')
      .get(pageId, name, listId);
    if (clash) {
      const err = new Error('NAME_TAKEN') as Error & { code?: string };
      err.code = 'NAME_TAKEN';
      throw err;
    }
    const res = db
      .prepare('UPDATE option_lists SET name = ? WHERE id = ? AND page_id = ?')
      .run(name, listId, pageId) as { changes: number };
    if (res.changes === 0) {
      const err = new Error('NOT_FOUND') as Error & { code?: string };
      err.code = 'NOT_FOUND';
      throw err;
    }
    const row = db.prepare('SELECT id, page_id, name, position, options FROM option_lists WHERE id = ?').get(listId) as OptionListRow;
    return mapOptionList(row);
  },

  deleteOptionList(pageId: string, listId: string): void {
    db.prepare('DELETE FROM option_lists WHERE id = ? AND page_id = ?').run(listId, pageId);
  },

  reorderOptionLists(pageId: string, orderedIds: string[]): OptionList[] {
    db.exec('BEGIN');
    try {
      const stmt = db.prepare('UPDATE option_lists SET position = ? WHERE id = ? AND page_id = ?');
      orderedIds.forEach((listId, idx) => {
        stmt.run(idx, listId, pageId);
      });
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
    return this.getOptionLists(pageId);
  },

  addOption(pageId: string, listId: string, value: string): OptionList {
    const row = db
      .prepare('SELECT id, page_id, name, position, options FROM option_lists WHERE id = ? AND page_id = ?')
      .get(listId, pageId) as OptionListRow | undefined;
    if (!row) {
      const err = new Error('NOT_FOUND') as Error & { code?: string };
      err.code = 'NOT_FOUND';
      throw err;
    }
    const opts = row.options ? (JSON.parse(row.options) as string[]) : [];
    if (opts.includes(value)) {
      const err = new Error('VALUE_TAKEN') as Error & { code?: string };
      err.code = 'VALUE_TAKEN';
      throw err;
    }
    opts.push(value);
    db.prepare('UPDATE option_lists SET options = ? WHERE id = ?').run(JSON.stringify(opts), listId);
    return { ...mapOptionList(row), options: opts };
  },

  removeOption(pageId: string, listId: string, value: string): OptionList {
    const row = db
      .prepare('SELECT id, page_id, name, position, options FROM option_lists WHERE id = ? AND page_id = ?')
      .get(listId, pageId) as OptionListRow | undefined;
    if (!row) {
      const err = new Error('NOT_FOUND') as Error & { code?: string };
      err.code = 'NOT_FOUND';
      throw err;
    }
    const opts = row.options ? (JSON.parse(row.options) as string[]) : [];
    const next = opts.filter((o) => o !== value);
    db.prepare('UPDATE option_lists SET options = ? WHERE id = ?').run(JSON.stringify(next), listId);
    return { ...mapOptionList(row), options: next };
  },

  setOptions(pageId: string, listId: string, options: string[]): OptionList {
    const row = db
      .prepare('SELECT id, page_id, name, position, options FROM option_lists WHERE id = ? AND page_id = ?')
      .get(listId, pageId) as OptionListRow | undefined;
    if (!row) {
      const err = new Error('NOT_FOUND') as Error & { code?: string };
      err.code = 'NOT_FOUND';
      throw err;
    }
    db.prepare('UPDATE option_lists SET options = ? WHERE id = ?').run(JSON.stringify(options), listId);
    return { ...mapOptionList(row), options };
  },

  createPage(name: string, parentId: string | null): PageSummary {
    const nameExists = db.prepare('SELECT 1 FROM pages WHERE name = ?').get(name);
    if (nameExists) {
      const err = new Error('NAME_TAKEN') as Error & { code?: string };
      err.code = 'NAME_TAKEN';
      throw err;
    }

    const id = generateId();
    const slug = uniqueSlug(name);
    const now = new Date().toISOString();
    const maxOrder = db.prepare('SELECT COALESCE(MAX("order"), -1) AS m FROM pages').get() as {
      m: number;
    };

    db.prepare(
      'INSERT INTO pages (id, name, slug, parent_id, "order", created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).run(id, name, slug, parentId, maxOrder.m + 1, now, now);

    return { id, name, slug, parentId, order: maxOrder.m + 1 };
  },

  // Replaces rows/fields for the page inside a manual transaction.
  updatePage(
    id: string,
    patch: { name?: string; parentId?: string | null; order?: number; rows?: Row[] },
  ): Page {
    const existing = db.prepare('SELECT 1 FROM pages WHERE id = ?').get(id);
    if (!existing) {
      const err = new Error('NOT_FOUND') as Error & { code?: string };
      err.code = 'NOT_FOUND';
      throw err;
    }
    if (patch.name !== undefined) {
      const clash = db
        .prepare('SELECT 1 FROM pages WHERE name = ? AND id != ?')
        .get(patch.name, id);
      if (clash) {
        const err = new Error('NAME_TAKEN') as Error & { code?: string };
        err.code = 'NAME_TAKEN';
        throw err;
      }
    }

    db.exec('BEGIN');
    try {
      const sets: string[] = [];
      const params: unknown[] = [];
      if (patch.name !== undefined) {
        sets.push('name = ?');
        params.push(patch.name);
      }
      if (patch.parentId !== undefined) {
        sets.push('parent_id = ?');
        params.push(patch.parentId);
      }
      if (patch.order !== undefined) {
        sets.push('"order" = ?');
        params.push(patch.order);
      }
      if (sets.length) {
        sets.push('updated_at = ?');
        params.push(new Date().toISOString());
        db.prepare(`UPDATE pages SET ${sets.join(', ')} WHERE id = ?`).run(...params, id);
      }

      if (patch.rows) {
        db.prepare('DELETE FROM rows WHERE page_id = ?').run(id);
        const insRow = db.prepare(
          'INSERT INTO rows (id, page_id, columns, position) VALUES (?, ?, ?, ?)',
        );
        const insField = db.prepare(
          `INSERT INTO fields (id, row_id, type, label, required, placeholder, options, option_list_id, global_template_id, position, link_type, link_target_page_id, link_url, link_action, link_open_in)
           VALUES (@id, @row_id, @type, @label, @required, @placeholder, @options, @option_list_id, @global_template_id, @position, @link_type, @link_target_page_id, @link_url, @link_action, @link_open_in)`,
        );

        patch.rows.forEach((row, ri) => {
          const rowId = row.id || generateId();
          insRow.run(rowId, id, row.columns, ri);
          row.fields.forEach((f, fi) => {
            const fieldId = f.id || generateId();
            insField.run({
              id: fieldId,
              row_id: rowId,
              type: f.type,
              label: f.label,
              required: f.required ? 1 : 0,
              placeholder: f.placeholder ?? null,
              options: f.options ? JSON.stringify(f.options) : null,
              option_list_id: f.optionListId ?? null,
              global_template_id: f.globalTemplateId ?? null,
              position: fi,
              link_type: f.link?.type ?? null,
              link_target_page_id: f.link?.targetPageId ?? null,
              link_url: f.link?.url ?? null,
              link_action: f.link?.action ?? null,
              link_open_in: f.link?.openIn ?? null,
            });
          });
        });
      }
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }

    const updated = this.getPage(id);
    if (!updated) throw new Error('NOT_FOUND');
    return updated;
  },

  deletePage(id: string): { ok: true } | { ok: false; reason: 'has_children' } {
    const child = db.prepare('SELECT 1 FROM pages WHERE parent_id = ? LIMIT 1').get(id);
    if (child) return { ok: false, reason: 'has_children' };
    db.prepare('DELETE FROM pages WHERE id = ?').run(id);
    return { ok: true };
  },

  // Pages available as link targets: every page except the given one.
  linkTargets(excludeId: string): PageSummary[] {
    const rows = db
      .prepare(
        'SELECT id, name, slug, parent_id, "order" FROM pages WHERE id != ? ORDER BY "order", created_at',
      )
      .all(excludeId) as PageRow[];
    return rows.map(mapPage);
  },
};
