import { useState } from 'react';
import type { PageSummary } from '../types';
import { PageTree } from './PageTree';
import { CreatePageDialog } from './CreatePageDialog';
import { GlobalTemplateDialog } from './GlobalTemplateDialog';
import styles from './Sidebar.module.css';

interface Props {
  pages: PageSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string, parentId: string | null) => Promise<{ id: string }>;
  mode: 'edit' | 'lists' | 'preview' | 'global';
  onModeChange: (m: 'edit' | 'lists' | 'preview' | 'global') => void;
}

export function Sidebar({ pages, selectedId, onSelect, onCreate, mode, onModeChange }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [globalOpen, setGlobalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [treeVisible, setTreeVisible] = useState(true);

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
                Create page
              </button>
              <button
                className={styles.subItem}
                onClick={() => setTreeVisible((v) => !v)}
              >
                View page {treeVisible ? '(hide)' : '(show)'}
              </button>
              <button
                className={styles.subItem}
                onClick={() => setGlobalOpen(true)}
              >
                Global — Create
              </button>
              <button
                className={mode === 'global' ? `${styles.subItem} ${styles.subActive}` : styles.subItem}
                onClick={() => onModeChange('global')}
              >
                Global — View
              </button>
            </div>
          )}
        </div>

        {treeVisible && (
          <PageTree pages={pages} selectedId={selectedId} onSelect={onSelect} />
        )}
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
