import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import styles from './ManagementDialog.module.css';

/** Strip the server-owned id so the form only ever edits real fields. */
function withoutId<T extends { id: string }>(item: T): Omit<T, 'id'> {
  const copy = { ...item };
  delete (copy as { id?: string }).id;
  return copy as Omit<T, 'id'>;
}

interface EntityManagerProps<T extends { id: string; name: string }> {
  /** Singular and lowercase — used in buttons and messages ("clinic"). */
  label: string;
  items: T[];
  emptyDraft: () => Omit<T, 'id'>;
  /** Secondary line shown under the name in the list. */
  summary: (item: T) => string;
  /** The entity-specific inputs for the add/edit form. */
  renderFields: (draft: Omit<T, 'id'>, update: (patch: Partial<Omit<T, 'id'>>) => void) => ReactNode;
  onCreate: (draft: Omit<T, 'id'>) => Promise<unknown>;
  onUpdate: (item: T) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

/**
 * List + add/edit/delete for one configurable collection. Every entity behaves
 * the same way, so only the fields differ.
 */
export function EntityManager<T extends { id: string; name: string }>({
  label,
  items,
  emptyDraft,
  summary,
  renderFields,
  onCreate,
  onUpdate,
  onDelete,
}: EntityManagerProps<T>) {
  const [draft, setDraft] = useState<Omit<T, 'id'> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const cancel = () => {
    setDraft(null);
    setEditingId(null);
    setError(null);
  };

  /** The server owns the rules (e.g. "still booked"), so surface what it says. */
  const run = async (action: () => Promise<unknown>, onDone?: () => void) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      onDone?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    void run(
      () => (editingId ? onUpdate({ ...draft, id: editingId } as T) : onCreate(draft)),
      cancel,
    );
  };

  const remove = (item: T) => {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    void run(() => onDelete(item.id));
  };

  return (
    <div className={styles.manager}>
      {error && (
        <div role="alert" className={styles.error}>
          {error}
        </div>
      )}

      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id} className={styles.row}>
            <div className={styles.rowText}>
              <strong>{item.name}</strong>
              <span>{summary(item)}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setDraft(withoutId(item));
                setEditingId(item.id);
                setError(null);
              }}
              disabled={busy}
            >
              Edit
            </button>
            <button
              type="button"
              className="button--danger"
              onClick={() => remove(item)}
              disabled={busy}
            >
              Delete
            </button>
          </li>
        ))}
        {items.length === 0 && <li className={styles.empty}>No {label}s yet — add the first one.</li>}
      </ul>

      {draft ? (
        <form className={styles.form} onSubmit={save}>
          <h4 className={styles.formTitle}>{editingId ? `Edit ${label}` : `New ${label}`}</h4>
          {renderFields(draft, (patch) => setDraft((current) => (current ? { ...current, ...patch } : current)))}
          <div className={styles.formActions}>
            <button type="button" onClick={cancel} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="button--primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="button--primary"
          onClick={() => {
            setDraft(emptyDraft());
            setEditingId(null);
            setError(null);
          }}
        >
          + Add {label}
        </button>
      )}
    </div>
  );
}
