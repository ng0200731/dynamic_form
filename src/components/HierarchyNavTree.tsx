import type { HierarchyNode } from '../types';
import { buildHierarchyTree, type HierarchyTreeNode } from '../hooks/tree';
import styles from './PageTree.module.css';

interface Props {
  nodes: HierarchyNode[];
  selectedId: string | null;
  onSelect: (pageId: string) => void;
}

// Left-menu navigation tree that mirrors the Hierarchy skeleton exactly.
// Each node is labeled by its hierarchy name. Clicking navigates to the page
// linked to that level (pageId); unlinked levels are shown dimmed and inert.
export function HierarchyNavTree({ nodes, selectedId, onSelect }: Props) {
  const tree = buildHierarchyTree(nodes);

  const renderNode = (node: HierarchyTreeNode, depth: number) => {
    const pageId = node.node.pageId;
    const isLinked = Boolean(pageId);
    const isSelected = isLinked && selectedId === pageId;

    return (
      <li key={node.node.id}>
        <button
          type="button"
          className={`${styles.node} ${isSelected ? styles.selected : ''} ${
            !isLinked ? styles.empty : ''
          }`}
          style={{ paddingLeft: 8 + depth * 16 }}
          onClick={() => pageId && onSelect(pageId)}
          title={isLinked ? 'Open linked page' : 'Unlinked level'}
          disabled={!isLinked}
        >
          <span className={styles.dot} />
          {node.node.name}
          {!isLinked && <span className={styles.unlinkedTag}>· no page</span>}
        </button>
        {node.children.length > 0 && (
          <ul className={styles.children}>
            {node.children.map((c) => renderNode(c, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  if (tree.length === 0) {
    return <p className={styles.empty}>No skeleton levels yet. Build one in Hierarchy.</p>;
  }

  return (
    <ul className={styles.tree} style={{ marginTop: 4 }}>
      {tree.map((n) => renderNode(n, 0))}
    </ul>
  );
}