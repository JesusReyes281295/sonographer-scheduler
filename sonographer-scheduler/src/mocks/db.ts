import type { Appointment } from '../core/domain/types';
import { clinics, seedAppointments, sonographers } from './data';

/** Tiny in-memory "database" backing the mocked REST API. */
let appointments: Appointment[] = structuredClone(seedAppointments);

export const db = {
  listSonographers: () => [...sonographers],
  listClinics: () => [...clinics],
  getClinic: (id: string) => clinics.find((clinic) => clinic.id === id),

  listAppointments: (date?: string | null) =>
    date ? appointments.filter((a) => a.start.startsWith(date)) : [...appointments],
  getAppointment: (id: string) => appointments.find((a) => a.id === id),
  createAppointment: (draft: Omit<Appointment, 'id'>): Appointment => {
    const appointment: Appointment = { ...draft, id: crypto.randomUUID() };
    appointments.push(appointment);
    return appointment;
  },
  updateAppointment: (appointment: Appointment): Appointment => {
    appointments = appointments.map((a) => (a.id === appointment.id ? appointment : a));
    return appointment;
  },
  deleteAppointment: (id: string): boolean => {
    const exists = appointments.some((a) => a.id === id);
    appointments = appointments.filter((a) => a.id !== id);
    return exists;
  },

  /** Restore seed data — used between tests. */
  reset: () => {
    appointments = structuredClone(seedAppointments);
  },
};
