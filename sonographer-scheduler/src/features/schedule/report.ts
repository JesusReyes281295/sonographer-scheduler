import { addDays, differenceInCalendarDays, format } from 'date-fns';
import type { Appointment } from '../../core/domain/types';

/** How the printable report groups its rows. */
export type ReportGroupBy = 'day' | 'sonographer' | 'clinic';

/** Reports cover at most a month at a time — one query per day keeps this cheap. */
export const MAX_REPORT_DAYS = 31;

/** Noon avoids any DST edge cases when shifting whole days. */
const atNoon = (day: string) => new Date(`${day}T12:00:00`);

/**
 * Every day of the report range as "yyyy-MM-dd", inclusive on both ends,
 * capped at MAX_REPORT_DAYS. An unset or backwards range yields no days.
 */
export function reportDays(from: string, to: string): string[] {
  if (!from || !to || to < from) return [];
  const span = Math.min(differenceInCalendarDays(atNoon(to), atNoon(from)) + 1, MAX_REPORT_DAYS);
  return Array.from({ length: span }, (_, i) => format(addDays(atNoon(from), i), 'yyyy-MM-dd'));
}

/** Duration of one appointment in minutes. */
export function appointmentMinutes(appointment: Appointment): number {
  return (new Date(appointment.end).getTime() - new Date(appointment.start).getTime()) / 60_000;
}

/** "45 min", "3 h", "6 h 30 min" — for the report's booked-time summary. */
export function formatBookedTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}
