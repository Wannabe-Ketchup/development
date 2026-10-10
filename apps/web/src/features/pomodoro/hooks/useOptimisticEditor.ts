import { useRef, useState } from 'react';

interface EditingState<T> {
  draft: T;
  error: string | null;
}

interface UseOptimisticEditorParams<T> {
  value: T;
  onSave: (nextValue: T) => Promise<void>;
  validate?: (draft: T) => string | null;
}

export function useOptimisticEditor<T>({
  value,
  onSave,
  validate,
}: UseOptimisticEditorParams<T>) {
  const [editing, setEditing] = useState<EditingState<T> | null>(null);
  const [sentValue, setSentValue] = useState<T | null>(null);

  const isSendingRef = useRef(false);
  const queuedRef = useRef<{ value: T } | null>(null);

  if (sentValue === value) {
    setSentValue(null);
  }

  const displayedValue = sentValue !== null ? sentValue : value;

  const send = async (next: T): Promise<void> => {
    isSendingRef.current = true;
    try {
      await onSave(next);
    } catch (cause) {
      if (queuedRef.current === null) {
        setSentValue(null);
        setEditing((current) => current ?? { draft: next, error: (cause as Error).message });
      }
    } finally {
      isSendingRef.current = false;
      const queued = queuedRef.current;
      queuedRef.current = null;
      if (queued !== null) {
        await send(queued.value);
      }
    }
  };

  const confirmEditing = () => {
    if (editing === null) return;
    
    if (validate) {
      const error = validate(editing.draft);
      if (error) {
        setEditing({ ...editing, error });
        return;
      }
    }

    const next = editing.draft;
    setEditing(null);

    if (next === displayedValue) return;

    setSentValue(next);

    if (isSendingRef.current) {
      queuedRef.current = { value: next };
      return;
    }

    void send(next);
  };

  return {
    value: displayedValue,
    draft: editing?.draft ?? null,
    error: editing?.error ?? null,
    startEditing: () => setEditing({ draft: displayedValue, error: null }),
    changeDraft: (draft: T) => setEditing((current) => {
      if (!current) return current;
      const error = validate ? validate(draft) : null;
      return { draft, error };
    }),
    cancelEditing: () => setEditing(null),
    confirmEditing,
  };
}
