import { useState } from 'react';
import type { PageSummary } from '../types';
import { CreatePageDialog } from './CreatePageDialog';
import { GlobalTemplateDialog } from './GlobalTemplateDialog';
import styles from './Sidebar.module.css';

interface Props {
  pages: PageSummary[];
  onCreate: (name: string, parentId: string | null) => Promise<{ id: string }>;
  mode: 'edit' | 'lists' | 'preview' | 'global' | 'pages';
  onModeChange: (m: 'edit' | 'lists' | 'preview' | 'global' | 'pages') => void;
}

export function Sidebar({ pages, onCreate, mode, onModeChange }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [globalOpen, setGlobalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(true);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <span className={styles.brand}>Page Builder</span>
        <button className={styles.newBtn} onClick={() => setDialogOpen(true)}>
          + New Page
        </button>
      </div>
      <nav className={styles.nav}>
        <div className={styles.settingsGroup}>
          <button
            className={styles.settingsBtn}
            onClick={() => setSettingsOpen((o) => !o)}
            aria-expanded={settingsOpen}
          >
            <span className={styles.caret}>{settingsOpen ? '▾' : '▸'}</span>
            ⚙ Settings
          </button>

          {settingsOpen && (
            <div className={styles.submenu}>
              <button className={styles.subItem} onClick={() => setDialogOpen(true)}>
                Page Create
              </button>
              <button
                className={mode === 'pages' ? `${styles.subItem} ${styles.subActive}` : styles.subItem}
                onClick={() => onModeChange('pages')}
              >
                Page View
              </button>
              <button
                className={styles.subItem}
                onClick={() => setGlobalOpen(true)}
              >
                Global Create
              </button>
              <button
                className={mode === 'global' ? `${styles.subItem} ${styles.subActive}` : styles.subItem}
                onClick={() => onModeChange('global')}
              >
                Global View
              </button>
            </div>
          )}
        </div>
      </nav>
      {dialogOpen && (
        <CreatePageDialog
          pages={pages}
          onClose={() => setDialogOpen(false)}
          onCreate={onCreate}
        />
      )}
      {globalOpen && (
        <GlobalTemplateDialog onClose={() => setGlobalOpen(false)} />
      )}
    </aside>
  );
}
