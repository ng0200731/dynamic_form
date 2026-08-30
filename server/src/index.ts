import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { repository } from './repository.js';
import type { Row } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

const api = express.Router();

api.get('/pages', (_req, res) => {
  res.json(repository.listPages());
});

api.post('/pages', (req, res) => {
  const name = String(req.body?.name ?? '').trim();
  const rawParent = req.body?.parentId;
  const parentId = rawParent && rawParent !== '' ? rawParent : null;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const page = repository.createPage(name, parentId);
    res.status(201).json(page);
  } catch (e) {
    if ((e as { code?: string }).code === 'NAME_TAKEN') {
      return res.status(409).json({ error: 'A page with that name already exists' });
    }
    throw e;
  }
});

api.get('/pages/:id', (req, res) => {
  const page = repository.getPage(req.params.id);
  if (!page) return res.status(404).json({ error: 'Page not found' });
  res.json(page);
});

api.put('/pages/:id', (req, res) => {
  const { name, parentId, order, rows } = req.body ?? {};
  try {
    const page = repository.updatePage(req.params.id, {
      name,
      parentId,
      order,
      rows: rows as Row[] | undefined,
    });
    res.json(page);
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === 'NOT_FOUND') return res.status(404).json({ error: 'Page not found' });
    if (code === 'NAME_TAKEN') {
      return res.status(409).json({ error: 'A page with that name already exists' });
    }
    throw e;
  }
});

api.delete('/pages/:id', (req, res) => {
  const result = repository.deletePage(req.params.id);
  if (!result.ok) {
    if (result.reason === 'has_children') {
      return res.status(409).json({ error: 'Cannot delete a page that has child pages' });
    }
  }
  res.status(204).end();
});

api.get('/pages/:id/link-targets', (req, res) => {
  res.json(repository.linkTargets(req.params.id));
});

// ---- Per-page option lists -------------------------------------------------

api.get('/pages/:id/option-lists', (req, res) => {
  res.json(repository.getOptionLists(req.params.id));
});

api.post('/pages/:id/option-lists', (req, res) => {
  const name = String(req.body?.name ?? '').trim();
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const list = repository.createOptionList(req.params.id, name);
    res.status(201).json(list);
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === 'NAME_TAKEN') {
      return res.status(409).json({ error: 'A list with that name already exists' });
    }
    throw e;
  }
});

api.put('/pages/:id/option-lists/:listId', (req, res) => {
  const name = String(req.body?.name ?? '').trim();
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const list = repository.renameOptionList(req.params.id, req.params.listId, name);
    res.json(list);
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === 'NOT_FOUND') return res.status(404).json({ error: 'List not found' });
    if (code === 'NAME_TAKEN') {
      return res.status(409).json({ error: 'A list with that name already exists' });
    }
    throw e;
  }
});

api.delete('/pages/:id/option-lists/:listId', (req, res) => {
  repository.deleteOptionList(req.params.id, req.params.listId);
  res.status(204).end();
});

api.put('/pages/:id/option-lists/reorder', (req, res) => {
  const orderedIds = Array.isArray(req.body?.orderedIds) ? (req.body.orderedIds as string[]) : [];
  res.json(repository.reorderOptionLists(req.params.id, orderedIds));
});

api.post('/pages/:id/option-lists/:listId/options', (req, res) => {
  const value = String(req.body?.value ?? '').trim();
  if (!value) return res.status(400).json({ error: 'Value is required' });
  try {
    const list = repository.addOption(req.params.id, req.params.listId, value);
    res.status(201).json(list);
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === 'NOT_FOUND') return res.status(404).json({ error: 'List not found' });
    if (code === 'VALUE_TAKEN') {
      return res.status(409).json({ error: 'That option already exists in this list' });
    }
    throw e;
  }
});

api.delete('/pages/:id/option-lists/:listId/options', (req, res) => {
  const value = String(req.body?.value ?? '').trim();
  try {
    repository.removeOption(req.params.id, req.params.listId, value);
  } catch (e) {
    if ((e as { code?: string }).code === 'NOT_FOUND') {
      return res.status(404).json({ error: 'List not found' });
    }
    throw e;
  }
  res.status(204).end();
});

api.put('/pages/:id/option-lists/:listId/options', (req, res) => {
  const options = Array.isArray(req.body?.options) ? (req.body.options as string[]) : [];
  try {
    const list = repository.setOptions(req.params.id, req.params.listId, options);
    res.json(list);
  } catch (e) {
    if ((e as { code?: string }).code === 'NOT_FOUND') {
      return res.status(404).json({ error: 'List not found' });
    }
    throw e;
  }
});

app.use('/api', api);

// Serve built client in production.
const clientDist = join(__dirname, '..', '..', 'dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(join(clientDist, 'index.html')));
}

const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
