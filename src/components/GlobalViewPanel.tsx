import { useEffect, useState } from 'react';
import type { GlobalTemplate } from '../types';
import { api } from '../api';
import styles from './OptionListsPanel.module.css';

export function GlobalViewPanel() {
  const [templates, setTemplates] = useState<GlobalTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    setLoading(true);
    api.globalTemplates
      .list()
      .then(setTemplates)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(reload, []);

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>Global Templates</h2>
      <p className={styles.sub}>
        Reusable form elements created under Settings → Global. Reference them from a field's
        “Option source” (Dropdown/Radio) in the Edit tab.
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
        </div>
      ))}
    </div>
  );
}
