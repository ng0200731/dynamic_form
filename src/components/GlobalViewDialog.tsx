import { useEffect, useState } from 'react';
import type { GlobalTemplate } from '../types';
import { api } from '../api';
import styles from './OptionListsPanel.module.css';

interface Props {
  onClose: () => void;
  onPick?: (t: GlobalTemplate) => void;
}

export function GlobalViewDialog({ onClose, onPick }: Props) {
  const [templates, setTemplates] = useState<GlobalTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.globalTemplates
      .list()
      .then(setTemplates)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <h2 className={styles.title}>Global Templates</h2>
        <p className={styles.sub}>
          Reusable form elements. Reference them from a field's “Option source” in the Edit tab.
        </p>

        {error && <div className={styles.error}>{error}</div>}
        {loading && <p className={styles.empty}>Loading…</p>}
        {!loading && templates.length === 0 && (
          <p className={styles.empty}>No global templates yet. Create one from Settings → Global → Create.</p>
        )}

        {templates.map((t) => (
          <div key={t.id} className={styles.box}>
            <div className={styles.boxHead}>
              <span className={styles.boxName}>{t.name}</span>
              <span className={styles.tag}>{t.type}</span>
            </div>
            {t.options.length > 0 ? (
              <ul className={styles.optList}>
                {t.options.map((o) => (
                  <li key={o} className={styles.optValPlain}>
                    {o}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.optEmpty}>No options.</p>
            )}
            {onPick && (
              <button className={styles.delBox} style={{ marginTop: 8 }} onClick={() => onPick(t)}>
                Use this template
              </button>
            )}
          </div>
        ))}

        <div className={styles.actions}>
          <button className={styles.cancel} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
