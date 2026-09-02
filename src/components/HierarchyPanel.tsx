import { useEffect, useMemo, useRef, useState } from 'react';
import type { HierarchyNode, PageSummary } from '../types';
import { buildHierarchyTree, type HierarchyTreeNode } from '../hooks/tree';
import styles from './HierarchyPanel.module.css';

interface Props {
  nodes: HierarchyNode[];
  pages: PageSummary[];
  onRename: (id: string, name: string) => Promise<void>;
  onMove: (id: string, patch: { parentId?: string | null; order?: number }) => Promise<void>;
  onCreate: (name: string, parentId: string | null) => Promise<{ id: string }>;
  onDelete: (id: string) => Promise<void>;
  availablePages: (nodeId: string) => Promise<PageSummary[]>;
  onAssignPage: (nodeId: string, pageId: string | null) => Promise<HierarchyNode>;
}

interface AddingState {
  parentId: string | null;
  parentName: string;
  depth: number;
}

export function HierarchyPanel({ nodes, pages, onRename, onMove, onCreate, onDelete, availablePages, onAssignPage }: Props) {
  const [addingUnder, setAddingUnder] = useState<AddingState | null>(null);
  const [newChildName, setNewChildName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Page-linking dropdown per node.
  const [linkOpenId, setLinkOpenId] = useState<string | null>(null);
  const [available, setAvailable] = useState<PageSummary[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);

  const addInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const linkRef = useRef<HTMLDivElement>(null);

  const tree = useMemo(() => buildHierarchyTree(nodes), [nodes]);

  // Close the page-link dropdown when clicking outside.
  useEffect(() => {
    if (!linkOpenId) return;
    const handler = (e: MouseEvent) => {
      if (linkRef.current && !linkRef.current.contains(e.target as Node)) {
        setLinkOpenId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [linkOpenId]);

  const toggleLinkDropdown = async (nodeId: string) => {
    if (linkOpenId === nodeId) {
      setLinkOpenId(null);
      return;
    }
    setLinkOpenId(nodeId);
    setLoadingPages(true);
    setError(null);
    try {
      setAvailable(await availablePages(nodeId));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingPages(false);
    }
  };

  const handleLinkPage = async (nodeId: string, pageId: string) => {
    setError(null);
    try {
      await onAssignPage(nodeId, pageId);
      setLinkOpenId(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleUnlink = async (nodeId: string) => {
    setError(null);
    try {
      await onAssignPage(nodeId, null);
      setLinkOpenId(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    if (addingUnder) {
      setTimeout(() => {
        addInputRef.current?.focus();
      }, 50);
    }
  }, [addingUnder]);

  useEffect(() => {
    if (editingId) {
      setTimeout(() => {
        editInputRef.current?.focus();
        editInputRef.current?.select();
      }, 50);
    }
  }, [editingId]);

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setCollapsedIds(new Set());
  const collapseAll = () => {
    const allParentIds = new Set<string>();
    const collect = (arr: HierarchyTreeNode[]) => {
      arr.forEach((n) => {
        if (n.children.length > 0) {
          allParentIds.add(n.node.id);
          collect(n.children);
        }
      });
    };
    collect(tree);
    setCollapsedIds(allParentIds);
  };

  const startAddChild = (parentId: string | null, parentName: string, depth: number) => {
    setError(null);
    setAddingUnder({ parentId, parentName, depth });
    setNewChildName('');
  };

  const cancelAddChild = () => {
    setAddingUnder(null);
    setNewChildName('');
  };

  const handleCreateChild = async () => {
    const name = newChildName.trim();
    if (!name) {
      setError('Please enter a name.');
      return;
    }
    setError(null);
    setIsCreating(true);
    try {
      await onCreate(name, addingUnder ? addingUnder.parentId : null);
      setAddingUnder(null);
      setNewChildName('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const startRename = (node: HierarchyNode) => {
    setError(null);
    setEditingId(node.id);
    setEditingName(node.name);
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleCommitRename = async (id: string) => {
    const name = editingName.trim();
    if (!name) {
      cancelRename();
      return;
    }
    const node = nodes.find((n) => n.id === id);
    if (node && node.name === name) {
      cancelRename();
      return;
    }
    setError(null);
    setIsRenaming(true);
    try {
      await onRename(id, name);
      setEditingId(null);
      setEditingName('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleReorder = async (
    siblings: HierarchyTreeNode[],
    index: number,
    direction: -1 | 1,
  ) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;
    setError(null);
    try {
      const current = siblings[index].node;
      const target = siblings[targetIndex].node;
      await onMove(current.id, { order: target.order });
      await onMove(target.id, { order: current.order });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleDelete = async (node: HierarchyNode) => {
    setError(null);
    if (!confirm(`Delete "${node.name}" and all its children from the skeleton?`)) return;
    try {
      await onDelete(node.id);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const startReparent = (node: HierarchyNode) => {
    setError(null);
    const choice = prompt(
      `Move "${node.name}" under which node?\n\n` +
        `• Type a node's exact name to set as new parent\n` +
        `• Type "/" (or leave empty) to move to root (Level 1)\n` +
        `• Press Cancel to abort\n\n` +
        `Available nodes:\n` +
        nodes
          .filter((n) => n.id !== node.id)
          .map((n) => `  - ${n.name}`)
          .join('\n'),
    );
    if (choice === null) return;
    const trimmed = choice.trim();
    let parentId: string | null;
    if (trimmed === '' || trimmed === '/') {
      parentId = null;
    } else {
      const target = nodes.find((n) => n.name === trimmed);
      if (!target) {
        setError(`No node named "${trimmed}"`);
        return;
      }
      parentId = target.id;
    }
    const maxOrder = nodes
      .filter((n) => (parentId ? n.parentId === parentId : !n.parentId))
      .reduce((m, p) => Math.max(m, p.order), -1);
    onMove(node.id, { parentId, order: maxOrder + 1 }).catch((e) =>
      setError((e as Error).message),
    );
  };

  const matchesSearch = (node: HierarchyTreeNode): boolean => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (node.node.name.toLowerCase().includes(q)) return true;
    return node.children.some(matchesSearch);
  };

  const renderTreeNode = (
    node: HierarchyTreeNode,
    depth: number,
    index: number,
    siblings: HierarchyTreeNode[],
  ) => {
    if (!matchesSearch(node)) return null;

    const isEditing = editingId === node.node.id;
    const isAddingHere = addingUnder?.parentId === node.node.id;
    const isCollapsed = collapsedIds.has(node.node.id);
    const hasChildren = node.children.length > 0;
    const dashes = '-'.repeat(depth);

    return (
      <div key={node.node.id} className={styles.treeBranch}>
        <div
          className={styles.treeRow}
          style={{ paddingLeft: `${(depth - 1) * 28 + 12}px` }}
        >
          <div className={styles.guideWrapper}>
            {Array.from({ length: depth - 1 }).map((_, i) => (
              <span key={i} className={styles.guideLine} style={{ left: `${i * 28 + 20}px` }} />
            ))}
          </div>

          <div className={styles.dashPrefix} title={`Level ${depth}`}>
            <span className={styles.dashText}>{dashes}</span>
          </div>

          {hasChildren ? (
            <button
              type="button"
              className={styles.caretBtn}
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse(node.node.id);
              }}
              title={isCollapsed ? 'Expand children' : 'Collapse children'}
            >
              <svg
                className={`${styles.caretIcon} ${isCollapsed ? styles.caretCollapsed : ''}`}
                viewBox="0 0 24 24"
                width="14"
                height="14"
                stroke="currentColor"
                strokeWidth="2.5"
                fill="none"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          ) : (
            <span className={styles.caretPlaceholder} />
          )}

          <div className={styles.nameArea}>
            {isEditing ? (
              <div className={styles.inlineEditForm}>
                <input
                  ref={editInputRef}
                  type="text"
                  className={styles.renameInput}
                  value={editingName}
                  disabled={isRenaming}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCommitRename(node.node.id);
                    if (e.key === 'Escape') cancelRename();
                  }}
                />
                <button
                  type="button"
                  className={styles.inlineSaveBtn}
                  onClick={() => handleCommitRename(node.node.id)}
                  disabled={isRenaming}
                >
                  Save
                </button>
                <button
                  type="button"
                  className={styles.inlineCancelBtn}
                  onClick={cancelRename}
                  disabled={isRenaming}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div
                className={styles.nameDisplay}
                onDoubleClick={() => startRename(node.node)}
                title="Double-click to rename"
              >
                <span className={styles.pageName}>{node.node.name}</span>
                <span className={styles.levelBadge}>Level {depth}</span>
                {node.node.pageId && (
                  <span className={styles.linkedPageBadge}>
                    Page: {pages.find((p) => p.id === node.node.pageId)?.name ?? 'Linked'}
                  </span>
                )}
                {hasChildren && (
                  <span className={styles.childCountBadge}>
                    {node.children.length} {node.children.length === 1 ? 'child' : 'children'}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className={styles.actionsBar}>
            <div className={styles.reorderGroup}>
              <button
                type="button"
                className={styles.reorderBtn}
                disabled={index === 0}
                onClick={() => handleReorder(siblings, index, -1)}
                title="Move Up"
              >
                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              </button>
              <button
                type="button"
                className={styles.reorderBtn}
                disabled={index === siblings.length - 1}
                onClick={() => handleReorder(siblings, index, 1)}
                title="Move Down"
              >
                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </div>

            {!isEditing && (
              <button
                type="button"
                className={styles.actionIconBtn}
                onClick={() => startRename(node.node)}
                title="Rename"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}

            <button
              type="button"
              className={styles.actionIconBtn}
              onClick={() => startReparent(node.node)}
              title="Move to a different parent"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
            </button>

            <div
              className={styles.pageLinkWrap}
              ref={linkOpenId === node.node.id ? linkRef : undefined}
            >
              <button
                type="button"
                className={styles.goPagesBtn}
                onClick={() => toggleLinkDropdown(node.node.id)}
                title={node.node.pageId ? 'Change linked page' : 'Link a page to this level'}
              >
                <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" strokeWidth="2" fill="none">
                  <path d="M3 5h18v14H3z" />
                  <path d="M7 9h10M7 13h6" />
                </svg>
                <span>{node.node.pageId ? 'Change Page' : 'Link Page'}</span>
              </button>
              {linkOpenId === node.node.id && (
                <div className={styles.pageLinkMenu}>
                  <div className={styles.pageLinkTitle}>Link a page</div>
                  {loadingPages ? (
                    <div className={styles.pageLinkEmpty}>Loading pages…</div>
                  ) : available.length === 0 ? (
                    <div className={styles.pageLinkEmpty}>No unlinked pages available.</div>
                  ) : (
                    available.map((page) => (
                      <button
                        key={page.id}
                        type="button"
                        className={styles.pageLinkOption}
                        onClick={() => handleLinkPage(node.node.id, page.id)}
                      >
                        <span>{page.name}</span>
                        <small>/{page.slug}</small>
                      </button>
                    ))
                  )}
                  {node.node.pageId && (
                    <button
                      type="button"
                      className={styles.unlinkPageBtn}
                      onClick={() => handleUnlink(node.node.id)}
                    >
                      Unlink current page
                    </button>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              className={styles.addBtn}
              onClick={() => startAddChild(node.node.id, node.node.name, depth + 1)}
              title={`Add Level ${depth + 1} child under "${node.node.name}"`}
            >
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" strokeWidth="3" fill="none">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>+</span>
            </button>

            <button
              type="button"
              className={styles.delBtn}
              onClick={() => handleDelete(node.node)}
              title={`Delete "${node.node.name}"`}
            >
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" strokeWidth="3" fill="none">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>-</span>
            </button>
          </div>
        </div>

        {isAddingHere && (
          <div
            className={styles.inlineAddRow}
            style={{ paddingLeft: `${depth * 28 + 12}px` }}
          >
            <div className={styles.dashPrefix}>
              <span className={styles.dashText}>{'-'.repeat(depth + 1)}</span>
            </div>
            <div className={styles.inlineAddForm}>
              <input
                ref={addInputRef}
                type="text"
                className={styles.inlineAddInput}
                placeholder={`New Level ${depth + 1} name under "${node.node.name}"...`}
                value={newChildName}
                disabled={isCreating}
                onChange={(e) => setNewChildName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateChild();
                  if (e.key === 'Escape') cancelAddChild();
                }}
              />
              <button
                type="button"
                className={styles.inlineAddSubmitBtn}
                onClick={handleCreateChild}
                disabled={isCreating}
              >
                {isCreating ? 'Creating…' : `+ Add Level ${depth + 1}`}
              </button>
              <button
                type="button"
                className={styles.inlineCancelBtn}
                onClick={cancelAddChild}
                disabled={isCreating}
                title="Cancel"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {hasChildren && !isCollapsed && (
          <div className={styles.childrenContainer}>
            {node.children.map((child, cIdx) =>
              renderTreeNode(child, depth + 1, cIdx, node.children),
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <div className={styles.titleRow}>
            <div className={styles.iconCircle}>
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </div>
            <div>
              <h2 className={styles.title}>Hierarchy</h2>
              <p className={styles.sub}>
                Build the app skeleton. Skeleton nodes are independent from pages —
                pages live in Page View only.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.controlsBar}>
          <div className={styles.searchBox}>
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search skeleton nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className={styles.statsAndToggles}>
            <span className={styles.statChip}>
              {nodes.length} {nodes.length === 1 ? 'node' : 'nodes'}
            </span>
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={expandAll}
              title="Expand all levels"
            >
              Expand All
            </button>
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={collapseAll}
              title="Collapse all sub-levels"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
          <button type="button" className={styles.dismissErrBtn} onClick={() => setError(null)}>
            ✕
          </button>
        </div>
      )}

      <div className={styles.treeCard}>
        <div className={styles.rootBox}>
          <div className={styles.rootHeader}>
            <div className={styles.rootInfo}>
              <div className={styles.rootIcon}>
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <span className={styles.rootTitle}>Root</span>
              <span className={styles.rootSubtitle}>(Base Level)</span>
            </div>

            <div className={styles.rootActions}>
              <button
                type="button"
                className={styles.rootAddBtn}
                onClick={() => startAddChild(null, 'Root', 1)}
                title="Create Level 1 skeleton node"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>(+) Add Level 1</span>
              </button>
            </div>
          </div>

          {addingUnder?.parentId === null && (
            <div className={styles.rootInlineAddRow}>
              <div className={styles.dashPrefix}>
                <span className={styles.dashText}>-</span>
              </div>
              <div className={styles.inlineAddForm}>
                <input
                  ref={addInputRef}
                  type="text"
                  className={styles.inlineAddInput}
                  placeholder="Enter Level 1 node name..."
                  value={newChildName}
                  disabled={isCreating}
                  onChange={(e) => setNewChildName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateChild();
                    if (e.key === 'Escape') cancelAddChild();
                  }}
                />
                <button
                  type="button"
                  className={styles.inlineAddSubmitBtn}
                  onClick={handleCreateChild}
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating…' : '+ Add Level 1'}
                </button>
                <button
                  type="button"
                  className={styles.inlineCancelBtn}
                  onClick={cancelAddChild}
                  disabled={isCreating}
                  title="Cancel"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.treeList}>
          {tree.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="1.5" fill="none">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              <p className={styles.emptyTitle}>No skeleton nodes yet</p>
              <p className={styles.emptyDesc}>
                Click the <strong>(+) Add Level 1</strong> button on Root above to add your first
                top-level skeleton node.
              </p>
            </div>
          ) : (
            tree.map((rootNode, rIdx) => renderTreeNode(rootNode, 1, rIdx, tree))
          )}
        </div>
      </div>
    </div>
  );
}
