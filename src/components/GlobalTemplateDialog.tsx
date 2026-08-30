import { useState } from 'react';
import type { FieldType, InputMode } from '../types';
import { api } from '../api';
import styles from './CreatePageDialog.module.css';

interface Props {
  onClose: () => void;
  onSaved?: () => void;
}

const TEMPLATE_TYPES: { value: FieldType; label: string }[] = [
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'radio', label: 'Radio' },
  { value: 'input', label: 'input' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'button', label: 'Button' },
  { value: 'image', label: 'Image' },
];

const OPTION_TYPES: FieldType[] = ['dropdown', 'radio'];

export function GlobalTemplateDialog({ onClose, onSaved }: Props) {
  const [name, setName] = useState('');
  const [type, setType] = useState<FieldType | ''>('');
  const [options, setOptions] = useState<string[]>([]);
  const [inputMode, setInputMode] = useState<InputMode>('alphanumeric');
  const [newOption, setNewOption] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const needsOptions = type ? OPTION_TYPES.includes(type) : false;

  const addOption = () => {
    const v = newOption.trim();
    if (!v || options.includes(v)) return;
    setOptions((o) => [...o, v]);
    setNewOption('');
  };

  const removeOption = (v: string) => {
    setOptions((o) => o.filter((x) => x !== v));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a unique name for this form element.');
      return;
    }
    if (!type) {
      setError('Please select a field type.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const finalInputMode = type === 'input' ? inputMode : undefined;
      await api.globalTemplates.create(name.trim(), type, options, finalInputMode);
      onSaved?.();
      onClose();
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.toLowerCase().includes('already exists')) {
        setError('A template with that name already exists. Choose a unique name.');
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <h2 className={styles.title}>Global Form Element</h2>
        <form onSubmit={submit}>
          <label className={styles.field}>
            <span>Field type</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {TEMPLATE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  style={{
                    padding: '10px',
                    border: `1px solid ${type === t.value ? 'var(--accent)' : 'var(--border)'}`,
                    background: type === t.value ? 'rgba(47,109,246,0.08)' : '#fff',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </label>

          <label className={styles.field}>
            <span>Unique name</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Payment Method"
            />
          </label>

          {type === 'input' && (
            <label className={styles.field}>
              <span>Input restriction</span>
              <select
                value={inputMode}
                onChange={(e) => setInputMode(e.target.value as InputMode)}
              >
                <option value="numeric">Numeric only</option>
                <option value="alphabet">Alphabet only</option>
                <option value="alphanumeric">Numeric + Alphabet</option>
              </select>
            </label>
          )}

          {needsOptions && (
            <label className={styles.field}>
              <span>Options</span>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 8px' }}>
                {options.map((o) => (
                  <li
                    key={o}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#eef2f7',
                      borderRadius: 4,
                      padding: '4px 8px',
                      marginBottom: 4,
                    }}
                  >
                    <span>{o}</span>
                    <button type="button" onClick={() => removeOption(o)} style={{ border: 'none', background: 'transparent' }}>
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="New option"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                />
                <button type="button" className={styles.cancel} onClick={addOption}>
                  Add
                </button>
              </div>
            </label>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className={styles.submit} disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
