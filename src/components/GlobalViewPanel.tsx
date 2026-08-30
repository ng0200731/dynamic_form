import { useEffect, useState } from 'react';
import type { GlobalTemplate } from '../types';
import { api } from '../api';
import styles from './OptionListsPanel.module.css';

export function GlobalViewPanel() {
  const [templates, setTemplates] = useState<GlobalTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newOption, setNewOption] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; name: string } | null>(null);

  const reload = () => {
    setLoading(true);
    api.globalTemplates
      .list()
      .then(setTemplates)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(reload, []);

  const addOption = async (t: GlobalTemplate) => {
    const value = (newOption[t.id] ?? '').trim();
    if (!value || t.options.includes(value)) return;
    setError(null);
    try {
      await api.globalTemplates.update(t.id, { options: [...t.options, value] });
      setNewOption((s) => ({ ...s, [t.id]: '' }));
      reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const removeOption = async (t: GlobalTemplate, value: string) => {
    setError(null);
    try {
      await api.globalTemplates.update(t.id, { options: t.options.filter((o) => o !== value) });
      reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const reorderOption = async (t: GlobalTemplate, value: string, dir: -1 | 1) => {
    const idx = t.options.indexOf(value);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= t.options.length) return;
    const opts = [...t.options];
    [opts[idx], opts[swap]] = [opts[swap], opts[idx]];
    setError(null);
    try {
      await api.globalTemplates.update(t.id, { options: opts });
      reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const rename = async (t: GlobalTemplate, name: string) => {
    setError(null);
    try {
      await api.globalTemplates.update(t.id, { name: name.trim() });
      setEditingId(null);
      reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleDelete = async () => {
    if (!confirm) return;
    setError(null);
    try {
      await api.globalTemplates.remove(confirm.id);
      setConfirm(null);
      reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>Global Templates</h2>
      <p className={styles.sub}>
        Reusable form elements created under Settings → Global Create. Reference them from a field's
        “Option source” (Dropdown/Radio) in the Edit tab.
      </p>

      {error && <div className={styles.error}>{error}</div>}
      {loading && <p className={styles.empty}>Loading…</p>}
      {!loading && templates.length === 0 && (
        <p className={styles.empty}>No global templates yet. Create one from Settings → Global Create.</p>
      )}

      {templates.map((t) => (
        <div key={t.id} className={styles.box}>
          <div className={styles.boxHead}>
            {editingId === t.id ? (
              <input
                className={styles.boxName}
                value={t.name}
                autoFocus
                onChange={(e) => rename(t, e.target.value)}
                onBlur={() => setEditingId(null)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
              />
            ) : (
              <span
                className={styles.boxName}
                style={{ cursor: 'pointer' }}
                title="Click to rename"
                onClick={() => setEditingId(t.id)}
              >
                {t.name}
              </span>
            )}
            <span className={styles.tag}>{t.type}</span>
            <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
              <button className={styles.delBox} style={{ background: '#eef2f7', color: 'var(--text)' }} onClick={() => setEditingId(t.id)}>
                Edit
              </button>
              <button className={styles.delBox} onClick={() => setConfirm({ id: t.id, name: t.name })}>
                Delete
              </button>
            </div>
          </div>

          <ul className={styles.optList}>
            {t.options.map((o, oi) => (
              <li key={o}>
                <div className={styles.reorder}>
                  <button title="Move up" disabled={oi === 0} onClick={() => reorderOption(t, o, -1)}>
                    ▲
                  </button>
                  <button
                    title="Move down"
                    disabled={oi === t.options.length - 1}
                    onClick={() => reorderOption(t, o, 1)}
                  >
                    ▼
                  </button>
                </div>
                <span className={styles.optVal}>{o}</span>
                <button className={styles.delOpt} onClick={() => removeOption(t, o)}>
                  ✕
                </button>
              </li>
            ))}
            {t.options.length === 0 && <li className={styles.optEmpty}>No options.</li>}
          </ul>

          {t.type !== 'input' && (
          <div className={styles.optAdd}>
            <input
              value={newOption[t.id] ?? ''}
              onChange={(e) => setNewOption((s) => ({ ...s, [t.id]: e.target.value }))}
              placeholder="New option"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption(t))}
            />
            <button onClick={() => addOption(t)}>Add</button>
          </div>
          )}
        </div>
      ))}

      {confirm && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <p>
              Delete the template <strong>{confirm.name}</strong> and all its options? Fields referencing
              it will lose their options.
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
