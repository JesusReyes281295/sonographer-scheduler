import { addDays, format, startOfWeek } from 'date-fns';
import type { Appointment } from '../../core/domain/types';

/** Monday-first week keeps the work week together and weekends at the end. */
const WEEK_STARTS_ON = 1;

/** The seven "yyyy-MM-dd" days of the week that contains `date` (Mon–Sun). */
export function weekDays(date: string): string[] {
  const monday = startOfWeek(new Date(`${date}T12:00:00`), { weekStartsOn: WEEK_STARTS_ON });
  return Array.from({ length: 7 }, (_, i) => format(addDays(monday, i), 'yyyy-MM-dd'));
}

export interface LaidOutAppointment {
  appointment: Appointment;
  /** 0-based column index within its overlap cluster. */
  lane: number;
  /** How many columns the cluster is split into (for width). */
  lanes: number;
}

/**
 * Packs a single day's appointments into side-by-side lanes so overlapping ones
 * don't cover each other (a week column stacks every sonographer, so overlaps are
 * expected). All appointments in one overlap cluster share the same lane count, so
 * they render as equal-width columns. Pure; ISO datetime strings compare directly.
 */
export function layoutDayAppointments(appointments: Appointment[]): LaidOutAppointment[] {
  const sorted = [...appointments].sort(
    (a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end),
  );

  const result: LaidOutAppointment[] = [];
  let cluster: LaidOutAppointment[] = [];
  let clusterEnd = ''; // latest end in the current cluster
  let lanes: string[] = []; // each lane's last end

  const flush = () => {
    for (const item of cluster) item.lanes = lanes.length;
    result.push(...cluster);
    cluster = [];
    lanes = [];
    clusterEnd = '';
  };

  for (const appointment of sorted) {
    // A gap (this starts at/after everything so far) closes the cluster.
    if (cluster.length > 0 && appointment.start >= clusterEnd) flush();

    // Reuse the first lane that has freed up, otherwise open a new one.
    let lane = lanes.findIndex((end) => end <= appointment.start);
    if (lane === -1) {
      lane = lanes.length;
      lanes.push(appointment.end);
    } else {
      lanes[lane] = appointment.end;
    }

    cluster.push({ appointment, lane, lanes: 0 });
    if (appointment.end > clusterEnd) clusterEnd = appointment.end;
  }
  flush();

  return result;
}
