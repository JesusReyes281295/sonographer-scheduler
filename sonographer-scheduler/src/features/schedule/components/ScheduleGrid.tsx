import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import type {
  Appointment,
  Clinic,
  ConsultationType,
  Patient,
  Sonographer,
} from '../../../core/domain/types';
import { minutesOfDay, minutesToTime } from '../../../core/domain/time';
import {
  DAY_HEIGHT,
  DAY_START_MINUTES,
  HOURS,
  MIN_CARD_HEIGHT,
  PX_PER_MINUTE,
  SLOTS,
  SLOT_MINUTES,
} from '../gridConstants';
import { type DropTarget, useAppointmentDrag } from '../hooks/useAppointmentDrag';
import { useNowMinutes } from '../hooks/useNowMinutes';
import styles from './ScheduleGrid.module.css';

/** Below this, the time/clinic line would be cut in half — show the name only. */
const DETAILS_MIN_HEIGHT = 44;

interface ScheduleGridProps {
  /** The day being displayed, "yyyy-MM-dd" — the now line only shows on today. */
  date: string;
  sonographers: Sonographer[];
  clinics: Clinic[];
  patients: Patient[];
  consultationTypes: ConsultationType[];
  appointments: Appointment[];
  /** Called with the sonographer and the slot's start (minutes since midnight). */
  onSlotClick: (sonographerId: string, startMinutes: number) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  /** Dropped a card onto a slot: its id and where it landed (sonographer + time). */
  onAppointmentMove: (appointmentId: string, target: DropTarget) => void;
}

export function ScheduleGrid({
  date,
  sonographers,
  clinics,
  patients,
  consultationTypes,
  appointments,
  onSlotClick,
  onAppointmentClick,
  onAppointmentMove,
}: ScheduleGridProps) {
  const drag = useAppointmentDrag(onAppointmentMove);
  const wrapperRef = useRef<HTMLElement>(null);

  const nowMinutes = useNowMinutes();
  const isToday = date === format(new Date(), 'yyyy-MM-dd');
  const nowTop = (nowMinutes - DAY_START_MINUTES) * PX_PER_MINUTE;
  const showNow = isToday && nowTop >= 0 && nowTop <= DAY_HEIGHT;

  // Open the grid around the current time instead of always at 07:00.
  useEffect(() => {
    const el = wrapperRef.current;
    if (el && showNow) {
      el.scrollTop = Math.max(0, nowTop - el.clientHeight / 3);
    }
    // Only on mount: don't fight the user's scrolling as the clock ticks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section ref={wrapperRef} className={styles.wrapper} aria-label="Daily schedule by sonographer">
      <div
        className={`${styles.grid}${drag.draggingId ? ` ${styles.dragActive}` : ''}`}
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
                data-slot="true"
                data-sonographer-id={sonographer.id}
                data-minutes={minutes}
                onClick={() => onSlotClick(sonographer.id, minutes)}
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
                    className={`${styles.appointment}${drag.draggingId === appointment.id ? ` ${styles.dragging}` : ''}`}
                    style={{ top, height, backgroundColor: clinic?.color }}
                    onPointerDown={(event) =>
                      drag.onPointerDown(event, appointment.id, `${patientName} · ${timeRange}`, clinic?.color)
                    }
                    onPointerMove={drag.onPointerMove}
                    onPointerUp={drag.onPointerUp}
                    onPointerCancel={drag.onPointerCancel}
                    onClick={() => drag.guardClick(() => onAppointmentClick(appointment))}
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

            {showNow && <div className={styles.nowLine} style={{ top: nowTop }} aria-hidden="true" />}
          </div>
        ))}
      </div>

      {drag.preview && (
        <div
          className="drag-preview"
          style={{ left: drag.preview.x, top: drag.preview.y, backgroundColor: drag.preview.color }}
          aria-hidden="true"
        >
          {drag.preview.label}
        </div>
      )}
    </section>
  );
}
