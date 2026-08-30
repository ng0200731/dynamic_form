import type { Page, PageSummary } from '../types';
import styles from './Toolbar.module.css';

interface Props {
  page: Page;
  pages: PageSummary[];
  onReparent: (parentId: string | null) => void;
  showBack?: boolean;
  onBack?: () => void;
}

export function Toolbar({ page, pages, onReparent, showBack, onBack }: Props) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.left}>
        {showBack && (
          <button className={styles.back} onClick={onBack} title="Back to Page View">
            ‹ Back
          </button>
        )}
        <span className={styles.name}>{page.name}</span>
        <span className={styles.slug}>/{page.slug}</span>
      </div>

      <div className={styles.center}>
        <label className={styles.parentLabel}>
          Parent:
          <select
            value={page.parentId ?? ''}
            onChange={(e) => onReparent(e.target.value || null)}
          >
            <option value="">— None —</option>
            {pages
              .filter((p) => p.id !== page.id)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </label>
      </div>
    </div>
  );
}

