import { getUsHoliday } from './holidays';
import type { Appointment, AppointmentDraft, Clinic } from './types';
import { minutesOfDay, timeToMinutes } from './time';

export type SchedulingErrorCode =
  | 'INVALID_RANGE'
  | 'OUTSIDE_CLINIC_HOURS'
  | 'DOUBLE_BOOKED'
  | 'CLINIC_CLOSED_HOLIDAY';

export interface SchedulingError {
  code: SchedulingErrorCode;
  message: string;
}

/**
 * If the clinic observes US federal holidays and the given date ("yyyy-MM-dd")
 * is one, returns the holiday name (the clinic is closed); otherwise null.
 */
export function clinicHolidayClosure(clinic: Clinic, dateStr: string): string | null {
  if (!clinic.observesHolidays) return null;
  return getUsHoliday(dateStr);
}

/**
 * Two half-open intervals [start, end) overlap.
 * Touching edges (one ends exactly when the other starts) do NOT conflict,
 * so back-to-back appointments are allowed.
 */
export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Validates an appointment against the scheduling business rules:
 * - the time range must be valid (end after start),
 * - it must fall within the clinic's operating hours,
 * - the sonographer must not be double-booked.
 *
 * When editing, `draft.id` excludes the appointment from the conflict check
 * so an appointment can be moved within (or around) its own current slot.
 */
export function validateAppointment(
  draft: AppointmentDraft,
  existing: Appointment[],
  clinic: Clinic,
): SchedulingError[] {
  const errors: SchedulingError[] = [];
  const start = new Date(draft.start);
  const end = new Date(draft.end);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    return [{ code: 'INVALID_RANGE', message: 'End time must be after start time.' }];
  }

  const holiday = clinicHolidayClosure(clinic, draft.start.slice(0, 10));
  if (holiday) {
    errors.push({
      code: 'CLINIC_CLOSED_HOLIDAY',
      message: `${clinic.name} is closed on ${holiday}. Choose a clinic that's open that day.`,
    });
  }

  const sameDay = start.toDateString() === end.toDateString();
  const withinHours =
    sameDay &&
    minutesOfDay(start) >= timeToMinutes(clinic.openTime) &&
    minutesOfDay(end) <= timeToMinutes(clinic.closeTime);

  if (!withinHours) {
    errors.push({
      code: 'OUTSIDE_CLINIC_HOURS',
      message: `${clinic.name} operates from ${clinic.openTime} to ${clinic.closeTime}.`,
    });
  }

  const conflict = existing.find(
    (appointment) =>
      appointment.id !== draft.id &&
      appointment.sonographerId === draft.sonographerId &&
      overlaps(start, end, new Date(appointment.start), new Date(appointment.end)),
  );

  if (conflict) {
    errors.push({
      code: 'DOUBLE_BOOKED',
      message: `This sonographer is already booked from ${conflict.start.slice(11, 16)} to ${conflict.end.slice(11, 16)}.`,
    });
  }

  return errors;
}
