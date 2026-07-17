import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import type { Appointment, AppointmentDraft } from '../../../core/domain/types';
import { computeMovedSlot, validateAppointment } from '../../../core/domain/scheduling';
import { buildLocalIso } from '../../../core/domain/time';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { Spinner } from '../../../shared/components/Spinner';
import { useAppointmentMutations, useMoveAppointment } from '../hooks/useAppointmentMutations';
import { usePersistentState } from '../hooks/usePersistentState';
import type { DropTarget } from '../hooks/useAppointmentDrag';
import {
  useAppointments,
  useClinics,
  useConsultationTypes,
  useCreatePatient,
  usePatientMutations,
  usePatients,
  useSonographers,
  useWeekAppointments,
} from '../hooks/useScheduleData';
import { weekDays } from '../weekLayout';
import { AppointmentFormDialog } from './AppointmentFormDialog';
import type { AppointmentFormValues } from './AppointmentFormDialog';
import { ManagementDialog } from './ManagementDialog';
import { PrintableAppointment } from './PrintableAppointment';
import { ScheduleGrid } from './ScheduleGrid';
import { ScheduleFilters } from './ScheduleFilters';
import { EMPTY_FILTERS, type Filters } from '../filters';
import { WeekGrid } from './WeekGrid';
import { TutorialTour, type TourStep } from './TutorialTour';
import { AboutDialog } from './AboutDialog';

type View = 'day' | 'week';

type DialogState =
  | { mode: 'create'; initial: Partial<AppointmentFormValues> }
  | { mode: 'edit'; appointment: Appointment }
  | null;

const toDateParam = (date: Date) => format(date, 'yyyy-MM-dd');
/** Noon avoids any DST edge cases when shifting whole days. */
const atNoon = (date: string) => new Date(`${date}T12:00:00`);

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome 👋',
    body: 'This quick tutorial shows you around the schedule. Use Next and Back (or the arrow keys), and press Escape to leave at any time.',
  },
  {
    target: '[data-tour="view"]',
    title: 'Day or week',
    body: 'Switch between a single day and the whole week here. The app always opens on the day view.',
  },
  {
    target: '[data-tour="filters"]',
    title: 'Filter the schedule',
    body: 'Show only certain sonographers or clinics. With nothing selected, everything is shown.',
  },
  {
    target: 'section[aria-label*="schedule"]',
    title: 'Book, edit, and drag',
    body: 'Click an empty slot to book, click an appointment to edit it, and drag a card to reschedule — to another time, another sonographer, or (in the week view) another day.',
  },
  {
    target: '[data-tour="new"]',
    title: 'New appointment',
    body: 'Prefer a form? Start a new appointment here and pick the patient, study type, time and clinic.',
  },
  {
    target: '[data-tour="manage"]',
    title: 'Manage your hospital',
    body: 'Add or edit clinics, sonographers, patients and study types in the Manage panel — the schedule updates right away.',
  },
  {
    title: "You're all set 🎉",
    body: 'That’s the tour. Reopen it anytime from the Tutorial button. Happy scheduling!',
  },
];

