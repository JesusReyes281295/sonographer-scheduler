import { type PointerEvent as ReactPointerEvent, useRef, useState } from 'react';
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
/** Pointer travel (px) before a press turns into a drag instead of a click. */
const DRAG_THRESHOLD = 4;

const DAY_START_MINUTES = DAY_START_HOUR * 60;
const DAY_HEIGHT = (DAY_END_HOUR - DAY_START_HOUR) * 60 * PX_PER_MINUTE;

const HOURS = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i);
const SLOTS = Array.from(
  { length: ((DAY_END_HOUR - DAY_START_HOUR) * 60) / SLOT_MINUTES },
  (_, i) => DAY_START_MINUTES + i * SLOT_MINUTES,
);

interface DragState {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
  label: string;
  color?: string;
}

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
  // Dragging is done with pointer events, not the native HTML5 drag API, which
  // doesn't start reliably on <button> elements. The card stays a real button
  // (click / keyboard still open the edit dialog); a drag is a press that then
  // moves past a small threshold.
  const dragRef = useRef<DragState | null>(null);
  // Set true right after a drag so the trailing click doesn't also open the dialog.
  const suppressClickRef = useRef(false);
  // Mirrors dragRef.id for rendering (dim the card, and put the grid in drag mode
  // so other cards stop intercepting the pointer — see the CSS).
  const [draggingId, setDraggingId] = useState<string | null>(null);
  // A lightweight clone that follows the pointer while dragging.
  const [preview, setPreview] = useState<{ x: number; y: number; label: string; color?: string } | null>(
    null,
  );

  const endDrag = () => {
    dragRef.current = null;
    setDraggingId(null);
    setPreview(null);
  };

  const handleCardPointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
    appointment: Appointment,
    label: string,
    color?: string,
  ) => {
    if (event.button !== 0) return; // primary button / primary touch only
    dragRef.current = {
      id: appointment.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      label,
      color,
    };
  };

  const handleCardPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.moved) {
      const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
      if (distance < DRAG_THRESHOLD) return;
      drag.moved = true;
      setDraggingId(drag.id);
      try {
        // Route the rest of the gesture to this card even when the pointer leaves it.
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Unsupported (e.g. jsdom): moves still arrive while over the card.
      }
    }
    setPreview({ x: event.clientX, y: event.clientY, label: drag.label, color: drag.color });
  };

  const handleCardPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved) {
      suppressClickRef.current = true;
      // The slots underneath carry the target sonographer + time; find the one
      // under the release point (dragged-over cards are pointer-events:none).
      const slot = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>('[data-slot]');
      if (slot?.dataset.sonographerId && slot.dataset.minutes) {
        onAppointmentMove(drag.id, slot.dataset.sonographerId, Number(slot.dataset.minutes));
      }
    }
    endDrag();
  };

  const handleCardClick = (appointment: Appointment) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false; // this "click" was the end of a drag
      return;
    }
    onAppointmentClick(appointment);
  };

  return (
    <section className={styles.wrapper} aria-label="Daily schedule by sonographer">
      <div
        className={`${styles.grid}${draggingId ? ` ${styles.dragActive}` : ''}`}
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
                    className={`${styles.appointment}${draggingId === appointment.id ? ` ${styles.dragging}` : ''}`}
                    style={{ top, height, backgroundColor: clinic?.color }}
                    onPointerDown={(event) =>
                      handleCardPointerDown(event, appointment, `${patientName} · ${timeRange}`, clinic?.color)
                    }
                    onPointerMove={handleCardPointerMove}
                    onPointerUp={handleCardPointerUp}
                    onPointerCancel={endDrag}
                    onClick={() => handleCardClick(appointment)}
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

      {preview && (
        <div
          className={styles.dragPreview}
          style={{ left: preview.x, top: preview.y, backgroundColor: preview.color }}
          aria-hidden="true"
        >
          {preview.label}
        </div>
      )}
    </section>
  );
}
