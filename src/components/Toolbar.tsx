import type { Page, PageSummary } from '../types';
import type { Mode } from '../hooks/usePages';
import styles from './Toolbar.module.css';

interface Props {
  page: Page;
  pages: PageSummary[];
  mode: Mode;
  onModeChange: (m: Mode) => void;
  onReparent: (parentId: string | null) => void;
}

export function Toolbar({ page, pages, mode, onModeChange, onReparent }: Props) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.left}>
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

      <div className={styles.right}>
        <div className={styles.toggle}>
          <button
            className={mode === 'edit' ? styles.active : ''}
            onClick={() => onModeChange('edit')}
          >
            Edit
          </button>
          <button
            className={mode === 'lists' ? styles.active : ''}
            onClick={() => onModeChange('lists')}
          >
            Lists
          </button>
          <button
            className={mode === 'preview' ? styles.active : ''}
            onClick={() => onModeChange('preview')}
          >
            Preview
          </button>
        </div>
      </div>
    </div>
  );
}
