import { useMemo, useState } from 'react';
import type { Field, Page } from '../types';
import styles from './Preview.module.css';

interface Props {
  page: Page;
  onNavigate: (pageId: string, openIn: 'same' | 'new') => void;
  onBack: () => void;
}

interface Values {
  [fieldId: string]: string;
}

export function Preview({ page, onNavigate, onBack }: Props) {
  const [values, setValues] = useState<Values>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Flat list of non-button fields for validation.
  const allFields = useMemo(() => {
    const out: Field[] = [];
    page.rows.forEach((r) => r.fields.forEach((f) => out.push(f)));
    return out;
  }, [page]);

  const setValue = (id: string, v: string) => {
    setValues((prev) => ({ ...prev, [id]: v }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    allFields.forEach((f) => {
      if (f.type === 'button') return;
      if (f.required && !(values[f.id] ?? '').trim()) {
        next[f.id] = `${f.label} is required`;
      }
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      setMessage({ kind: 'ok', text: 'Form submitted successfully.' });
    } else {
      setMessage({ kind: 'err', text: 'Please fill in all required fields.' });
    }
  };

  const handleAction = (f: Field) => {
    const link = f.link;
    if (!link) return;
    if (link.type === 'page' && link.targetPageId) {
      onNavigate(link.targetPageId, link.openIn ?? 'same');
    } else if (link.type === 'url' && link.url) {
      window.open(link.url, link.openIn === 'new' ? '_blank' : '_self');
    } else if (link.type === 'action') {
      if (link.action === 'submit') handleSubmit();
      else if (link.action === 'back') {
        onBack();
      } else if (link.action === 'close') {
        setMessage(null);
      }
    }
  };

  const optionsFor = (f: Field): string[] => {
    if (f.globalTemplateId) {
      return page.globalTemplates?.find((t) => t.id === f.globalTemplateId)?.options ?? [];
    }
    if (f.optionListId) {
      return page.optionLists?.find((l) => l.id === f.optionListId)?.options ?? [];
    }
    return f.options ?? [];
  };

  const renderField = (f: Field) => {
    const value = values[f.id] ?? '';
    const err = errors[f.id];
    const opts = optionsFor(f);
    switch (f.type) {
      case 'input':
        return (
          <label className={styles.field}>
            <span>
              {f.label}
              {f.required && <em className={styles.req}>*</em>}
            </span>
            <input
              value={value}
              placeholder={f.placeholder}
              onChange={(e) => setValue(f.id, e.target.value)}
            />
            {err && <small className={styles.err}>{err}</small>}
          </label>
        );
      case 'textarea':
        return (
          <label className={styles.field}>
            <span>
              {f.label}
              {f.required && <em className={styles.req}>*</em>}
            </span>
            <textarea
              value={value}
              placeholder={f.placeholder}
              onChange={(e) => setValue(f.id, e.target.value)}
            />
            {err && <small className={styles.err}>{err}</small>}
          </label>
        );
      case 'dropdown':
        return (
          <label className={styles.field}>
            <span>
              {f.label}
              {f.required && <em className={styles.req}>*</em>}
            </span>
            <select value={value} onChange={(e) => setValue(f.id, e.target.value)}>
              <option value="">— Select —</option>
              {opts.map((o, i) => (
                <option key={i} value={o}>
                  {o}
                </option>
              ))}
            </select>
            {err && <small className={styles.err}>{err}</small>}
          </label>
        );
      case 'radio':
        return (
          <div className={styles.field}>
            <span>
              {f.label}
              {f.required && <em className={styles.req}>*</em>}
            </span>
            <div className={styles.radioGroup}>
              {opts.map((o, i) => (
                <label key={i} className={styles.radio}>
                  <input
                    type="radio"
                    name={f.id}
                    checked={value === o}
                    onChange={() => setValue(f.id, o)}
                  />
                  {o}
                </label>
              ))}
            </div>
            {err && <small className={styles.err}>{err}</small>}
          </div>
        );
      case 'image':
        return (
          <div className={styles.field}>
            <span>{f.label}</span>
            <input type="file" accept="image/*" />
          </div>
        );
      case 'button':
        return (
          <button
            type="button"
            className={styles.button}
            onClick={() => handleAction(f)}
          >
            {f.label}
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.preview}>
      <h1 className={styles.title}>{page.name}</h1>
      {allFields.length === 0 && <p className={styles.empty}>This page has no fields yet.</p>}
      <div className={styles.form}>
        {page.rows.map((row) => (
          <div
            key={row.id}
            className={row.columns === 2 ? styles.cols2 : styles.cols1}
          >
            {Array.from({ length: row.columns }).map((_, colIdx) => (
              <div key={colIdx} className={styles.col}>
                {row.fields
                  .filter((_, i) => i % row.columns === colIdx)
                  .map((f) => (
                    <div key={f.id}>{renderField(f)}</div>
                  ))}
              </div>
            ))}
          </div>
        ))}
      </div>
      {message && (
        <p className={message.kind === 'ok' ? styles.okMsg : styles.errMsg}>{message.text}</p>
      )}
    </div>
  );
}
