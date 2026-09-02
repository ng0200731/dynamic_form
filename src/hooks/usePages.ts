import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import type { Page, PageSummary } from '../types';

export type Mode = 'edit' | 'lists' | 'preview' | 'global' | 'pages' | 'hierarchy';

export function usePages() {
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [mode, setMode] = useState<Mode>('edit');
  const [cameFromPages, setCameFromPages] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshList = useCallback(async () => {
    const list = await api.listPages();
    setPages(list);
    return list;
  }, []);

  const loadPage = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const page = await api.getPage(id);
      setCurrentPage(page);
      setSelectedId(id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load.
  useEffect(() => {
    (async () => {
      const list = await refreshList();
      if (list.length && !selectedId) {
        await loadPage(list[0].id);
      }
    })();
  }, [refreshList, loadPage, selectedId]);

  const saveCurrent = useCallback(async (rows: Page['rows']) => {
    if (!currentPage) return;
    const updated = await api.updatePage(currentPage.id, { rows });
    setCurrentPage(updated);
    await refreshList();
  }, [currentPage, refreshList]);

  const reparent = useCallback(
    async (parentId: string | null) => {
      if (!currentPage) return;
      const updated = await api.updatePage(currentPage.id, { parentId });
      setCurrentPage(updated);
      await refreshList();
    },
    [currentPage, refreshList],
  );

  const createPage = useCallback(
    async (name: string, parentId: string | null, navigateToEdit = true) => {
      const created = await api.createPage(name, parentId);
      await refreshList();
      await loadPage(created.id);
      if (navigateToEdit) {
        setMode('edit');
      }
      return created;
    },
    [refreshList, loadPage],
  );

  const removePage = useCallback(
    async (id: string) => {
      await api.deletePage(id);
      const list = await refreshList();
      if (selectedId === id) {
        if (list.length) await loadPage(list[0].id);
        else {
          setCurrentPage(null);
          setSelectedId(null);
        }
      }
    },
    [refreshList, loadPage, selectedId],
  );

  const renamePage = useCallback(
    async (id: string, name: string) => {
      await api.updatePage(id, { name });
      await refreshList();
      if (currentPage && currentPage.id === id) {
        setCurrentPage({ ...currentPage, name });
      }
    },
    [refreshList, currentPage],
  );

  // Move a page: set its parent and/or re-order among siblings.
  const movePage = useCallback(
    async (id: string, patch: { parentId?: string | null; order?: number }) => {
      await api.updatePage(id, patch);
      await refreshList();
    },
    [refreshList],
  );

  return {
    pages,
    selectedId,
    currentPage,
    mode,
    setMode,
    cameFromPages,
    setCameFromPages,
    loading,
    error,
    refreshList,
    loadPage,
    saveCurrent,
    reparent,
    createPage,
    removePage,
    renamePage,
    movePage,
    setCurrentPage,
  };
}
