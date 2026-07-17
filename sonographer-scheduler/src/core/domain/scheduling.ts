import { getUsHoliday } from './holidays';
import type { Appointment, AppointmentDraft, Clinic } from './types';
import { buildLocalIso, minutesOfDay, timeToMinutes } from './time';

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
 * The only fields the scheduling rules need. Narrower than `AppointmentDraft`
 * so callers (e.g. the form, before a patient exists) don't have to invent one.
 */
export type AppointmentSlot = Pick<AppointmentDraft, 'id' | 'sonographerId' | 'start' | 'end'>;

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
 * When editing, `slot.id` excludes the appointment from the conflict check
 * so an appointment can be moved within (or around) its own current slot.
 */
export function validateAppointment(
  slot: AppointmentSlot,
  existing: Appointment[],
  clinic: Clinic,
): SchedulingError[] {
  const errors: SchedulingError[] = [];
  const start = new Date(slot.start);
  const end = new Date(slot.end);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    return [{ code: 'INVALID_RANGE', message: 'End time must be after start time.' }];
  }

  const holiday = clinicHolidayClosure(clinic, slot.start.slice(0, 10));
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
      appointment.id !== slot.id &&
      appointment.sonographerId === slot.sonographerId &&
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

/**
 * Moves an appointment to a new sonographer and start time (minutes since
 * midnight), preserving its duration and calendar day. Pure geometry — it does
 * not enforce any rule; feed the result to `validateAppointment` before saving.
 */
export function computeMovedSlot(
  appointment: Appointment,
  sonographerId: string,
  startMinutes: number,
): AppointmentSlot {
  const durationMinutes =
    (new Date(appointment.end).getTime() - new Date(appointment.start).getTime()) / 60_000;
  const date = appointment.start.slice(0, 10);
  return {
    id: appointment.id,
    sonographerId,
    start: buildLocalIso(date, startMinutes),
    end: buildLocalIso(date, startMinutes + durationMinutes),
  };
}
