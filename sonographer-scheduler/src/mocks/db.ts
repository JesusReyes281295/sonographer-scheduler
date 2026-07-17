import type { Appointment, Patient } from '../core/domain/types';
import { clinics, consultationTypes, seedAppointments, seedPatients, sonographers } from './data';
import { loadState, saveState } from './storage';

/**
 * Shape persisted to local storage. Sonographers, clinics and consultation types
 * are reference data for now, so only the collections users can change are stored.
 */
interface DbState {
  appointments: Appointment[];
  patients: Patient[];
}

const seedState = (): DbState => ({
  appointments: structuredClone(seedAppointments),
  patients: structuredClone(seedPatients),
});

/** Load persisted data on first import; on a fresh install, seed and persist it. */
function initState(): DbState {
  const persisted = loadState<DbState>();
  if (persisted) return persisted;
  const seeded = seedState();
  saveState(seeded);
  return seeded;
}

/** Tiny persistent "database" backing the mocked REST API. */
let state: DbState = initState();

const persist = () => saveState(state);

export const db = {
  listSonographers: () => [...sonographers],
  listClinics: () => [...clinics],
  getClinic: (id: string) => clinics.find((clinic) => clinic.id === id),
  listConsultationTypes: () => [...consultationTypes],

  listPatients: () => [...state.patients],
  getPatient: (id: string) => state.patients.find((patient) => patient.id === id),
  createPatient: (draft: Omit<Patient, 'id'>): Patient => {
    const patient: Patient = { ...draft, id: crypto.randomUUID() };
    state.patients.push(patient);
    persist();
    return patient;
  },

  listAppointments: (date?: string | null) =>
    date ? state.appointments.filter((a) => a.start.startsWith(date)) : [...state.appointments],
  getAppointment: (id: string) => state.appointments.find((a) => a.id === id),
  createAppointment: (draft: Omit<Appointment, 'id'>): Appointment => {
    const appointment: Appointment = { ...draft, id: crypto.randomUUID() };
    state.appointments.push(appointment);
    persist();
    return appointment;
  },
  updateAppointment: (appointment: Appointment): Appointment => {
    state.appointments = state.appointments.map((a) => (a.id === appointment.id ? appointment : a));
    persist();
    return appointment;
  },
  deleteAppointment: (id: string): boolean => {
    const exists = state.appointments.some((a) => a.id === id);
    state.appointments = state.appointments.filter((a) => a.id !== id);
    persist();
    return exists;
  },

  /** Restore the original sample data — used between tests. */
  reset: () => {
    state = seedState();
    saveState(state);
  },
};
