import { useEffect, useState } from 'react';

/**
 * useState that survives reloads by mirroring the value in localStorage. Used for
 * lightweight UI preferences (chosen view, active filters) — not domain data,
 * which lives behind the mock API. Read/write failures (private mode, quota) fall
 * back gracefully to in-memory state.
 */
export function usePersistentState<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore: the preference just won't persist this session.
    }
  }, [key, value]);

  return [value, setValue];
}
