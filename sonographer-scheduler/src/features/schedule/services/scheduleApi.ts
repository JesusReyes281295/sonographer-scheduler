import { http } from '../../../core/api/http';
import type {
  Appointment,
  AppointmentDraft,
  Clinic,
  ConsultationType,
  Patient,
  Sonographer,
} from '../../../core/domain/types';

/** Typed REST calls for one configurable collection. */
export interface CrudApi<T extends { id: string }> {
  list: () => Promise<T[]>;
  create: (draft: Omit<T, 'id'>) => Promise<T>;
  update: (item: T) => Promise<T>;
  remove: (id: string) => Promise<void>;
}

function crudApi<T extends { id: string }>(path: string): CrudApi<T> {
  return {
    list: () => http<T[]>(path),
    create: (draft) => http<T>(path, { method: 'POST', body: JSON.stringify(draft) }),
    update: (item) => http<T>(`${path}/${item.id}`, { method: 'PUT', body: JSON.stringify(item) }),
    remove: (id) => http<void>(`${path}/${id}`, { method: 'DELETE' }),
  };
}

export const sonographersApi = crudApi<Sonographer>('/api/sonographers');
export const clinicsApi = crudApi<Clinic>('/api/clinics');
export const patientsApi = crudApi<Patient>('/api/patients');
export const consultationTypesApi = crudApi<ConsultationType>('/api/consultation-types');

export const appointmentsApi = {
  listByDate: (date: string) => http<Appointment[]>(`/api/appointments?date=${date}`),
  create: (draft: AppointmentDraft) =>
    http<Appointment>('/api/appointments', { method: 'POST', body: JSON.stringify(draft) }),
  update: (appointment: Appointment) =>
    http<Appointment>(`/api/appointments/${appointment.id}`, {
      method: 'PUT',
      body: JSON.stringify(appointment),
    }),
  remove: (id: string) => http<void>(`/api/appointments/${id}`, { method: 'DELETE' }),
};
