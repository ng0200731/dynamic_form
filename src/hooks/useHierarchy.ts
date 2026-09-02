import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import type { HierarchyNode } from '../types';

export function useHierarchy() {
  const [nodes, setNodes] = useState<HierarchyNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.listHierarchy();
      setNodes(list);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createNode = useCallback(
    async (name: string, parentId: string | null) => {
      const created = await api.createHierarchyNode(name, parentId);
      await refresh();
      return created;
    },
    [refresh],
  );

  const renameNode = useCallback(
    async (id: string, name: string) => {
      await api.updateHierarchyNode(id, { name });
      await refresh();
    },
    [refresh],
  );

  const moveNode = useCallback(
    async (id: string, patch: { parentId?: string | null; order?: number }) => {
      await api.updateHierarchyNode(id, patch);
      await refresh();
    },
    [refresh],
  );

  const deleteNode = useCallback(
    async (id: string) => {
      await api.deleteHierarchyNode(id);
      await refresh();
    },
    [refresh],
  );

  return {
    nodes,
    loading,
    error,
    refresh,
    createNode,
    renameNode,
    moveNode,
    deleteNode,
  };
}
