import { useState } from 'react';
import type {
  Appointment,
  Clinic,
  ConsultationType,
  Patient,
  Sonographer,
} from '../../../core/domain/types';
import { minutesOfDay, minutesToTime } from '../../../core/domain/time';
import styles from './ScheduleGrid.module.css';

const DAY_START_HOUR = 7;
const DAY_END_HOUR = 19;
const PX_PER_MINUTE = 1;
const SLOT_MINUTES = 30;
/** Enough for the patient name alone. */
const MIN_CARD_HEIGHT = 24;
/** Below this, the time/clinic line would be cut in half — show the name only. */
const DETAILS_MIN_HEIGHT = 44;

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
  patients: Patient[];
  consultationTypes: ConsultationType[];
  appointments: Appointment[];
  /** Called with the sonographer and the slot's start (minutes since midnight). */
  onSlotClick: (sonographerId: string, startMinutes: number) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  /** Dropped an appointment onto a slot: its id, the target sonographer and start (minutes). */
  onAppointmentMove: (appointmentId: string, sonographerId: string, startMinutes: number) => void;
}

export function ScheduleGrid({
  sonographers,
  clinics,
  patients,
  consultationTypes,
  appointments,
  onSlotClick,
  onAppointmentClick,
  onAppointmentMove,
}: ScheduleGridProps) {
  // The appointment currently being dragged. While set, cards go
  // `pointer-events: none` (see the CSS) so drops land on the slots underneath.
  const [draggingId, setDraggingId] = useState<string | null>(null);

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
          <div
            key={sonographer.id}
            className={`${styles.column}${draggingId ? ` ${styles.dragActive}` : ''}`}
            style={{ height: DAY_HEIGHT }}
          >
            {/* Real buttons per empty slot keep "create at this time" keyboard- and
                screen-reader-accessible, and double as drop targets for dragged cards. */}
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
                onDragOver={(event) => {
                  if (draggingId) event.preventDefault(); // allow the drop
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (draggingId) onAppointmentMove(draggingId, sonographer.id, minutes);
                }}
                aria-label={`Create appointment for ${sonographer.name} at ${minutesToTime(minutes)}`}
              />
            ))}

            {appointments
              .filter((appointment) => appointment.sonographerId === sonographer.id)
              .map((appointment) => {
                const clinic = clinics.find((c) => c.id === appointment.clinicId);
                const patientName =
                  patients.find((p) => p.id === appointment.patientId)?.name ?? 'Unknown patient';
                const type = consultationTypes.find((t) => t.id === appointment.consultationTypeId);
                const start = new Date(appointment.start);
                const end = new Date(appointment.end);
                const top = (minutesOfDay(start) - DAY_START_MINUTES) * PX_PER_MINUTE;
                const height = Math.max(
                  ((end.getTime() - start.getTime()) / 60_000) * PX_PER_MINUTE,
                  MIN_CARD_HEIGHT,
                );
                const timeRange = `${appointment.start.slice(11, 16)}–${appointment.end.slice(11, 16)}`;
                // Short appointments only have room for the name; the full details
                // stay available via the tooltip and the aria-label.
                const showDetails = height >= DETAILS_MIN_HEIGHT;

                return (
                  <button
                    key={appointment.id}
                    type="button"
                    className={`${styles.appointment}${draggingId === appointment.id ? ` ${styles.dragging}` : ''}`}
                    style={{ top, height, backgroundColor: clinic?.color }}
                    draggable
                    onDragStart={(event) => {
                      // Firefox only starts a drag once some data is set.
                      event.dataTransfer.setData('text/plain', appointment.id);
                      event.dataTransfer.effectAllowed = 'move';
                      setDraggingId(appointment.id);
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    onClick={() => onAppointmentClick(appointment)}
                    title={`${patientName} · ${type?.name ?? 'Consultation'} · ${timeRange} · ${clinic?.name ?? ''}`}
                    aria-label={`Edit appointment: ${patientName}, ${type?.name ?? 'consultation'}, ${timeRange}, ${clinic?.name ?? 'unknown clinic'}, with ${sonographer.name}`}
                  >
                    <strong>
                      {type && <span aria-hidden="true">{type.icon} </span>}
                      {patientName}
                    </strong>
                    {showDetails && (
                      <span>
                        {timeRange} · {clinic?.name}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        ))}
      </div>
    </section>
  );
}
