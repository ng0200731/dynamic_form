import { useMemo } from 'react';
import type { HierarchyNode, PageSummary } from '../types';

export interface TreeNode {
  page: PageSummary;
  children: TreeNode[];
}

export interface HierarchyTreeNode {
  node: HierarchyNode;
  children: HierarchyTreeNode[];
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

// Build a hierarchy tree from a flat list of HierarchyNode rows.
export function buildHierarchyTree(nodes: HierarchyNode[]): HierarchyTreeNode[] {
  const byId = new Map<string, HierarchyTreeNode>();
  nodes.forEach((n) => byId.set(n.id, { node: n, children: [] }));
  const roots: HierarchyTreeNode[] = [];
  nodes.forEach((n) => {
    const treeNode = byId.get(n.id)!;
    if (n.parentId && byId.has(n.parentId)) {
      byId.get(n.parentId)!.children.push(treeNode);
    } else {
      roots.push(treeNode);
    }
  });
  const sortRec = (arr: HierarchyTreeNode[]) => {
    arr.sort((a, b) => a.node.order - b.node.order);
    arr.forEach((t) => sortRec(t.children));
  };
  sortRec(roots);
  return roots;
}

export function useHierarchyTree(nodes: HierarchyNode[]): HierarchyTreeNode[] {
  return useMemo(() => buildHierarchyTree(nodes), [nodes]);
}
