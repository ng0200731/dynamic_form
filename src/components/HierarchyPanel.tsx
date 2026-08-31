import { useCallback, useEffect, useState } from 'react';
import type { PageSummary } from '../types';
import { api } from '../api';
import styles from './OptionListsPanel.module.css';

interface Props {
  onChanged: (id: string) => void;
}

interface LevelNode {
  level: number;
  page: PageSummary;
  children: LevelNode[];
}

// Flatten the tree into a list grouped by depth level (level 1, 2, … N).
function toLevels(roots: LevelNode[], out: LevelNode[][] = []): LevelNode[][] {
  const walk = (nodes: LevelNode[]) => {
    nodes.forEach((n) => {
      (out[n.level - 1] ||= []).push(n);
      walk(n.children);
    });
  };
  walk(roots);
  return out;
}

export function HierarchyPanel({ onChanged }: Props) {
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [parentMap, setParentMap] = useState<Record<string, string | null>>({});

  const reload = useCallback(() => {
    setLoading(true);
    api
      .listPages()
      .then((list) => {
        setPages(list);
        const map: Record<string, string | null> = {};
        list.forEach((p) => (map[p.id] = p.parentId));
        setParentMap(map);
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(reload, [reload]);

  // Build level groups (level 1 = roots, level 2 = children of level 1, … N).
  const levels = (() => {
    const byId = new Map<string, LevelNode>();
    pages.forEach((p) => byId.set(p.id, { level: 1, page: p, children: [] }));
    const roots: LevelNode[] = [];
    pages.forEach((p) => {
      const node = byId.get(p.id)!;
      if (p.parentId && byId.has(p.parentId)) {
        byId.get(p.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });
    // Assign levels via BFS.
    const queue: LevelNode[] = [...roots];
    while (queue.length) {
      const n = queue.shift()!;
      n.children.forEach((c) => {
        c.level = n.level + 1;
        queue.push(c);
      });
    }
    const sortRec = (nodes: LevelNode[]) => {
      nodes.sort((a, b) => a.page.order - b.page.order);
      nodes.forEach((n) => sortRec(n.children));
    };
    sortRec(roots);
    return toLevels(roots);
  })();

  const setParent = async (id: string, parentId: string | null) => {
    setError(null);
    try {
      await api.updatePage(id, { parentId });
      reload();
      onChanged(id);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>Hierarchy</h2>
      <p className={styles.sub}>
        Drag-free editing of the page tree. Each level shows pages at that depth. Change a page's
        parent to move it up or down a level. <em>Settings</em> is dimmed because it is fixed.
      </p>

      {error && <div className={styles.error}>{error}</div>}
      {loading && <p className={styles.empty}>Loading…</p>}
      {!loading && levels.length === 0 && (
        <p className={styles.empty}>No pages yet. Create one from Settings → Page Create.</p>
      )}

      {levels.map((nodes, i) => (
        <div key={i} className={styles.box}>
          <div className={styles.boxHead}>
            <span className={styles.boxName}>Level {i + 1}</span>
            <span className={styles.tag}>
              {nodes.length} page{nodes.length === 1 ? '' : 's'}
            </span>
          </div>
          <ul className={styles.optList}>
            {nodes.map((n) => (
              <li key={n.page.id}>
                <span className={styles.optVal} style={{ fontWeight: 500 }}>
                  {n.page.name}
                </span>
                <select
                  value={parentMap[n.page.id] ?? ''}
                  onChange={(e) => setParent(n.page.id, e.target.value || null)}
                  style={{
                    marginLeft: 'auto',
                    padding: '4px 8px',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    background: '#fff',
                  }}
                >
                  <option value="">— root —</option>
                  {pages
                    .filter((p) => p.id !== n.page.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <p className={styles.sub} style={{ marginTop: 16 }}>
        Levels are derived automatically from parent relationships: a page with no parent is Level 1,
        a child of a Level 1 page is Level 2, and so on. To add a new level, create a page and set its
        parent to a page in the current deepest level.
      </p>
    </div>
  );
}
