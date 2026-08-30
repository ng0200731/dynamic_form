import { randomUUID } from 'node:crypto';
import { db } from './db.js';

export function generateId(): string {
  return randomUUID();
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Produce a slug unique across all pages. Appends -2, -3, ... on collision.
export function uniqueSlug(baseName: string): string {
  const base = slugify(baseName) || 'page';
  const exists = db.prepare('SELECT 1 FROM pages WHERE slug = ?');
  if (!exists.get(base)) return base;

  let n = 2;
  let candidate = `${base}-${n}`;
  while (exists.get(candidate)) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  return candidate;
}
