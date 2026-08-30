import { useEffect, useState } from 'react';
import type { PageSummary } from '../types';
import { api } from '../api';
import styles from './OptionListsPanel.module.css';

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function PagesViewPanel({ selectedId, onSelect }: Props) {
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listPages()
      .then(setPages)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>All Pages</h2>
      <p className={styles.sub}>Every page in the builder. Click one to open it in the editor.</p>

      {error && <div className={styles.error}>{error}</div>}
      {loading && <p className={styles.empty}>Loading…</p>}
      {!loading && pages.length === 0 && (
        <p className={styles.empty}>No pages yet. Create one from Settings → Create page.</p>
      )}

      {pages.map((p) => (
        <div
          key={p.id}
          className={styles.box}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          onClick={() => onSelect(p.id)}
        >
          <div>
            <div className={styles.boxHead}>
              <span className={styles.boxName}>{p.name}</span>
              {p.parentId && <span className={styles.tag}>child</span>}
            </div>
            <span className={styles.slugText}>/{p.slug}</span>
          </div>
          {selectedId === p.id && (
            <span className={styles.tag} style={{ background: 'rgba(16,124,16,0.12)', color: 'var(--ok)' }}>
              current
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
