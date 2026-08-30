import { useEffect, useState } from 'react';
import type { PageSummary } from '../types';
import { api } from '../api';
import styles from './OptionListsPanel.module.css';

interface Props {
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  loadPage: (id: string) => void;
  setMode: (m: 'edit' | 'lists' | 'preview' | 'global' | 'pages') => void;
  setCameFromPages: (v: boolean) => void;
  setPreviewOrigin: (v: 'pages' | 'edit' | null) => void;
}

export function PagesViewPanel({ onSelect, onEdit, loadPage, setMode, setCameFromPages, setPreviewOrigin }: Props) {
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<{ id: string; name: string } | null>(null);

  const reload = () => {
    setLoading(true);
    api.listPages()
      .then(setPages)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(reload, []);

  const handleDelete = async () => {
    if (!confirm) return;
    try {
      await api.deletePage(confirm.id);
      setConfirm(null);
      reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>All Pages</h2>
      <p className={styles.sub}>Every page in the builder. Click one to open it in the editor.</p>

      {error && <div className={styles.error}>{error}</div>}
      {loading && <p className={styles.empty}>Loading…</p>}
      {!loading && pages.length === 0 && (
        <p className={styles.empty}>No pages yet. Create one from Settings → Page Create.</p>
      )}

      {pages.map((p) => (
        <div key={p.id} className={styles.box} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div
            style={{ cursor: 'pointer', flex: 1 }}
            onClick={() => onSelect(p.id)}
          >
            <div className={styles.boxHead}>
              <span className={styles.boxName}>{p.name}</span>
              {p.parentId && <span className={styles.tag}>child</span>}
            </div>
            <span className={styles.slugText}>/{p.slug}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className={styles.delBox} style={{ background: '#eef2f7', color: 'var(--text)' }} onClick={() => { setCameFromPages(true); setPreviewOrigin('pages'); loadPage(p.id); setMode('preview'); }}>
              Preview
            </button>
            <button className={styles.delBox} style={{ background: '#eef2f7', color: 'var(--text)' }} onClick={() => onEdit(p.id)}>
              Edit
            </button>
            <button className={styles.delBox} onClick={() => setConfirm({ id: p.id, name: p.name })}>
              Delete
            </button>
          </div>
        </div>
      ))}

      {confirm && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <p>
              Delete the page <strong>{confirm.name}</strong>? This cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button onClick={() => setConfirm(null)}>Cancel</button>
              <button className={styles.delBox} onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
