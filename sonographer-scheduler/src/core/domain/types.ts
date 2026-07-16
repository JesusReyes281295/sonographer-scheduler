export interface Sonographer {
  id: string;
  name: string;
}

export interface Clinic {
  id: string;
  name: string;
  /** Opening time, 24h "HH:mm". */
  openTime: string;
  /** Closing time, 24h "HH:mm". */
  closeTime: string;
  /** Accent color used to identify the clinic in the schedule. */
  color: string;
}

export interface Appointment {
  id: string;
  sonographerId: string;
  clinicId: string;
  patientName: string;
  /** Local ISO datetime, e.g. "2026-07-13T09:00:00". */
  start: string;
  /** Local ISO datetime, exclusive end of the slot. */
  end: string;
  notes?: string;
}

/** An appointment being created (no id yet) or edited (id present). */
export type AppointmentDraft = Omit<Appointment, 'id'> & { id?: string };
