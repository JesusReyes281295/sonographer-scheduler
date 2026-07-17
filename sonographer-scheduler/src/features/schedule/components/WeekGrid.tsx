import { type CSSProperties, useEffect, useRef } from 'react';
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
import { layoutDayAppointments } from '../weekLayout';
import styles from './WeekGrid.module.css';

interface WeekGridProps {
  days: string[];
  appointmentsByDay: Record<string, Appointment[]>;
  clinics: Clinic[];
  patients: Patient[];
  sonographers: Sonographer[];
  consultationTypes: ConsultationType[];
  /** Called with the day ("yyyy-MM-dd") and the slot's start (minutes since midnight). */
  onSlotClick: (date: string, startMinutes: number) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  /** Dropped a card onto a slot: its id and where it landed (day + time). */
  onAppointmentMove: (appointmentId: string, target: DropTarget) => void;
}

const atNoon = (day: string) => new Date(`${day}T12:00:00`);

export function WeekGrid({
  days,
  appointmentsByDay,
  clinics,
  patients,
  sonographers,
  consultationTypes,
  onSlotClick,
  onAppointmentClick,
  onAppointmentMove,
}: WeekGridProps) {
  const drag = useAppointmentDrag(onAppointmentMove);
  const wrapperRef = useRef<HTMLElement>(null);
  const today = format(new Date(), 'yyyy-MM-dd');

  const nowMinutes = useNowMinutes();
  const nowTop = (nowMinutes - DAY_START_MINUTES) * PX_PER_MINUTE;
  const nowVisible = nowTop >= 0 && nowTop <= DAY_HEIGHT;

  // Open the week around the current time instead of always at 07:00.
  useEffect(() => {
    const el = wrapperRef.current;
    if (el && nowVisible) {
      el.scrollTop = Math.max(0, nowTop - el.clientHeight / 3);
    }
    // Only on mount: don't fight the user's scrolling as the clock ticks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section ref={wrapperRef} className={styles.wrapper} aria-label="Weekly schedule">
      <div className={`${styles.grid}${drag.draggingId ? ` ${styles.dragActive}` : ''}`}>
        <div className={styles.corner} />
        {days.map((day) => (
          <div
            key={day}
            className={`${styles.columnHeader}${day === today ? ` ${styles.todayHeader}` : ''}`}
          >
            {format(atNoon(day), 'EEE d')}
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

        {days.map((day) => {
          const laidOut = layoutDayAppointments(appointmentsByDay[day] ?? []);
          const noon = atNoon(day);
          const weekday = format(noon, 'EEEE');
          const isWeekend = noon.getDay() === 0 || noon.getDay() === 6;

          return (
            <div
              key={day}
              className={`${styles.column}${isWeekend ? ` ${styles.weekend}` : ''}`}
              style={{ height: DAY_HEIGHT }}
            >
              {/* Slots stay real buttons: keyboard/click "create here", and drop targets. */}
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
                  data-date={day}
                  data-minutes={minutes}
                  onClick={() => onSlotClick(day, minutes)}
                  aria-label={`Create appointment on ${weekday} at ${minutesToTime(minutes)}`}
                />
              ))}

              {laidOut.map(({ appointment, lane, lanes }) => {
                const clinic = clinics.find((c) => c.id === appointment.clinicId);
                const patientName =
                  patients.find((p) => p.id === appointment.patientId)?.name ?? 'Unknown patient';
                const sonographerName =
                  sonographers.find((s) => s.id === appointment.sonographerId)?.name ?? 'unknown';
                const type = consultationTypes.find((t) => t.id === appointment.consultationTypeId);
                const start = new Date(appointment.start);
                const end = new Date(appointment.end);
                const top = (minutesOfDay(start) - DAY_START_MINUTES) * PX_PER_MINUTE;
                const height = Math.max(
                  ((end.getTime() - start.getTime()) / 60_000) * PX_PER_MINUTE,
                  MIN_CARD_HEIGHT,
                );
                const timeRange = `${appointment.start.slice(11, 16)}–${appointment.end.slice(11, 16)}`;

                return (
                  <button
                    key={appointment.id}
                    type="button"
                    className={`${styles.appointment}${drag.draggingId === appointment.id ? ` ${styles.dragging}` : ''}`}
                    style={
                      {
                        top,
                        height,
                        // Lane position as CSS vars so :hover/:focus can expand the card
                        // to the full column width (see the CSS) without !important.
                        '--lane-left': `calc(${(lane / lanes) * 100}% + 2px)`,
                        '--lane-width': `calc(${100 / lanes}% - 4px)`,
                        backgroundColor: clinic?.color,
                      } as CSSProperties & Record<`--${string}`, string>
                    }
                    onPointerDown={(event) =>
                      drag.onPointerDown(event, appointment.id, `${patientName} · ${timeRange}`, clinic?.color)
                    }
                    onPointerMove={drag.onPointerMove}
                    onPointerUp={drag.onPointerUp}
                    onPointerCancel={drag.onPointerCancel}
                    onClick={() => drag.guardClick(() => onAppointmentClick(appointment))}
                    title={`${patientName} · ${type?.name ?? 'Consultation'} · ${timeRange} · ${sonographerName} · ${clinic?.name ?? ''}`}
                    aria-label={`Edit appointment: ${patientName}, ${type?.name ?? 'consultation'}, ${weekday} ${timeRange}, ${clinic?.name ?? 'unknown clinic'}, with ${sonographerName}`}
                  >
                    <strong>{patientName}</strong>
                  </button>
                );
              })}

              {day === today && nowVisible && (
                <div className={styles.nowLine} style={{ top: nowTop }} aria-hidden="true" />
              )}
            </div>
          );
        })}
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
