import { format } from 'date-fns';
import type { Appointment, Clinic, Sonographer } from '../core/domain/types';

export const sonographers: Sonographer[] = [
  { id: 's1', name: 'Alice Chen' },
  { id: 's2', name: 'Brian Osei' },
  { id: 's3', name: 'Carla Reyes' },
  { id: 's4', name: 'Diego Martins' },
  { id: 's5', name: 'Emma Novak' },
  { id: 's6', name: 'Farah Haddad' },
  { id: 's7', name: 'Grace Kim' },
];

// A mix of hospital-affiliated sites that stay open on public holidays and
// outpatient clinics that observe US federal holidays (closed those days).
export const clinics: Clinic[] = [
  { id: 'c1', name: 'Downtown Imaging', openTime: '08:00', closeTime: '17:00', color: '#2563eb', observesHolidays: false },
  { id: 'c2', name: 'Northside Clinic', openTime: '09:00', closeTime: '15:00', color: '#059669', observesHolidays: true },
  { id: 'c3', name: 'Riverside Diagnostics', openTime: '08:00', closeTime: '16:00', color: '#d97706', observesHolidays: false },
  { id: 'c4', name: "Lakeview Women's Health", openTime: '09:00', closeTime: '17:00', color: '#db2777', observesHolidays: true },
  { id: 'c5', name: 'Central Hospital Radiology', openTime: '07:00', closeTime: '19:00', color: '#7c3aed', observesHolidays: false },
  { id: 'c6', name: 'Eastgate Imaging', openTime: '08:30', closeTime: '16:30', color: '#0891b2', observesHolidays: true },
  { id: 'c7', name: 'Harbor Medical Center', openTime: '07:00', closeTime: '18:00', color: '#dc2626', observesHolidays: false },
  { id: 'c8', name: 'Sunset Family Clinic', openTime: '09:00', closeTime: '14:00', color: '#65a30d', observesHolidays: true },
  { id: 'c9', name: 'Mountainview Ultrasound', openTime: '08:00', closeTime: '16:00', color: '#ea580c', observesHolidays: false },
  { id: 'c10', name: 'Parkside Urgent Care', openTime: '07:00', closeTime: '20:00', color: '#0d9488', observesHolidays: false },
];

// Seed appointments are generated for "today" so the app always opens
// with a populated schedule.
const today = format(new Date(), 'yyyy-MM-dd');
const at = (start: string, end: string) => ({ start: `${today}T${start}:00`, end: `${today}T${end}:00` });

export const seedAppointments: Appointment[] = [
  { id: 'a1', sonographerId: 's1', clinicId: 'c1', patientName: 'Maria Lopez', ...at('09:00', '10:00'), notes: 'OB ultrasound, 20 weeks' },
  { id: 'a2', sonographerId: 's2', clinicId: 'c2', patientName: 'James Field', ...at('10:30', '11:30') },
  { id: 'a3', sonographerId: 's1', clinicId: 'c1', patientName: 'Priya Patel', ...at('13:00', '14:00'), notes: 'Abdominal scan' },
  { id: 'a4', sonographerId: 's4', clinicId: 'c3', patientName: 'Robert King', ...at('09:30', '10:15'), notes: 'Follow-up needed' },
  { id: 'a5', sonographerId: 's5', clinicId: 'c5', patientName: 'Susan Lee', ...at('08:00', '09:00'), notes: 'Urgent' },
  { id: 'a6', sonographerId: 's2', clinicId: 'c2', patientName: 'Thomas Ng', ...at('12:00', '12:45') },
  { id: 'a7', sonographerId: 's6', clinicId: 'c7', patientName: 'Olivia Brown', ...at('14:00', '15:00'), notes: 'Thyroid scan' },
  { id: 'a8', sonographerId: 's3', clinicId: 'c9', patientName: 'William Davis', ...at('14:30', '15:30') },
  { id: 'a9', sonographerId: 's7', clinicId: 'c10', patientName: 'Nina Alvarez', ...at('16:00', '17:00'), notes: 'Possibly cancelled' },
  { id: 'a10', sonographerId: 's4', clinicId: 'c1', patientName: 'David Cohen', ...at('11:00', '12:00'), notes: 'New patient' },
  { id: 'a11', sonographerId: 's5', clinicId: 'c5', patientName: 'George Hall', ...at('10:00', '10:45') },
];
