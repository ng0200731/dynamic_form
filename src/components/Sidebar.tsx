import { useState } from 'react';
import type { HierarchyNode, PageSummary } from '../types';
import { CreatePageDialog } from './CreatePageDialog';
import { GlobalTemplateDialog } from './GlobalTemplateDialog';
import { HierarchyNavTree } from './HierarchyNavTree';
import styles from './Sidebar.module.css';

interface Props {
  pages: PageSummary[];
  hierarchyNodes: HierarchyNode[];
  onCreate: (name: string, parentId: string | null) => Promise<{ id: string }>;
  mode: 'edit' | 'lists' | 'preview' | 'global' | 'pages' | 'hierarchy';
  onModeChange: (m: 'edit' | 'lists' | 'preview' | 'global' | 'pages' | 'hierarchy') => void;
  onGlobalSaved?: () => void;
  onSelectPage?: (id: string) => void;
  selectedId?: string | null;
}

export function Sidebar({ pages, hierarchyNodes, onCreate, mode, onModeChange, onGlobalSaved, onSelectPage, selectedId }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [globalOpen, setGlobalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [pageOpen, setPageOpen] = useState(true);
  const [optionOpen, setOptionOpen] = useState(true);
  const [pagesOpen, setPagesOpen] = useState(true);

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
            Settings
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
              <button
                className={mode === 'hierarchy' ? `${styles.subItem} ${styles.subActive}` : styles.subItem}
                onClick={() => onModeChange('hierarchy')}
              >
                Hierarchy
              </button>
            </div>
          )}

          {/* Page navigation mirrors the independent hierarchy skeleton. */}
          {hierarchyNodes.length > 0 && (
            <div className={styles.settingsGroup}>
              <button
                className={styles.settingsBtn}
                onClick={() => setPagesOpen((o) => !o)}
                aria-expanded={pagesOpen}
              >
                <span className={styles.caret}>{pagesOpen ? '▾' : '▸'}</span>
                Pages
              </button>
              {pagesOpen && (
                <HierarchyNavTree
                  nodes={hierarchyNodes}
                  selectedId={selectedId ?? null}
                  onSelect={(id) => onSelectPage?.(id)}
                />
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
