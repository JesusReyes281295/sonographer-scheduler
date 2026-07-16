import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { addDays, format } from 'date-fns';
import type { Appointment, AppointmentDraft } from '../../../core/domain/types';
import { buildLocalIso } from '../../../core/domain/time';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { Spinner } from '../../../shared/components/Spinner';
import { useAppointmentMutations } from '../hooks/useAppointmentMutations';
import { useAppointments, useClinics, useSonographers } from '../hooks/useScheduleData';
import { dataApi } from '../services/scheduleApi';
import { AppointmentFormDialog } from './AppointmentFormDialog';
import { ScheduleGrid } from './ScheduleGrid';

type DialogState =
  | { mode: 'create'; initial: Partial<Appointment> }
  | { mode: 'edit'; appointment: Appointment }
  | null;

const toDateParam = (date: Date) => format(date, 'yyyy-MM-dd');
/** Noon avoids any DST edge cases when shifting whole days. */
const atNoon = (date: string) => new Date(`${date}T12:00:00`);

export function SchedulePage() {
  const [date, setDate] = useState(() => toDateParam(new Date()));
  const [dialog, setDialog] = useState<DialogState>(null);
  const [isResetting, setIsResetting] = useState(false);
  const queryClient = useQueryClient();

  const sonographers = useSonographers();
  const clinics = useClinics();
  const appointments = useAppointments(date);
  const mutations = useAppointmentMutations(date);

  const isLoading = sonographers.isPending || clinics.isPending || appointments.isPending;
  const loadError = sonographers.error ?? clinics.error ?? appointments.error;

  const changeDay = (offset: number) => setDate((d) => toDateParam(addDays(atNoon(d), offset)));

  const handleSubmit = async (draft: AppointmentDraft) => {
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

  const handleReset = async () => {
    const confirmed = window.confirm(
      'Reset all data back to the sample schedule? Any appointments you added will be lost.',
    );
    if (!confirmed) return;
    setIsResetting(true);
    try {
      await dataApi.reset();
      await queryClient.invalidateQueries();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <main className="page">
      <header className="toolbar">
        <h1>Sonographer schedule</h1>
        <nav className="toolbar__nav" aria-label="Change day">
          <button type="button" onClick={() => changeDay(-1)}>
            ← Previous
          </button>
          <button type="button" onClick={() => setDate(toDateParam(new Date()))}>
            Today
          </button>
          <button type="button" onClick={() => changeDay(1)}>
            Next →
          </button>
        </nav>
        <p className="toolbar__date">{format(atNoon(date), 'EEEE, MMMM d, yyyy')}</p>
        <button type="button" onClick={handleReset} disabled={isResetting}>
          {isResetting ? 'Resetting…' : 'Reset data'}
        </button>
        <button
          type="button"
          className="button--primary"
          onClick={() => setDialog({ mode: 'create', initial: {} })}
        >
          New appointment
        </button>
      </header>

      {clinics.data && (
        <ul className="legend" aria-label="Clinics and operating hours">
          {clinics.data.map((clinic) => (
            <li key={clinic.id}>
              <span className="legend__dot" style={{ backgroundColor: clinic.color }} aria-hidden="true" />
              {clinic.name} ({clinic.openTime}–{clinic.closeTime})
            </li>
          ))}
        </ul>
      )}

      {loadError && (
        <ErrorBanner
          message={loadError.message}
          onRetry={() => {
            void sonographers.refetch();
            void clinics.refetch();
            void appointments.refetch();
          }}
        />
      )}

      {isLoading && !loadError && <Spinner label="Loading schedule…" />}

      {!isLoading && !loadError && sonographers.data && clinics.data && appointments.data && (
        <>
          {appointments.data.length === 0 && (
            <p className="empty-state">
              No appointments for this day yet — click a time slot to create one.
            </p>
          )}
          <ScheduleGrid
            sonographers={sonographers.data}
            clinics={clinics.data}
            appointments={appointments.data}
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
          />
        </>
      )}

      {dialog && sonographers.data && clinics.data && appointments.data && (
        <AppointmentFormDialog
          mode={dialog.mode}
          date={date}
          initial={dialog.mode === 'edit' ? dialog.appointment : dialog.initial}
          sonographers={sonographers.data}
          clinics={clinics.data}
          appointments={appointments.data}
          onSubmit={handleSubmit}
          onDelete={dialog.mode === 'edit' ? handleDelete : undefined}
          onClose={() => setDialog(null)}
        />
      )}
    </main>
  );
}
