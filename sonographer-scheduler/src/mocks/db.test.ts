import { beforeEach, describe, expect, it } from 'vitest';
import type { Appointment } from '../core/domain/types';
import { seedAppointments } from './data';
import { db } from './db';
import { clearState, loadState } from './storage';

interface PersistedDb {
  appointments: Appointment[];
}

const validDraft: Omit<Appointment, 'id'> = {
  sonographerId: 's3',
  clinicId: 'c1',
  patientName: 'Persisted Patient',
  start: '2026-01-01T15:00:00',
  end: '2026-01-01T16:00:00',
};

describe('mock database persistence', () => {
  beforeEach(() => {
    clearState();
    db.reset();
  });

  it('persists a created appointment to storage', () => {
    const created = db.createAppointment({ ...validDraft });

    const persisted = loadState<PersistedDb>();
    expect(persisted?.appointments.some((a) => a.id === created.id)).toBe(true);
  });

  it('persists deletions to storage', () => {
    const created = db.createAppointment({ ...validDraft });
    db.deleteAppointment(created.id);

    const persisted = loadState<PersistedDb>();
    expect(persisted?.appointments.some((a) => a.id === created.id)).toBe(false);
  });

  it('reset restores the seed and clears added data (in memory and in storage)', () => {
    db.createAppointment({ ...validDraft });
    expect(db.listAppointments()).toHaveLength(seedAppointments.length + 1);

    db.reset();

    expect(db.listAppointments()).toHaveLength(seedAppointments.length);
    expect(loadState<PersistedDb>()?.appointments).toHaveLength(seedAppointments.length);
  });
});
