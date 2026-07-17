import type { Appointment, Clinic, ConsultationType, Patient, Sonographer } from '../core/domain/types';
import { clinics, consultationTypes, seedAppointments, seedPatients, sonographers } from './data';
import { loadState, saveState } from './storage';

/**
 * Shape persisted to local storage. Everything a hospital can configure lives
 * here, so a customised setup survives a reload.
 */
interface DbState {
  appointments: Appointment[];
  patients: Patient[];
  sonographers: Sonographer[];
  clinics: Clinic[];
  consultationTypes: ConsultationType[];
}

const seedState = (): DbState => ({
  appointments: structuredClone(seedAppointments),
  patients: structuredClone(seedPatients),
  sonographers: structuredClone(sonographers),
  clinics: structuredClone(clinics),
  consultationTypes: structuredClone(consultationTypes),
});

/**
 * Load persisted data on first import; on a fresh install, seed and persist it.
 *
 * Persisted data is overlaid on a complete seed, so a collection added in a later
 * schema can never come back `undefined` from an older browser payload (which
 * would crash the app on load). The version guard in `storage` handles wholly
 * incompatible data; this is the belt-and-suspenders for a partial shape.
 */
function initState(): DbState {
  const seeded = seedState();
  const persisted = loadState<Partial<DbState>>();
  const state: DbState = {
    appointments: persisted?.appointments ?? seeded.appointments,
    patients: persisted?.patients ?? seeded.patients,
    sonographers: persisted?.sonographers ?? seeded.sonographers,
    clinics: persisted?.clinics ?? seeded.clinics,
    consultationTypes: persisted?.consultationTypes ?? seeded.consultationTypes,
  };
  saveState(state); // persist a fresh seed, and heal any partial data in place
  return state;
}

/** Tiny persistent "database" backing the mocked REST API. */
let state: DbState = initState();

const persist = () => saveState(state);

/** CRUD over one collection — every configurable entity behaves the same way. */
function collection<T extends { id: string }>(read: () => T[], write: (items: T[]) => void) {
  return {
    list: (): T[] => [...read()],
    get: (id: string): T | undefined => read().find((item) => item.id === id),
    create: (draft: Omit<T, 'id'>): T => {
      const item = { ...draft, id: crypto.randomUUID() } as T;
      write([...read(), item]);
      persist();
      return item;
    },
    update: (item: T): T | undefined => {
      if (!read().some((existing) => existing.id === item.id)) return undefined;
      write(read().map((existing) => (existing.id === item.id ? item : existing)));
      persist();
      return item;
    },
    remove: (id: string): boolean => {
      const exists = read().some((item) => item.id === id);
      write(read().filter((item) => item.id !== id));
      persist();
      return exists;
    },
  };
}

const sonographerStore = collection<Sonographer>(
  () => state.sonographers,
  (items) => (state.sonographers = items),
);
const clinicStore = collection<Clinic>(
  () => state.clinics,
  (items) => (state.clinics = items),
);
const patientStore = collection<Patient>(
  () => state.patients,
  (items) => (state.patients = items),
);
const consultationTypeStore = collection<ConsultationType>(
  () => state.consultationTypes,
  (items) => (state.consultationTypes = items),
);

export const db = {
  listSonographers: sonographerStore.list,
  createSonographer: sonographerStore.create,
  updateSonographer: sonographerStore.update,
  deleteSonographer: sonographerStore.remove,

  listClinics: clinicStore.list,
  getClinic: clinicStore.get,
  createClinic: clinicStore.create,
  updateClinic: clinicStore.update,
  deleteClinic: clinicStore.remove,

  listPatients: patientStore.list,
  getPatient: patientStore.get,
  createPatient: patientStore.create,
  updatePatient: patientStore.update,
  deletePatient: patientStore.remove,

  listConsultationTypes: consultationTypeStore.list,
  createConsultationType: consultationTypeStore.create,
  updateConsultationType: consultationTypeStore.update,
  deleteConsultationType: consultationTypeStore.remove,

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
