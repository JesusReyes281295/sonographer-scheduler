import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const STORAGE_KEY = 'sonographer-scheduler:db';

/** Reproduces "read is not a function or its return value is not iterable":
 *  the app is opened in a browser that still holds data from an older schema. */
describe('schema migration from stale localStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });
  afterEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('reseeds every collection when the stored data is from an older schema (v2)', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 2, data: { appointments: [], patients: [] } }),
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { db } = await import('./db');

    expect(() => db.listSonographers()).not.toThrow();
    expect(db.listSonographers().length).toBeGreaterThan(0);
    expect(db.listClinics().length).toBeGreaterThan(0);
    expect(db.listConsultationTypes().length).toBeGreaterThan(0);
    warn.mockRestore();
  });

  it('survives current-version data that is missing a newer collection', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 3, data: { appointments: [], patients: [] } }),
    );

    const { db } = await import('./db');

    expect(() => db.listSonographers()).not.toThrow();
    expect(db.listClinics().length).toBeGreaterThan(0);
  });
});
