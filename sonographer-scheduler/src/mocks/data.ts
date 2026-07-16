import { format } from 'date-fns';
import type { Appointment, Clinic, Sonographer } from '../core/domain/types';

export const sonographers: Sonographer[] = [
  { id: 's1', name: 'Alice Chen' },
  { id: 's2', name: 'Brian Osei' },
  { id: 's3', name: 'Carla Reyes' },
];

export const clinics: Clinic[] = [
  { id: 'c1', name: 'Downtown Imaging', openTime: '08:00', closeTime: '17:00', color: '#2563eb' },
  { id: 'c2', name: 'Northside Clinic', openTime: '09:00', closeTime: '15:00', color: '#059669' },
];

// Seed appointments are generated for "today" so the app always opens
// with a populated schedule.
const today = format(new Date(), 'yyyy-MM-dd');

export const seedAppointments: Appointment[] = [
  {
    id: 'a1',
    sonographerId: 's1',
    clinicId: 'c1',
    patientName: 'Maria Lopez',
    start: `${today}T09:00:00`,
    end: `${today}T10:00:00`,
    notes: 'OB ultrasound, 20 weeks',
  },
  {
    id: 'a2',
    sonographerId: 's2',
    clinicId: 'c2',
    patientName: 'James Field',
    start: `${today}T10:30:00`,
    end: `${today}T11:30:00`,
  },
  {
    id: 'a3',
    sonographerId: 's1',
    clinicId: 'c1',
    patientName: 'Priya Patel',
    start: `${today}T13:00:00`,
    end: `${today}T14:00:00`,
    notes: 'Abdominal scan',
  },
];
