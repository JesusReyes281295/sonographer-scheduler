import { type PointerEvent as ReactPointerEvent, useRef, useState } from 'react';

/** Pointer travel (px) before a press turns into a drag instead of a click. */
const DRAG_THRESHOLD = 4;

/** Where a card was dropped, read from the target slot's data-* attributes. */
export interface DropTarget {
  startMinutes: number;
  /** Present in the day view (columns are sonographers). */
  sonographerId?: string;
  /** Present in the week view (columns are days, "yyyy-MM-dd"). */
  date?: string;
}

export interface DragPreview {
  x: number;
  y: number;
  label: string;
  color?: string;
}

interface DragState {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
  label: string;
  color?: string;
}

/**
 * Pointer-driven dragging for appointment cards, shared by the day and week
 * grids. The native HTML5 drag API doesn't start on `<button>` elements, so cards
 * stay real buttons (click / keyboard still open the edit dialog) and a press that
 * moves past a small threshold becomes a drag. On release, the slot under the
 * pointer — a `[data-slot]` element carrying `data-minutes` plus `data-sonographer-id`
 * (day view) or `data-date` (week view) — says where it landed.
 */
export function useAppointmentDrag(onMove: (appointmentId: string, target: DropTarget) => void) {
  const dragRef = useRef<DragState | null>(null);
  // Set true right after a drag so the trailing click doesn't also open the dialog.
  const suppressClickRef = useRef(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<DragPreview | null>(null);

  const endDrag = () => {
    dragRef.current = null;
    setDraggingId(null);
    setPreview(null);
  };

  const onPointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
    appointmentId: string,
    label: string,
    color?: string,
  ) => {
    if (event.button !== 0) return; // primary button / primary touch only
    dragRef.current = {
      id: appointmentId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      label,
      color,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.moved) {
      if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < DRAG_THRESHOLD) {
        return;
      }
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

  const onPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved) {
      suppressClickRef.current = true;
      const slot = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>('[data-slot]');
      if (slot?.dataset.minutes) {
        onMove(drag.id, {
          startMinutes: Number(slot.dataset.minutes),
          sonographerId: slot.dataset.sonographerId,
          date: slot.dataset.date,
        });
      }
    }
    endDrag();
  };

  /** Open the edit dialog on a plain click, but swallow the click that ends a drag. */
  const guardClick = (open: () => void) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    open();
  };

  return {
    draggingId,
    preview,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: endDrag,
    guardClick,
  };
}
