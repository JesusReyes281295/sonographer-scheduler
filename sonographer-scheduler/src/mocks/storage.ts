/**
 * Local-first persistence for the mocked API.
 *
 * The app has no real backend, but data should survive a page reload so it feels
 * like one. The mock "database" mirrors its state here (browser localStorage),
 * behind the same module boundary a real HTTP client would use. Everything is
 * defensive: unavailable or blocked storage, corrupt JSON and old schema versions
 * all degrade gracefully (in-memory fallback, or a clean reseed).
 */

const STORAGE_KEY = 'sonographer-scheduler:db';
/** Bump when the persisted shape changes; data from older versions is discarded.
 *  v2: appointments reference `patientId`/`consultationTypeId`, and patients are stored.
 *  v3: sonographers, clinics and study types are editable, so they are stored too.
 *  v4: an `anchorDate` records which day the schedule is currently sitting on. */
export const SCHEMA_VERSION = 4;

interface Envelope<T> {
  version: number;
  data: T;
}

/** Used when localStorage is missing or throws (private mode, SSR, Node). */
let memoryFallback: unknown = null;

/** Return a usable Storage, or null if it is missing/blocked. */
function getStorage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    // Safari private mode exposes localStorage but throws on write — probe it.
    const probe = '__probe__';
    localStorage.setItem(probe, probe);
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return null;
  }
}

export function loadState<T>(): T | null {
  const storage = getStorage();
  if (!storage) return (memoryFallback as T | null) ?? null;

  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return null;

  try {
    const envelope = JSON.parse(raw) as Envelope<T>;
    if (envelope.version !== SCHEMA_VERSION) {
      console.warn(
        `[storage] Ignoring data from schema v${envelope.version} (expected v${SCHEMA_VERSION}); resetting.`,
      );
      storage.removeItem(STORAGE_KEY);
      return null;
    }
    return envelope.data;
  } catch {
    console.warn('[storage] Corrupt local data; resetting to sample data.');
    storage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveState<T>(data: T): void {
  memoryFallback = data;
  const storage = getStorage();
  if (!storage) return;
  try {
    const envelope: Envelope<T> = { version: SCHEMA_VERSION, data };
    storage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    console.warn('[storage] Could not persist local data; keeping it in memory only.');
  }
}

export function clearState(): void {
  memoryFallback = null;
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing else we can do; the in-memory fallback is already cleared.
  }
}

export { STORAGE_KEY };
