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
    cameFromPages,
    setCameFromPages,
  } = usePages();

  // Track previous page id for the "Go Back" button action in preview.
  const [previousId, setPreviousId] = useState<string | null>(null);
  // Where the current preview was launched from: 'pages' or 'edit'.
  const [previewOrigin, setPreviewOrigin] = useState<'pages' | 'edit' | null>(null);

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

  const previewBack = useCallback(() => {
    if (previewOrigin === 'pages') {
      setPreviewOrigin(null);
      setCameFromPages(false);
      setMode('pages');
      return;
    }
    if (previewOrigin === 'edit') {
      setPreviewOrigin(null);
      setMode('edit');
      return;
    }
    if (previousId) {
      setPreviousId(null);
      loadPage(previousId);
    } else {
      setMode('edit');
    }
  }, [loadPage, previousId, previewOrigin, cameFromPages, setCameFromPages, setMode]);

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
              onReparent={reparent}
              showBack={cameFromPages}
              onBack={() => {
                setCameFromPages(false);
                setMode('pages');
              }}
            />
            <div className={styles.content}>
              {mode === 'edit' ? (
                <Editor
                  page={currentPage}
                  onSave={saveCurrent}
                  onPreview={() => {
                    setPreviewOrigin('edit');
                    setMode('preview');
                  }}
                  onBack={() => {
                    setCameFromPages(false);
                    setMode('pages');
                  }}
                  showBack={cameFromPages}
                />
              ) : mode === 'lists' ? (
                <OptionListsPanel page={currentPage} onChanged={loadPage} />
              ) : mode === 'global' ? (
                <GlobalViewPanel />
              ) : mode === 'pages' ? (
                <PagesViewPanel
                  onSelect={handleSelect}
                  onEdit={(id) => {
                    loadPage(id);
                    setCameFromPages(true);
                    setMode('edit');
                  }}
                  loadPage={loadPage}
                  setMode={setMode}
                  setCameFromPages={setCameFromPages}
                  setPreviewOrigin={setPreviewOrigin}
                />
              ) : (
                <Preview
                  page={currentPage}
                  onNavigate={navigate}
                  onBack={previewBack}
                  showBack
                />
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