export function SchedulePage() {
  const [date, setDate] = useState(() => toDateParam(new Date()));
  // The app always opens on the day view; the week view is opt-in per session.
  const [view, setView] = useState<View>('day');
  const [filters, setFilters] = usePersistentState<Filters>('scheduler.filters', EMPTY_FILTERS);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [managing, setManaging] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  /** Why the last drag-and-drop move was refused (null when there's nothing to show). */
  const [moveError, setMoveError] = useState<string | null>(null);

  const days = useMemo(() => weekDays(date), [date]);

  const sonographers = useSonographers();
  const clinics = useClinics();
  const patients = usePatients();
  const consultationTypes = useConsultationTypes();
  const appointments = useAppointments(date);
  const week = useWeekAppointments(days, view === 'week');
  const mutations = useAppointmentMutations(date);
  const moveAppointment = useMoveAppointment();
  const createPatient = useCreatePatient();
  const patientMutations = usePatientMutations();

  const referenceReady =
    sonographers.data && clinics.data && patients.data && consultationTypes.data;
  const dataPending = view === 'week' ? week.isPending : appointments.isPending;
  const isLoading =
    sonographers.isPending ||
    clinics.isPending ||
    patients.isPending ||
    consultationTypes.isPending ||
    dataPending;
  const loadError =
    sonographers.error ??
    clinics.error ??
    patients.error ??
    consultationTypes.error ??
    (view === 'week' ? week.error : appointments.error);

  const shiftDays = (offset: number) => setDate((d) => toDateParam(addDays(atNoon(d), offset)));
  const step = view === 'week' ? 7 : 1;

  // A rejection message belongs to the day/view it happened on; clear it on change.
  useEffect(() => setMoveError(null), [date, view]);

  // Full, unfiltered appointments for the visible scope — used for conflict checks
  // (validation must see everything, not just what the filters show).
  const scopeAppointments: Appointment[] = useMemo(
    () => (view === 'week' ? days.flatMap((d) => week.byDay[d] ?? []) : (appointments.data ?? [])),
    [view, days, week.byDay, appointments.data],
  );

  const keep = (a: Appointment) =>
    (filters.sonographerIds.length === 0 || filters.sonographerIds.includes(a.sonographerId)) &&
    (filters.clinicIds.length === 0 || filters.clinicIds.includes(a.clinicId));

  const visibleSonographers =
    filters.sonographerIds.length === 0
      ? (sonographers.data ?? [])
      : (sonographers.data ?? []).filter((s) => filters.sonographerIds.includes(s.id));

  /**
   * Reuse an existing patient by name, or register a new one on the fly. The
   * phone typed in the form is saved to the patient's record either way, so
   * reminders always have a current number.
   */
  const resolvePatientId = async (name: string, phone?: string): Promise<string> => {
    const trimmed = name.trim();
    const existing = patients.data?.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      if (phone && phone !== existing.phone) {
        await patientMutations.update.mutateAsync({ ...existing, phone });
      }
      return existing.id;
    }
    const created = await createPatient.mutateAsync({ name: trimmed, phone });
    return created.id;
  };

  const handleSubmit = async (values: AppointmentFormValues) => {
    const patientId = await resolvePatientId(values.patientName, values.patientPhone);
    const draft: AppointmentDraft = {
      patientId,
      consultationTypeId: values.consultationTypeId,
      sonographerId: values.sonographerId,
      clinicId: values.clinicId,
      start: values.start,
      end: values.end,
      notes: values.notes,
    };

    if (dialog?.mode === 'edit') {
      await mutations.update.mutateAsync({ ...draft, id: dialog.appointment.id });
    } else {
      await mutations.create.mutateAsync(draft);
    }
  };

  const handleDelete = async () => {
    if (dialog?.mode === 'edit') {
      await mutations.remove.mutateAsync(dialog.appointment.id);
    }
  };

  /**
   * Dropping a card onto a slot: recompute its sonographer / day / time, run it
   * through the same booking rules as the form, and either save it (moving across
   * days when needed) or explain the refusal.
   */
  const handleAppointmentMove = async (appointmentId: string, target: DropTarget) => {
    const appointment = scopeAppointments.find((a) => a.id === appointmentId);
    const clinic = clinics.data?.find((c) => c.id === appointment?.clinicId);
    if (!appointment || !clinic) return;

    const fromDate = appointment.start.slice(0, 10);
    const sonographerId = target.sonographerId ?? appointment.sonographerId;
    const targetDate = target.date ?? fromDate;
    const slot = computeMovedSlot(appointment, sonographerId, target.startMinutes, targetDate);

    // Dropped back where it started — nothing to do.
    if (slot.start === appointment.start && slot.sonographerId === appointment.sonographerId) return;

    // Validate against the target day's appointments (hours/holiday/conflicts use it).
    const targetDayAppointments =
      targetDate === fromDate
        ? scopeAppointments
        : (week.byDay[targetDate] ?? scopeAppointments);
    const errors = validateAppointment(slot, targetDayAppointments, clinic);
    if (errors.length > 0) {
      setMoveError(errors[0].message);
      return;
    }

    // Moving into the past is allowed, but easy to do by accident — warn first.
    if (targetDate < toDateParam(new Date())) {
      const proceed = window.confirm(
        'This appointment would move to a date that has already passed. Move it anyway?',
      );
      if (!proceed) return;
    }

    setMoveError(null);
    await moveAppointment.mutateAsync({
      fromDate,
      next: {
        ...appointment,
        sonographerId: slot.sonographerId,
        start: slot.start,
        end: slot.end,
      },
    });
  };

  const editPatient =
    dialog?.mode === 'edit'
      ? patients.data?.find((p) => p.id === dialog.appointment.patientId)
      : undefined;
  const formInitial: Partial<AppointmentFormValues> =
    dialog?.mode === 'edit'
      ? {
          id: dialog.appointment.id,
          patientName: editPatient?.name ?? '',
          patientPhone: editPatient?.phone,
          sonographerId: dialog.appointment.sonographerId,
          clinicId: dialog.appointment.clinicId,
          consultationTypeId: dialog.appointment.consultationTypeId,
          start: dialog.appointment.start,
          end: dialog.appointment.end,
          notes: dialog.appointment.notes,
        }
      : (dialog?.initial ?? {});

  const isReady = Boolean(referenceReady) && !isLoading && !loadError;
  const scopeEmpty = scopeAppointments.length === 0;

  return (
    <main className="page">
      <header className="toolbar">
        <div className="toolbar__top">
          <h1>Sonographer schedule</h1>
          <div className="toolbar__actions">
            <button type="button" className="button--ghost" onClick={() => setAboutOpen(true)}>
              Learn more about Sonographer Scheduler
            </button>
            <button type="button" className="button--ghost" onClick={() => setTourOpen(true)}>
              Tutorial
            </button>
            <button type="button" data-tour="manage" onClick={() => setManaging(true)}>
              Manage
            </button>
            <button
              type="button"
              data-tour="new"
              className="button--primary"
              onClick={() => setDialog({ mode: 'create', initial: {} })}
            >
              New appointment
            </button>
          </div>
        </div>

        <div className="toolbar__controls">
          <div className="view-toggle" data-tour="view">
            <button
              type="button"
              className={`view-toggle__btn${view === 'day' ? ' is-active' : ''}`}
              aria-pressed={view === 'day'}
              onClick={() => setView('day')}
            >
              Day
            </button>
            <button
              type="button"
              className={`view-toggle__btn${view === 'week' ? ' is-active' : ''}`}
              aria-pressed={view === 'week'}
              onClick={() => setView('week')}
            >
              Week
            </button>
          </div>

          <nav className="toolbar__nav" aria-label={view === 'week' ? 'Change week' : 'Change day'}>
            <button type="button" onClick={() => shiftDays(-step)}>
              ← Previous
            </button>
            <button type="button" onClick={() => setDate(toDateParam(new Date()))}>
              Today
            </button>
            <button type="button" onClick={() => shiftDays(step)}>
              Next →
            </button>
          </nav>

          <p className="toolbar__date">
            {view === 'week'
              ? `${format(atNoon(days[0]), 'MMM d')} – ${format(atNoon(days[6]), 'MMM d, yyyy')}`
              : format(atNoon(date), 'EEEE, MMMM d, yyyy')}
          </p>

          {/* Jump straight to any date instead of clicking Next dozens of times. */}
          <input
            type="date"
            className="toolbar__jump"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            aria-label="Jump to date"
          />

          {sonographers.data && clinics.data && (
            <div className="toolbar__filters">
              <ScheduleFilters
                sonographers={sonographers.data}
                clinics={clinics.data}
                value={filters}
                onChange={setFilters}
              />
            </div>
          )}
        </div>
      </header>

      {clinics.data && (
        <div className="legend-row">
          <span className="legend-row__label">Clinics</span>
          {/* Every clinic is always visible as a colour-tinted chip; clicking one
              filters the schedule to it (in sync with the Filters panel). */}
          <ul className="legend" aria-label="Clinics — click one to filter the schedule">
            {clinics.data.map((clinic) => {
              const active = filters.clinicIds.includes(clinic.id);
              const dimmed = filters.clinicIds.length > 0 && !active;
              return (
                <li key={clinic.id}>
                  <button
                    type="button"
                    className={`legend-chip${dimmed ? ' legend-chip--off' : ''}`}
                    style={{ '--clinic-color': clinic.color } as CSSProperties & Record<`--${string}`, string>}
                    aria-pressed={active}
                    title={`${clinic.openTime}–${clinic.closeTime}${
                      clinic.observesHolidays ? ' · closed on US holidays' : ''
                    } — click to filter`}
                    onClick={() =>
                      setFilters({
                        ...filters,
                        clinicIds: active
                          ? filters.clinicIds.filter((id) => id !== clinic.id)
                          : [...filters.clinicIds, clinic.id],
                      })
                    }
                  >
                    <span className="legend__dot" style={{ backgroundColor: clinic.color }} aria-hidden="true" />
                    {clinic.icon && <span aria-hidden="true">{clinic.icon} </span>}
                    {clinic.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {loadError && (
        <ErrorBanner
          message={loadError.message}
          onRetry={() => {
            void sonographers.refetch();
            void clinics.refetch();
            void patients.refetch();
            void consultationTypes.refetch();
            if (view === 'week') week.refetch();
            else void appointments.refetch();
          }}
        />
      )}

      {moveError && (
        <div role="alert" className="error-banner">
          <p>Couldn't move the appointment: {moveError}</p>
          <button type="button" onClick={() => setMoveError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {isLoading && !loadError && <Spinner label="Loading schedule…" />}

      {isReady && referenceReady && (
        <>
          {scopeEmpty && (
            <p className="empty-state">
              No appointments {view === 'week' ? 'this week' : 'for this day'} yet — click a time slot
              to create one.
            </p>
          )}

          {view === 'week' ? (
            <WeekGrid
              days={days}
              appointmentsByDay={Object.fromEntries(
                days.map((d) => [d, (week.byDay[d] ?? []).filter(keep)]),
              )}
              clinics={clinics.data!}
              patients={patients.data!}
              sonographers={sonographers.data!}
              consultationTypes={consultationTypes.data!}
              onSlotClick={(slotDate, startMinutes) =>
                setDialog({
                  mode: 'create',
                  initial: {
                    start: buildLocalIso(slotDate, startMinutes),
                    end: buildLocalIso(slotDate, startMinutes + 60),
                  },
                })
              }
              onAppointmentClick={(appointment) => setDialog({ mode: 'edit', appointment })}
              onAppointmentMove={handleAppointmentMove}
            />
          ) : (
            <ScheduleGrid
              date={date}
              sonographers={visibleSonographers}
              clinics={clinics.data!}
              patients={patients.data!}
              consultationTypes={consultationTypes.data!}
              appointments={(appointments.data ?? []).filter(keep)}
              onSlotClick={(sonographerId, startMinutes) =>
                setDialog({
                  mode: 'create',
                  initial: {
                    sonographerId,
                    start: buildLocalIso(date, startMinutes),
                    end: buildLocalIso(date, startMinutes + 60),
                  },
                })
              }
              onAppointmentClick={(appointment) => setDialog({ mode: 'edit', appointment })}
              onAppointmentMove={handleAppointmentMove}
            />
          )}
        </>
      )}

      {managing && <ManagementDialog onClose={() => setManaging(false)} />}

      {tourOpen && <TutorialTour steps={TOUR_STEPS} onClose={() => setTourOpen(false)} />}

      {aboutOpen && <AboutDialog onClose={() => setAboutOpen(false)} />}

      {dialog?.mode === 'edit' && referenceReady && (
        <PrintableAppointment
          appointment={dialog.appointment}
          patients={patients.data!}
          sonographers={sonographers.data!}
          clinics={clinics.data!}
          consultationTypes={consultationTypes.data!}
        />
      )}

      {dialog && referenceReady && (
        <AppointmentFormDialog
          mode={dialog.mode}
          date={date}
          initial={formInitial}
          sonographers={sonographers.data!}
          clinics={clinics.data!}
          patients={patients.data!}
          consultationTypes={consultationTypes.data!}
          appointments={scopeAppointments}
          onSubmit={handleSubmit}
          onDelete={dialog.mode === 'edit' ? handleDelete : undefined}
          onClose={() => setDialog(null)}
        />
      )}
    </main>
  );
}
