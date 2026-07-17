import { format, subDays } from 'date-fns';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SCHEMA_VERSION, STORAGE_KEY } from './storage';

/** Reproduces "read is not a function or its return value is not iterable":
 *  the app is opened in a browser that still holds data from an older schema. */
describe('loading stale localStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });
  afterEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('reseeds every collection when the stored data is from an older schema', async () => {
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
      JSON.stringify({ version: SCHEMA_VERSION, data: { appointments: [], patients: [] } }),
    );

    const { db } = await import('./db');

    expect(() => db.listSonographers()).not.toThrow();
    expect(db.listClinics().length).toBeGreaterThan(0);
  });

  it('re-anchors the sample day to today when the stored data is from a past day', async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const past = format(subDays(new Date(), 5), 'yyyy-MM-dd');
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: SCHEMA_VERSION,
        data: {
          anchorDate: past,
          appointments: [
            {
              id: 'x',
              sonographerId: 's1',
              clinicId: 'c1',
              patientId: 'p1',
              consultationTypeId: 'ct1',
              start: `${past}T09:00:00`,
              end: `${past}T10:00:00`,
            },
          ],
        },
      }),
    );

    const { db } = await import('./db');

    // The saved appointment now sits on today, not on the day it was saved.
    expect(db.listAppointments(today)).toHaveLength(1);
    expect(db.listAppointments(past)).toHaveLength(0);
  });
});
