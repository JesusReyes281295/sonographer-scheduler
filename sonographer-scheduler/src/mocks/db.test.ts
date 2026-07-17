import { beforeEach, describe, expect, it } from 'vitest';
import type { Appointment, Clinic, Patient } from '../core/domain/types';
import { seedAppointments, seedPatients } from './data';
import { db } from './db';
import { clearState, loadState } from './storage';

interface PersistedDb {
  appointments: Appointment[];
  patients: Patient[];
  clinics: Clinic[];
}

const validDraft: Omit<Appointment, 'id'> = {
  sonographerId: 's3',
  clinicId: 'c1',
  patientId: 'p1',
  consultationTypeId: 'ct1',
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

  it('persists a newly registered patient', () => {
    const created = db.createPatient({ name: 'Walk-in Patient' });

    expect(db.getPatient(created.id)).toEqual(created);
    expect(loadState<PersistedDb>()?.patients.some((p) => p.id === created.id)).toBe(true);
  });

  it('persists the full lifecycle of editable reference data', () => {
    const clinic = db.createClinic({
      name: 'New Site',
      openTime: '08:00',
      closeTime: '12:00',
      color: '#111827',
    });
    expect(loadState<PersistedDb>()?.clinics.some((c) => c.id === clinic.id)).toBe(true);

    db.updateClinic({ ...clinic, name: 'Renamed Site' });
    expect(db.listClinics().find((c) => c.id === clinic.id)?.name).toBe('Renamed Site');
    expect(loadState<PersistedDb>()?.clinics.find((c) => c.id === clinic.id)?.name).toBe('Renamed Site');

    db.deleteClinic(clinic.id);
    expect(loadState<PersistedDb>()?.clinics.some((c) => c.id === clinic.id)).toBe(false);
  });

  it('reset restores the seed and clears added data (in memory and in storage)', () => {
    db.createAppointment({ ...validDraft });
    db.createPatient({ name: 'Walk-in Patient' });
    expect(db.listAppointments()).toHaveLength(seedAppointments.length + 1);
    expect(db.listPatients()).toHaveLength(seedPatients.length + 1);

    db.reset();

    expect(db.listAppointments()).toHaveLength(seedAppointments.length);
    expect(db.listPatients()).toHaveLength(seedPatients.length);
    const persisted = loadState<PersistedDb>();
    expect(persisted?.appointments).toHaveLength(seedAppointments.length);
    expect(persisted?.patients).toHaveLength(seedPatients.length);
  });
});
