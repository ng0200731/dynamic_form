import { useEffect, useState } from 'react';
import type { Field, FieldType, Page, Row } from '../types';
import { FIELD_TYPES } from '../types';
import { api, localId } from '../api';
import { FieldEditor } from './FieldEditor';
import styles from './Editor.module.css';

interface Props {
  page: Page;
  onSave: (rows: Row[]) => Promise<void>;
}

function newField(type: FieldType): Field {
  const base: Field = {
    id: localId(),
    type,
    label: FIELD_TYPES.find((t) => t.value === type)?.label ?? type,
  };
  if (type === 'button') base.link = { type: 'page' };
  if (type === 'dropdown' || type === 'radio') base.options = ['Option 1'];
  return base;
}

export function Editor({ page, onSave }: Props) {
  const [rows, setRows] = useState<Row[]>(page.rows);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [linkTargets, setLinkTargets] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState(false);

  useEffect(() => {
    setRows(page.rows);
    setSelectedFieldId(null);
  }, [page.id, page.rows]);

  useEffect(() => {
    api.linkTargets(page.id).then(setLinkTargets).catch(() => setLinkTargets([]));
  }, [page.id]);

  const addRow = (columns: 1 | 2) => {
    setRows((r) => [...r, { id: localId(), columns, fields: [] }]);
  };

  const deleteRow = (rowId: string) => {
    setRows((r) => r.filter((row) => row.id !== rowId));
  };

  const addField = (rowId: string, type: FieldType) => {
    setRows((r) =>
      r.map((row) =>
        row.id === rowId ? { ...row, fields: [...row.fields, newField(type)] } : row,
      ),
    );
  };

  const updateField = (rowId: string, updated: Field) => {
    setRows((r) =>
      r.map((row) =>
        row.id === rowId
          ? { ...row, fields: row.fields.map((f) => (f.id === updated.id ? updated : f)) }
          : row,
      ),
    );
  };

  const deleteField = (rowId: string, fieldId: string) => {
    setRows((r) =>
      r.map((row) =>
        row.id === rowId ? { ...row, fields: row.fields.filter((f) => f.id !== fieldId) } : row,
      ),
    );
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(rows);
      setSavedNote(true);
      setTimeout(() => setSavedNote(false), 1500);
    } finally {
      setSaving(false);
    }
  };

  const selectedField = (() => {
    for (const row of rows) {
      const f = row.fields.find((x) => x.id === selectedFieldId);
      if (f) return { field: f, rowId: row.id };
    }
    return null;
  })();

  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        <button onClick={() => addRow(1)}>+ 1-Column Row</button>
        <button onClick={() => addRow(2)}>+ 2-Column Row</button>
        <span className={styles.spacer} />
        {savedNote && <span className={styles.saved}>Saved ✓</span>}
        <button className={styles.save} onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.canvas}>
          {rows.length === 0 && (
            <p className={styles.empty}>Add a row to start building this page.</p>
          )}
          {rows.map((row) => (
            <div key={row.id} className={styles.row}>
              <div className={styles.rowHead}>
                <span>{row.columns === 1 ? '1 Column' : '2 Columns'}</span>
                <button className={styles.rowDel} onClick={() => deleteRow(row.id)}>
                  Delete row
                </button>
              </div>
              <div
                className={row.columns === 2 ? styles.cols2 : styles.cols1}
              >
                {Array.from({ length: row.columns }).map((_, colIdx) => {
                  const colFields = row.fields.filter((_, i) => i % row.columns === colIdx);
                  return (
                    <div key={colIdx} className={styles.col}>
                      {colFields.map((f) => (
                        <button
                          key={f.id}
                          className={`${styles.fieldChip} ${
                            selectedFieldId === f.id ? styles.chipSelected : ''
                          }`}
                          onClick={() => setSelectedFieldId(f.id)}
                        >
                          {f.label}
                          {f.type === 'button' && ' ▸'}
                        </button>
                      ))}
                      <AddFieldMenu onAdd={(t) => addField(row.id, t)} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {selectedField && (
          <div className={styles.sidePanel}>
            <FieldEditor
              field={selectedField.field}
              linkTargets={linkTargets}
              optionLists={page.optionLists ?? []}
              onChange={(u) => updateField(selectedField.rowId, u)}
              onDelete={() => deleteField(selectedField.rowId, selectedField.field.id)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function AddFieldMenu({ onAdd }: { onAdd: (t: FieldType) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.addMenu}>
      <button className={styles.addBtn} onClick={() => setOpen((o) => !o)}>
        + Add Field
      </button>
      {open && (
        <>
          <div className={styles.menuOverlay} onClick={() => setOpen(false)} />
          <div className={styles.menuDialog}>
            <h3 className={styles.menuTitle}>Add Field</h3>
            <div className={styles.menuGrid}>
              {FIELD_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => {
                    onAdd(t.value);
                    setOpen(false);
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button className={styles.menuCancel} onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
