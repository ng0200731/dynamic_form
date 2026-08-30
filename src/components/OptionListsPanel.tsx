import { useState } from 'react';
import type { Page, OptionList } from '../types';
import { api } from '../api';
import styles from './OptionListsPanel.module.css';

interface Props {
  page: Page;
  onChanged: (id: string) => void;
}

export function OptionListsPanel({ page, onChanged }: Props) {
  const [newListName, setNewListName] = useState('');
  const [newOption, setNewOption] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ listId: string; name: string } | null>(null);

  const lists = page.optionLists ?? [];

  const reload = () => onChanged(page.id);

  const handleCreateList = async () => {
    const name = newListName.trim();
    if (!name) return;
    setError(null);
    try {
      await api.optionLists.create(page.id, name);
      setNewListName('');
      reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleRename = async (listId: string, name: string) => {
    setError(null);
    try {
      await api.optionLists.rename(page.id, listId, name);
      reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleDelete = async (listId: string) => {
    setConfirm(null);
    setError(null);
    try {
      await api.optionLists.remove(page.id, listId);
      reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleReorder = async (listId: string, dir: -1 | 1) => {
    const idx = lists.findIndex((l) => l.id === listId);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= lists.length) return;
    const ordered = [...lists];
    [ordered[idx], ordered[swap]] = [ordered[swap], ordered[idx]];
    setError(null);
    try {
      await api.optionLists.reorder(
        page.id,
        ordered.map((l) => l.id),
      );
      reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleAddOption = async (list: OptionList) => {
    const value = (newOption[list.id] ?? '').trim();
    if (!value) return;
    setError(null);
    try {
      await api.optionLists.addOption(page.id, list.id, value);
      setNewOption((s) => ({ ...s, [list.id]: '' }));
      reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleRemoveOption = async (list: OptionList, value: string) => {
    setError(null);
    try {
      await api.optionLists.removeOption(page.id, list.id, value);
      reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleReorderOption = async (list: OptionList, value: string, dir: -1 | 1) => {
    const idx = list.options.indexOf(value);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= list.options.length) return;
    const opts = [...list.options];
    [opts[idx], opts[swap]] = [opts[swap], opts[idx]];
    setError(null);
    try {
      await api.optionLists.setOptions(page.id, list.id, opts);
      reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>Option Lists — {page.name}</h2>
      <p className={styles.sub}>
        Named dropdown/radio option lists owned by this page. Reference them from a field's
        “Option source” in the Edit tab.
      </p>

      {error && <div className={styles.error}>{error}</div>}

      {lists.length === 0 && <p className={styles.empty}>No lists yet. Add one below.</p>}

      {lists.map((list, li) => (
        <div key={list.id} className={styles.box}>
          <div className={styles.boxHead}>
            <div className={styles.reorder}>
              <button
                title="Move list up"
                disabled={li === 0}
                onClick={() => handleReorder(list.id, -1)}
              >
                ▲
              </button>
              <button
                title="Move list down"
                disabled={li === lists.length - 1}
                onClick={() => handleReorder(list.id, 1)}
              >
                ▼
              </button>
            </div>
            <input
              className={styles.boxName}
              value={list.name}
              onChange={(e) => handleRename(list.id, e.target.value)}
            />
            <button className={styles.delBox} onClick={() => setConfirm({ listId: list.id, name: list.name })}>
              ✕ Delete list
            </button>
          </div>

          <ul className={styles.optList}>
            {list.options.map((o, oi) => (
              <li key={o}>
                <div className={styles.reorder}>
                  <button
                    title="Move up"
                    disabled={oi === 0}
                    onClick={() => handleReorderOption(list, o, -1)}
                  >
                    ▲
                  </button>
                  <button
                    title="Move down"
                    disabled={oi === list.options.length - 1}
                    onClick={() => handleReorderOption(list, o, 1)}
                  >
                    ▼
                  </button>
                </div>
                <span className={styles.optVal}>{o}</span>
                <button className={styles.delOpt} onClick={() => handleRemoveOption(list, o)}>
                  ✕
                </button>
              </li>
            ))}
            {list.options.length === 0 && <li className={styles.optEmpty}>No options yet.</li>}
          </ul>

          <div className={styles.optAdd}>
            <input
              value={newOption[list.id] ?? ''}
              onChange={(e) => setNewOption((s) => ({ ...s, [list.id]: e.target.value }))}
              placeholder="New option"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption(list))}
            />
            <button onClick={() => handleAddOption(list)}>Add</button>
          </div>
        </div>
      ))}

      <div className={styles.addList}>
        <input
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          placeholder="New list name (e.g. Country)"
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateList())}
        />
        <button onClick={handleCreateList}>+ Add list</button>
      </div>

      {confirm && (
        <div className={styles.modalBackdrop} onClick={() => setConfirm(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p>
              Delete the list <strong>{confirm.name}</strong> and all its options? Fields referencing
              it will fall back to inline options.
            </p>
            <div className={styles.modalActions}>
              <button onClick={() => setConfirm(null)}>Cancel</button>
              <button className={styles.delBox} onClick={() => handleDelete(confirm.listId)}>
                Delete list
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
