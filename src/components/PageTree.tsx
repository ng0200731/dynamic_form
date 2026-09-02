import { useTree, type TreeNode } from '../hooks/tree';
import type { PageSummary } from '../types';
import styles from './PageTree.module.css';

interface Props {
  pages: PageSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function PageTree({ pages, selectedId, onSelect }: Props) {
  const tree = useTree(pages);

  const renderNode = (node: TreeNode, depth: number) => (
    <li key={node.page.id}>
      <button
        type="button"
        className={`${styles.node} ${selectedId === node.page.id ? styles.selected : ''}`}
        style={{ paddingLeft: 8 + depth * 16 }}
        onClick={() => onSelect(node.page.id)}
        title={node.page.slug}
      >
        <span className={styles.dot} />
        {node.page.name}
      </button>
      {node.children.length > 0 && (
        <ul className={styles.children}>{node.children.map((c) => renderNode(c, depth + 1))}</ul>
      )}
    </li>
  );

  if (tree.length === 0) {
    return <p className={styles.empty}>No pages yet. Create one to get started.</p>;
  }

  return (
    <ul className={styles.tree} style={{ marginTop: 4 }}>
      {tree.map((n) => renderNode(n, 0))}
    </ul>
  );
}
