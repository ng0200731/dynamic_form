import { useState } from 'react';
import type { PageSummary } from '../types';
import styles from './CreatePageDialog.module.css';

interface Props {
  pages: PageSummary[];
  onClose: () => void;
  onCreate: (name: string, parentId: string | null) => Promise<{ id: string }>;
}

export function CreatePageDialog({ pages, onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a page name.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onCreate(name.trim(), parentId || null);
      onClose();
    } catch (err) {
      const msg = (err as Error).message;
      // Surface a friendlier message if the server already has the name.
      if (msg.toLowerCase().includes('already exists')) {
        setError('A page with that name already exists. Choose a unique name.');
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <h2 className={styles.title}>New Page</h2>
        <form onSubmit={submit}>
          <label className={styles.field}>
            <span>Name</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Contact Us"
            />
          </label>

          <label className={styles.field}>
            <span>Parent page (optional)</span>
            <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">— None (top level) —</option>
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className={styles.submit} disabled={busy}>
              {busy ? 'Creating…' : 'Create & Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
