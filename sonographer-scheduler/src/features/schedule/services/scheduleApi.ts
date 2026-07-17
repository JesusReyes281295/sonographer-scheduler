import { http } from '../../../core/api/http';
import type {
  Appointment,
  AppointmentDraft,
  Clinic,
  ConsultationType,
  Patient,
  Sonographer,
} from '../../../core/domain/types';

export const sonographersApi = {
  list: () => http<Sonographer[]>('/api/sonographers'),
};

export const clinicsApi = {
  list: () => http<Clinic[]>('/api/clinics'),
};

export const consultationTypesApi = {
  list: () => http<ConsultationType[]>('/api/consultation-types'),
};

export const patientsApi = {
  list: () => http<Patient[]>('/api/patients'),
  create: (patient: { name: string; mrn?: string }) =>
    http<Patient>('/api/patients', { method: 'POST', body: JSON.stringify(patient) }),
};

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
