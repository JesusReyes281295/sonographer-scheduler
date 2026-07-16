import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { clinicHolidayClosure, validateAppointment } from '../../../core/domain/scheduling';
import type { Appointment, AppointmentDraft, Clinic, Sonographer } from '../../../core/domain/types';
import styles from './AppointmentFormDialog.module.css';

/** One-tap note shortcuts so the front desk doesn't retype common annotations. */
const NOTE_SUGGESTIONS = ['Urgent', 'Possibly cancelled', 'Follow-up needed', 'New patient', 'Bring prior scans'];

interface AppointmentFormDialogProps {
  mode: 'create' | 'edit';
  /** Currently displayed day, "yyyy-MM-dd" — default for new appointments. */
  date: string;
  initial: Partial<Appointment>;
  sonographers: Sonographer[];
  clinics: Clinic[];
  /** Appointments of the visible day, used for client-side conflict validation. */
  appointments: Appointment[];
  onSubmit: (draft: AppointmentDraft) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

const timeOf = (iso: string | undefined, fallback: string) => (iso ? iso.slice(11, 16) : fallback);

export function AppointmentFormDialog({
  mode,
  date,
  initial,
  sonographers,
  clinics,
  appointments,
  onSubmit,
  onDelete,
  onClose,
}: AppointmentFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formId = useId();
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [patientName, setPatientName] = useState(initial.patientName ?? '');
  const [sonographerId, setSonographerId] = useState(initial.sonographerId ?? sonographers[0]?.id ?? '');
  const [clinicId, setClinicId] = useState(initial.clinicId ?? clinics[0]?.id ?? '');
  const [day, setDay] = useState(initial.start ? initial.start.slice(0, 10) : date);
  const [startTime, setStartTime] = useState(timeOf(initial.start, '09:00'));
  const [endTime, setEndTime] = useState(timeOf(initial.end, '10:00'));
  const [notes, setNotes] = useState(initial.notes ?? '');

  // Native <dialog> gives us focus trapping, Escape-to-close and a backdrop for free.
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  // Holiday awareness: if the chosen clinic is closed on the chosen day, warn and
  // suggest clinics that are open that day so the user can rebook in one tap.
  const selectedClinic = clinics.find((c) => c.id === clinicId);
  const closureHoliday = selectedClinic ? clinicHolidayClosure(selectedClinic, day) : null;
  const openClinics = clinics.filter((c) => !clinicHolidayClosure(c, day));

  const addNote = (text: string) => {
    setNotes((current) => {
      const parts = current
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.some((p) => p.toLowerCase() === text.toLowerCase())) return current;
      return [...parts, text].join(', ');
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const draft: AppointmentDraft = {
      id: initial.id,
      patientName: patientName.trim(),
      sonographerId,
      clinicId,
      start: `${day}T${startTime}:00`,
      end: `${day}T${endTime}:00`,
      notes: notes.trim() || undefined,
    };

    // Validate locally first for instant feedback; the mock server enforces
    // the same rules, so anything that slips through is still rejected.
    const clinic = clinics.find((c) => c.id === clinicId);
    const validationErrors = clinic ? validateAppointment(draft, appointments, clinic) : [];
    if (validationErrors.length > 0) {
      setErrors(validationErrors.map((e) => e.message));
      return;
    }

    setSubmitting(true);
    setErrors([]);
    try {
      await onSubmit(draft);
      onClose();
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Something went wrong. Please try again.']);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !window.confirm('Delete this appointment?')) return;
    setSubmitting(true);
    setErrors([]);
    try {
      await onDelete();
      onClose();
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Could not delete the appointment.']);
      setSubmitting(false);
    }
  };

  return (
    <dialog ref={dialogRef} className={styles.dialog} onClose={onClose} aria-labelledby={`${formId}-title`}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2 id={`${formId}-title`}>{mode === 'create' ? 'New appointment' : 'Edit appointment'}</h2>
        {mode === 'edit' && (
          <p className={styles.hint}>Change the time or sonographer to move this appointment.</p>
        )}

        {errors.length > 0 && (
          <div role="alert" className={styles.errors}>
            <ul>
              {errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor={`${formId}-patient`}>Patient name</label>
          <input
            id={`${formId}-patient`}
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            required
            maxLength={80}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor={`${formId}-sonographer`}>Sonographer</label>
            <select
              id={`${formId}-sonographer`}
              value={sonographerId}
              onChange={(e) => setSonographerId(e.target.value)}
            >
              {sonographers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor={`${formId}-clinic`}>Clinic</label>
            <select id={`${formId}-clinic`} value={clinicId} onChange={(e) => setClinicId(e.target.value)}>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.openTime}–{c.closeTime})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor={`${formId}-date`}>Date</label>
            <input id={`${formId}-date`} type="date" value={day} onChange={(e) => setDay(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label htmlFor={`${formId}-start`}>Start</label>
            <input
              id={`${formId}-start`}
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor={`${formId}-end`}>End</label>
            <input
              id={`${formId}-end`}
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>

        {closureHoliday && (
          <output className={styles.holidayNotice}>
            <p className={styles.holidayNoticeTitle}>
              {selectedClinic?.name} is closed on {closureHoliday} (US holiday).
            </p>
            {openClinics.length > 0 ? (
              <div className={styles.holidaySuggestions}>
                <span>Open that day — book at:</span>
                <div className={styles.chips}>
                  {openClinics.slice(0, 4).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={styles.chip}
                      onClick={() => setClinicId(c.id)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p>No clinics are open on this holiday — please choose another day.</p>
            )}
          </output>
        )}

        <div className={styles.field}>
          <label htmlFor={`${formId}-notes`}>Notes (optional)</label>
          <textarea
            id={`${formId}-notes`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={300}
          />
          <div className={styles.chips} aria-label="Quick note suggestions">
            {NOTE_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className={styles.chip}
                onClick={() => addNote(suggestion)}
              >
                + {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          {onDelete && (
            <button type="button" className="button--danger" onClick={handleDelete} disabled={submitting}>
              Delete
            </button>
          )}
          <span className={styles.spacer} />
          <button type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="button--primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
