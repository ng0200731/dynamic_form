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
  onGlobalSaved?: () => void;
}

export function Sidebar({ pages, onCreate, mode, onModeChange, onGlobalSaved }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [globalOpen, setGlobalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [pageOpen, setPageOpen] = useState(true);
  const [optionOpen, setOptionOpen] = useState(true);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <span className={styles.brand}>Page Builder</span>
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
              <button
                className={styles.subItem}
                onClick={() => setPageOpen((o) => !o)}
                aria-expanded={pageOpen}
              >
                <span className={styles.caret}>{pageOpen ? '▾' : '▸'}</span>
                Page
              </button>
              {pageOpen && (
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
                </div>
              )}
              <button
                className={styles.subItem}
                onClick={() => setOptionOpen((o) => !o)}
                aria-expanded={optionOpen}
              >
                <span className={styles.caret}>{optionOpen ? '▾' : '▸'}</span>
                Option
              </button>
              {optionOpen && (
                <div className={styles.submenu}>
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
        <GlobalTemplateDialog
          onClose={() => setGlobalOpen(false)}
          onSaved={() => {
            onGlobalSaved?.();
            onModeChange('global');
          }}
        />
      )}
    </aside>
  );
}
