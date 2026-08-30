import { useState } from 'react';
import type { Field, LinkAction, LinkOpenIn, LinkType, OptionList } from '../types';
import { FIELD_TYPES, OPTION_FIELD_TYPES } from '../types';
import styles from './FieldEditor.module.css';

interface Props {
  field: Field;
  linkTargets: { id: string; name: string }[];
  optionLists: OptionList[];
  onChange: (updated: Field) => void;
  onDelete: () => void;
}

export function FieldEditor({ field, linkTargets, optionLists, onChange, onDelete }: Props) {
  const [newOption, setNewOption] = useState('');
  const hasOptions = OPTION_FIELD_TYPES.includes(field.type);
  const usesList = !!field.optionListId;

  const update = (patch: Partial<Field>) => onChange({ ...field, ...patch });

  const addOption = () => {
    const v = newOption.trim();
    if (!v) return;
    const options = [...(field.options ?? []), v];
    update({ options });
    setNewOption('');
  };
  const removeOption = (i: number) => {
    update({ options: (field.options ?? []).filter((_, idx) => idx !== i) });
  };

  const updateLink = (patch: Partial<NonNullable<Field['link']>>) => {
    const link = { ...(field.link ?? { type: 'page' as LinkType }), ...patch };
    update({ link });
  };

  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        <span className={styles.type}>{FIELD_TYPES.find((t) => t.value === field.type)?.label}</span>
        <button className={styles.del} onClick={onDelete}>
          Delete
        </button>
      </div>

      <label className={styles.field}>
        <span>Label</span>
        <input value={field.label} onChange={(e) => update({ label: e.target.value })} />
      </label>

      {field.type !== 'button' && (
        <>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={!!field.required}
              onChange={(e) => update({ required: e.target.checked })}
            />
            Required (must field)
          </label>

          {(field.type === 'input' || field.type === 'textarea') && (
            <label className={styles.field}>
              <span>Placeholder</span>
              <input
                value={field.placeholder ?? ''}
                onChange={(e) => update({ placeholder: e.target.value })}
              />
            </label>
          )}

          {hasOptions && (
            <div className={styles.options}>
              <span className={styles.optTitle}>Options</span>

              <label className={styles.field}>
                <span>Option source</span>
                <select
                  value={field.optionListId ?? ''}
                  onChange={(e) => {
                    const listId = e.target.value || undefined;
                    update({
                      optionListId: listId,
                      options: listId ? undefined : field.options ?? ['Option 1'],
                    });
                  }}
                >
                  <option value="">Inline (type below)</option>
                  {optionLists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </label>

              {usesList ? (
                <p className={styles.hint}>Managed in the Lists tab.</p>
              ) : (
                <>
                  <ul>
                    {(field.options ?? []).map((o, i) => (
                      <li key={i}>
                        <span>{o}</span>
                        <button onClick={() => removeOption(i)}>×</button>
                      </li>
                    ))}
                  </ul>
                  <div className={styles.optAdd}>
                    <input
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      placeholder="Add option"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                    />
                    <button onClick={addOption}>Add</button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {field.type === 'button' && (
        <div className={styles.link}>
          <span className={styles.optTitle}>Link Settings</span>

          <label className={styles.field}>
            <span>Link Type</span>
            <select
              value={field.link?.type ?? 'page'}
              onChange={(e) => updateLink({ type: e.target.value as LinkType })}
            >
              <option value="page">Page</option>
              <option value="url">External URL</option>
              <option value="action">Action</option>
            </select>
          </label>

          {field.link?.type === 'page' && (
            <label className={styles.field}>
              <span>Target Page</span>
              <select
                value={field.link?.targetPageId ?? ''}
                onChange={(e) => updateLink({ targetPageId: e.target.value })}
              >
                <option value="">— Select page —</option>
                {linkTargets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {field.link?.type === 'url' && (
            <label className={styles.field}>
              <span>URL</span>
              <input
                value={field.link?.url ?? ''}
                placeholder="https://example.com"
                onChange={(e) => updateLink({ url: e.target.value })}
              />
            </label>
          )}

          {field.link?.type === 'action' && (
            <label className={styles.field}>
              <span>Action</span>
              <select
                value={field.link?.action ?? 'submit'}
                onChange={(e) => updateLink({ action: e.target.value as LinkAction })}
              >
                <option value="submit">Submit Form</option>
                <option value="back">Go Back</option>
                <option value="close">Close</option>
              </select>
            </label>
          )}

          {field.link?.type !== 'action' && (
            <label className={styles.field}>
              <span>Open in</span>
              <select
                value={field.link?.openIn ?? 'same'}
                onChange={(e) => updateLink({ openIn: e.target.value as LinkOpenIn })}
              >
                <option value="same">Same window</option>
                <option value="new">New tab</option>
              </select>
            </label>
          )}
        </div>
      )}
    </div>
  );
}
