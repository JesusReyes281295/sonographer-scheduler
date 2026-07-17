import { useState } from 'react';
import { addDays, format } from 'date-fns';
import type { Appointment, AppointmentDraft } from '../../../core/domain/types';
import { buildLocalIso } from '../../../core/domain/time';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
import { Spinner } from '../../../shared/components/Spinner';
import { useAppointmentMutations } from '../hooks/useAppointmentMutations';
import {
  useAppointments,
  useClinics,
  useConsultationTypes,
  useCreatePatient,
  usePatients,
  useSonographers,
} from '../hooks/useScheduleData';
import { AppointmentFormDialog } from './AppointmentFormDialog';
import type { AppointmentFormValues } from './AppointmentFormDialog';
import { ManagementDialog } from './ManagementDialog';
import { ScheduleGrid } from './ScheduleGrid';

type DialogState =
  | { mode: 'create'; initial: Partial<AppointmentFormValues> }
  | { mode: 'edit'; appointment: Appointment }
  | null;

const toDateParam = (date: Date) => format(date, 'yyyy-MM-dd');
/** Noon avoids any DST edge cases when shifting whole days. */
const atNoon = (date: string) => new Date(`${date}T12:00:00`);

export function SchedulePage() {
  const [date, setDate] = useState(() => toDateParam(new Date()));
  const [dialog, setDialog] = useState<DialogState>(null);
  const [managing, setManaging] = useState(false);

  const sonographers = useSonographers();
  const clinics = useClinics();
  const patients = usePatients();
  const consultationTypes = useConsultationTypes();
  const appointments = useAppointments(date);
  const mutations = useAppointmentMutations(date);
  const createPatient = useCreatePatient();

  const isLoading =
    sonographers.isPending ||
    clinics.isPending ||
    patients.isPending ||
    consultationTypes.isPending ||
    appointments.isPending;
  const loadError =
    sonographers.error ??
    clinics.error ??
    patients.error ??
    consultationTypes.error ??
    appointments.error;

  const changeDay = (offset: number) => setDate((d) => toDateParam(addDays(atNoon(d), offset)));

  /** Reuse an existing patient by name, or register a new one on the fly. */
  const resolvePatientId = async (name: string): Promise<string> => {
    const trimmed = name.trim();
    const existing = patients.data?.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing.id;
    const created = await createPatient.mutateAsync(trimmed);
    return created.id;
  };

  const handleSubmit = async (values: AppointmentFormValues) => {
    const patientId = await resolvePatientId(values.patientName);
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

  const formInitial: Partial<AppointmentFormValues> =
    dialog?.mode === 'edit'
      ? {
          id: dialog.appointment.id,
          patientName: patients.data?.find((p) => p.id === dialog.appointment.patientId)?.name ?? '',
          sonographerId: dialog.appointment.sonographerId,
          clinicId: dialog.appointment.clinicId,
          consultationTypeId: dialog.appointment.consultationTypeId,
          start: dialog.appointment.start,
          end: dialog.appointment.end,
          notes: dialog.appointment.notes,
        }
      : (dialog?.initial ?? {});

  const isReady =
    sonographers.data && clinics.data && patients.data && consultationTypes.data && appointments.data;

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
        <button type="button" onClick={() => setManaging(true)}>
          Manage
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
              {clinic.icon && <span aria-hidden="true">{clinic.icon} </span>}
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
            void patients.refetch();
            void consultationTypes.refetch();
            void appointments.refetch();
          }}
        />
      )}

      {isLoading && !loadError && <Spinner label="Loading schedule…" />}

      {!isLoading && !loadError && isReady && (
        <>
          {appointments.data.length === 0 && (
            <p className="empty-state">
              No appointments for this day yet — click a time slot to create one.
            </p>
          )}
          <ScheduleGrid
            sonographers={sonographers.data}
            clinics={clinics.data}
            patients={patients.data}
            consultationTypes={consultationTypes.data}
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

      {managing && <ManagementDialog onClose={() => setManaging(false)} />}

      {dialog && isReady && (
        <AppointmentFormDialog
          mode={dialog.mode}
          date={date}
          initial={formInitial}
          sonographers={sonographers.data}
          clinics={clinics.data}
          patients={patients.data}
          consultationTypes={consultationTypes.data}
          appointments={appointments.data}
          onSubmit={handleSubmit}
          onDelete={dialog.mode === 'edit' ? handleDelete : undefined}
          onClose={() => setDialog(null)}
        />
      )}
    </main>
  );
}
