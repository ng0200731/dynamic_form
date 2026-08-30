import { useCallback, useState } from 'react';
import { usePages } from './hooks/usePages';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { OptionListsPanel } from './components/OptionListsPanel';
import { GlobalViewPanel } from './components/GlobalViewPanel';
import { PagesViewPanel } from './components/PagesViewPanel';
import styles from './App.module.css';

export function App() {
  const {
    pages,
    selectedId,
    currentPage,
    mode,
    setMode,
    loading,
    error,
    loadPage,
    saveCurrent,
    reparent,
    createPage,
    removePage,
  } = usePages();

  // Track previous page id for the "Go Back" button action in preview.
  const [previousId, setPreviousId] = useState<string | null>(null);

  const navigate = useCallback(
    (pageId: string, openIn: 'same' | 'new') => {
      if (openIn === 'new') {
        window.open(`/?page=${pageId}`, '_blank');
        return;
      }
      setPreviousId(selectedId);
      loadPage(pageId);
    },
    [loadPage, selectedId],
  );

  const goBack = useCallback(() => {
    if (previousId) {
      setPreviousId(null);
      loadPage(previousId);
    }
  }, [loadPage, previousId]);

  const handleSelect = useCallback(
    (id: string) => {
      setPreviousId(null);
      loadPage(id);
    },
    [loadPage],
  );

  return (
    <div className={styles.app}>
      <Sidebar
        pages={pages}
        onCreate={createPage}
        mode={mode}
        onModeChange={setMode}
      />
      <main className={styles.main}>
        {loading && <div className={styles.status}>Loading…</div>}
        {error && <div className={styles.statusErr}>{error}</div>}
        {!currentPage && !loading && (
          <div className={styles.empty}>
            <p>No page selected.</p>
            <p>Create a page from the sidebar to begin.</p>
          </div>
        )}
        {currentPage && (
          <>
            <Toolbar
              page={currentPage}
              pages={pages}
              mode={mode}
              onModeChange={setMode}
              onReparent={reparent}
            />
            <div className={styles.content}>
              {mode === 'edit' ? (
                <Editor page={currentPage} onSave={saveCurrent} />
              ) : mode === 'lists' ? (
                <OptionListsPanel page={currentPage} onChanged={loadPage} />
              ) : mode === 'global' ? (
                <GlobalViewPanel />
              ) : mode === 'pages' ? (
                <PagesViewPanel selectedId={selectedId} onSelect={handleSelect} onEdit={loadPage} />
              ) : (
                <Preview page={currentPage} onNavigate={navigate} onBack={goBack} />
              )}
            </div>
          </>
        )}
      </main>
      {selectedId && (
        <button
          className={styles.deleteFab}
          title="Delete page"
          onClick={async () => {
            if (confirm('Delete this page? Child pages must be moved first.')) {
              try {
                await removePage(selectedId);
              } catch (e) {
                alert((e as Error).message);
              }
            }
          }}
        >
          🗑 Delete
        </button>
      )}
    </div>
  );
}
