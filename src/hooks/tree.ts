import { useMemo } from 'react';
import type { PageSummary } from '../types';

export interface TreeNode {
  page: PageSummary;
  children: TreeNode[];
}

// Build a hierarchy from a flat page list using parentId.
export function buildTree(pages: PageSummary[]): TreeNode[] {
  const byId = new Map<string, TreeNode>();
  pages.forEach((p) => byId.set(p.id, { page: p, children: [] }));
  const roots: TreeNode[] = [];
  pages.forEach((p) => {
    const node = byId.get(p.id)!;
    if (p.parentId && byId.has(p.parentId)) {
      byId.get(p.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortRec = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.page.order - b.page.order);
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

export function useTree(pages: PageSummary[]): TreeNode[] {
  return useMemo(() => buildTree(pages), [pages]);
}
