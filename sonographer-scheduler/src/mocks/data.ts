import { format } from 'date-fns';
import type { Appointment, Clinic, ConsultationType, Patient, Sonographer } from '../core/domain/types';

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
  { id: 'c1', name: 'Downtown Imaging', openTime: '08:00', closeTime: '17:00', color: '#2563eb', icon: '🏥', observesHolidays: false },
  { id: 'c2', name: 'Northside Clinic', openTime: '09:00', closeTime: '15:00', color: '#059669', icon: '🩺', observesHolidays: true },
  { id: 'c3', name: 'Riverside Diagnostics', openTime: '08:00', closeTime: '16:00', color: '#d97706', icon: '🔬', observesHolidays: false },
  { id: 'c4', name: "Lakeview Women's Health", openTime: '09:00', closeTime: '17:00', color: '#db2777', icon: '🌸', observesHolidays: true },
  { id: 'c5', name: 'Central Hospital Radiology', openTime: '07:00', closeTime: '19:00', color: '#7c3aed', icon: '🏥', observesHolidays: false },
  { id: 'c6', name: 'Eastgate Imaging', openTime: '08:30', closeTime: '16:30', color: '#0891b2', icon: '🔬', observesHolidays: true },
  { id: 'c7', name: 'Harbor Medical Center', openTime: '07:00', closeTime: '18:00', color: '#dc2626', icon: '⛑️', observesHolidays: false },
  { id: 'c8', name: 'Sunset Family Clinic', openTime: '09:00', closeTime: '14:00', color: '#65a30d', icon: '🩺', observesHolidays: true },
  { id: 'c9', name: 'Mountainview Ultrasound', openTime: '08:00', closeTime: '16:00', color: '#ea580c', icon: '🔬', observesHolidays: false },
  { id: 'c10', name: 'Parkside Urgent Care', openTime: '07:00', closeTime: '20:00', color: '#0d9488', icon: '🚑', observesHolidays: false },
];

// Every entry is an ultrasound study a sonographer actually performs — no other
// imaging modality, and no appointment "reasons" (those belong in the notes).
// Reference data for now; the management UI will make these editable.
export const consultationTypes: ConsultationType[] = [
  { id: 'ct1', name: 'OB ultrasound', icon: '🤰' },
  { id: 'ct2', name: 'Abdominal ultrasound', icon: '🩺' },
  { id: 'ct3', name: 'Vascular Doppler', icon: '🩸' },
  { id: 'ct4', name: 'Thyroid ultrasound', icon: '🦋' },
  { id: 'ct5', name: 'Musculoskeletal ultrasound', icon: '🦴' },
  { id: 'ct6', name: 'Echocardiogram', icon: '🫀' },
  { id: 'ct7', name: 'Renal ultrasound', icon: '🫘' },
  { id: 'ct8', name: 'Breast ultrasound', icon: '🎗️' },
];

export const seedPatients: Patient[] = [
  { id: 'p1', name: 'Maria Lopez', mrn: 'MRN-1042' },
  { id: 'p2', name: 'James Field', mrn: 'MRN-1043' },
  { id: 'p3', name: 'Priya Patel', mrn: 'MRN-1044' },
  { id: 'p4', name: 'Robert King', mrn: 'MRN-1045' },
  { id: 'p5', name: 'Susan Lee', mrn: 'MRN-1046' },
  { id: 'p6', name: 'Thomas Ng', mrn: 'MRN-1047' },
  { id: 'p7', name: 'Olivia Brown', mrn: 'MRN-1048' },
  { id: 'p8', name: 'William Davis', mrn: 'MRN-1049' },
  { id: 'p9', name: 'Nina Alvarez', mrn: 'MRN-1050' },
  { id: 'p10', name: 'David Cohen', mrn: 'MRN-1051' },
  { id: 'p11', name: 'George Hall', mrn: 'MRN-1052' },
  { id: 'p12', name: 'Hannah Silva', mrn: 'MRN-1053' },
  { id: 'p13', name: 'Ibrahim Khan', mrn: 'MRN-1054' },
  { id: 'p14', name: 'Julia Moreau', mrn: 'MRN-1055' },
];

// Seed appointments are generated for "today" so the app always opens with a
// populated schedule. The db re-anchors them to the current day on later opens.
export const seedAnchorDate = format(new Date(), 'yyyy-MM-dd');
const at = (start: string, end: string) => ({
  start: `${seedAnchorDate}T${start}:00`,
  end: `${seedAnchorDate}T${end}:00`,
});

export const seedAppointments: Appointment[] = [
  { id: 'a1', sonographerId: 's1', clinicId: 'c1', patientId: 'p1', consultationTypeId: 'ct1', ...at('09:00', '10:00'), notes: '20 weeks' },
  { id: 'a2', sonographerId: 's2', clinicId: 'c2', patientId: 'p2', consultationTypeId: 'ct6', ...at('10:30', '11:30') },
  { id: 'a3', sonographerId: 's1', clinicId: 'c1', patientId: 'p3', consultationTypeId: 'ct2', ...at('13:00', '14:00'), notes: 'Fasting confirmed' },
  { id: 'a4', sonographerId: 's4', clinicId: 'c3', patientId: 'p4', consultationTypeId: 'ct5', ...at('09:30', '10:15'), notes: 'Follow-up needed' },
  { id: 'a5', sonographerId: 's5', clinicId: 'c5', patientId: 'p5', consultationTypeId: 'ct6', ...at('08:00', '09:00'), notes: 'Urgent' },
  { id: 'a6', sonographerId: 's2', clinicId: 'c2', patientId: 'p6', consultationTypeId: 'ct3', ...at('12:00', '12:45') },
  { id: 'a7', sonographerId: 's6', clinicId: 'c7', patientId: 'p7', consultationTypeId: 'ct4', ...at('14:00', '15:00') },
  { id: 'a8', sonographerId: 's3', clinicId: 'c9', patientId: 'p8', consultationTypeId: 'ct5', ...at('14:30', '15:30') },
  { id: 'a9', sonographerId: 's7', clinicId: 'c10', patientId: 'p9', consultationTypeId: 'ct7', ...at('16:00', '17:00'), notes: 'Possibly cancelled' },
  { id: 'a10', sonographerId: 's4', clinicId: 'c1', patientId: 'p10', consultationTypeId: 'ct2', ...at('11:00', '12:00'), notes: 'New patient' },
  { id: 'a11', sonographerId: 's5', clinicId: 'c5', patientId: 'p11', consultationTypeId: 'ct3', ...at('10:00', '10:45') },
];
