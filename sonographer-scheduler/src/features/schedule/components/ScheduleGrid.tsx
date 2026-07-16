import type { Appointment, Clinic, Sonographer } from '../../../core/domain/types';
import { minutesOfDay, minutesToTime } from '../../../core/domain/time';
import styles from './ScheduleGrid.module.css';

const DAY_START_HOUR = 7;
const DAY_END_HOUR = 19;
const PX_PER_MINUTE = 1;
const SLOT_MINUTES = 30;

const DAY_START_MINUTES = DAY_START_HOUR * 60;
const DAY_HEIGHT = (DAY_END_HOUR - DAY_START_HOUR) * 60 * PX_PER_MINUTE;

const HOURS = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i);
const SLOTS = Array.from(
  { length: ((DAY_END_HOUR - DAY_START_HOUR) * 60) / SLOT_MINUTES },
  (_, i) => DAY_START_MINUTES + i * SLOT_MINUTES,
);

interface ScheduleGridProps {
  sonographers: Sonographer[];
  clinics: Clinic[];
  appointments: Appointment[];
  /** Called with the sonographer and the slot's start (minutes since midnight). */
  onSlotClick: (sonographerId: string, startMinutes: number) => void;
  onAppointmentClick: (appointment: Appointment) => void;
}

export function ScheduleGrid({
  sonographers,
  clinics,
  appointments,
  onSlotClick,
  onAppointmentClick,
}: ScheduleGridProps) {
  return (
    <section className={styles.wrapper} aria-label="Daily schedule by sonographer">
      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `72px repeat(${sonographers.length}, minmax(160px, 1fr))` }}
      >
        <div className={styles.corner} />
        {sonographers.map((sonographer) => (
          <div key={sonographer.id} className={styles.columnHeader}>
            {sonographer.name}
          </div>
        ))}

        <div className={styles.timeGutter} style={{ height: DAY_HEIGHT }} aria-hidden="true">
          {HOURS.map((hour) => (
            <span
              key={hour}
              className={styles.hourLabel}
              style={{ top: (hour * 60 - DAY_START_MINUTES) * PX_PER_MINUTE }}
            >
              {String(hour).padStart(2, '0')}:00
            </span>
          ))}
        </div>

        {sonographers.map((sonographer) => (
          <div key={sonographer.id} className={styles.column} style={{ height: DAY_HEIGHT }}>
            {/* Real buttons per empty slot keep "create at this time" keyboard- and screen-reader-accessible. */}
            {SLOTS.map((minutes) => (
              <button
                key={minutes}
                type="button"
                className={styles.slot}
                style={{
                  top: (minutes - DAY_START_MINUTES) * PX_PER_MINUTE,
                  height: SLOT_MINUTES * PX_PER_MINUTE,
                }}
                onClick={() => onSlotClick(sonographer.id, minutes)}
                aria-label={`Create appointment for ${sonographer.name} at ${minutesToTime(minutes)}`}
              />
            ))}

            {appointments
              .filter((appointment) => appointment.sonographerId === sonographer.id)
              .map((appointment) => {
                const clinic = clinics.find((c) => c.id === appointment.clinicId);
                const start = new Date(appointment.start);
                const end = new Date(appointment.end);
                const top = (minutesOfDay(start) - DAY_START_MINUTES) * PX_PER_MINUTE;
                const height = Math.max(
                  ((end.getTime() - start.getTime()) / 60_000) * PX_PER_MINUTE,
                  24,
                );
                const timeRange = `${appointment.start.slice(11, 16)}–${appointment.end.slice(11, 16)}`;

                return (
                  <button
                    key={appointment.id}
                    type="button"
                    className={styles.appointment}
                    style={{ top, height, backgroundColor: clinic?.color }}
                    onClick={() => onAppointmentClick(appointment)}
                    aria-label={`Edit appointment: ${appointment.patientName}, ${timeRange}, ${clinic?.name ?? 'unknown clinic'}, with ${sonographer.name}`}
                  >
                    <strong>{appointment.patientName}</strong>
                    <span>
                      {timeRange} · {clinic?.name}
                    </span>
                  </button>
                );
              })}
          </div>
        ))}
      </div>
    </section>
  );
}
