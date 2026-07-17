import { addDays, differenceInCalendarDays, format } from 'date-fns';
import type { Appointment, Clinic, ConsultationType, Patient, Sonographer } from '../core/domain/types';
import {
  clinics,
  consultationTypes,
  seedAnchorDate,
  seedAppointments,
  seedPatients,
  sonographers,
} from './data';
import { loadState, saveState } from './storage';

/**
 * Shape persisted to local storage. Everything a hospital can configure lives
 * here, so a customised setup survives a reload.
 */
interface DbState {
  /** The day the appointments currently sit on ("yyyy-MM-dd"). */
  anchorDate: string;
  appointments: Appointment[];
  patients: Patient[];
  sonographers: Sonographer[];
  clinics: Clinic[];
  consultationTypes: ConsultationType[];
}

const todayStr = () => format(new Date(), 'yyyy-MM-dd');
/** Noon avoids DST edge cases when doing whole-day arithmetic. */
const atNoon = (day: string) => new Date(`${day}T12:00:00`);
const shiftDay = (iso: string, days: number) =>
  `${format(addDays(atNoon(iso.slice(0, 10)), days), 'yyyy-MM-dd')}${iso.slice(10)}`;

const seedState = (): DbState => ({
  anchorDate: seedAnchorDate,
  appointments: structuredClone(seedAppointments),
  patients: structuredClone(seedPatients),
  sonographers: structuredClone(sonographers),
  clinics: structuredClone(clinics),
  consultationTypes: structuredClone(consultationTypes),
});

/**
 * Move the whole schedule so its anchor day lands on `today`. This keeps the
 * sample data on the day the app is opened — whether that's today or weeks from
 * now — instead of leaving it frozen on the day it was first seeded. User edits
 * shift along with it, so nothing is lost.
 */
function anchorToToday(state: DbState, today: string): DbState {
  const offset = differenceInCalendarDays(atNoon(today), atNoon(state.anchorDate));
  if (offset === 0) return state;
  return {
    ...state,
    anchorDate: today,
    appointments: state.appointments.map((a) => ({
      ...a,
      start: shiftDay(a.start, offset),
      end: shiftDay(a.end, offset),
    })),
  };
}

/**
 * Load persisted data on first import; on a fresh install, seed and persist it.
 *
 * Persisted data is overlaid on a complete seed, so a collection added in a later
 * schema can never come back `undefined` from an older browser payload (which
 * would crash the app on load). The version guard in `storage` handles wholly
 * incompatible data; this is the belt-and-suspenders for a partial shape. Finally
 * the schedule is re-anchored to today so it's never empty on the day it's opened.
 */
function initState(): DbState {
  const seeded = seedState();
  const persisted = loadState<Partial<DbState>>();
  const merged: DbState = {
    anchorDate: persisted?.anchorDate ?? seeded.anchorDate,
    appointments: persisted?.appointments ?? seeded.appointments,
    patients: persisted?.patients ?? seeded.patients,
    sonographers: persisted?.sonographers ?? seeded.sonographers,
    clinics: persisted?.clinics ?? seeded.clinics,
    consultationTypes: persisted?.consultationTypes ?? seeded.consultationTypes,
  };
  const state = anchorToToday(merged, todayStr());
  saveState(state); // persist the fresh/healed/re-anchored data in place
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
