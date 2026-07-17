import { format } from 'date-fns';
import type {
  Appointment,
  Clinic,
  ConsultationType,
  Patient,
  Sonographer,
} from '../../../core/domain/types';

interface PrintableAppointmentProps {
  appointment: Appointment;
  patients: Patient[];
  sonographers: Sonographer[];
  clinics: Clinic[];
  consultationTypes: ConsultationType[];
}

/**
 * A print-only summary of one saved appointment. Hidden on screen; the global
 * `@media print` rules hide the app and show just this when the user prints.
 */
export function PrintableAppointment({
  appointment,
  patients,
  sonographers,
  clinics,
  consultationTypes,
}: PrintableAppointmentProps) {
  const patient = patients.find((p) => p.id === appointment.patientId);
  const sonographer = sonographers.find((s) => s.id === appointment.sonographerId);
  const clinic = clinics.find((c) => c.id === appointment.clinicId);
  const type = consultationTypes.find((t) => t.id === appointment.consultationTypeId);
  const day = format(new Date(`${appointment.start.slice(0, 10)}T12:00:00`), 'EEEE, MMMM d, yyyy');
  const time = `${appointment.start.slice(11, 16)} – ${appointment.end.slice(11, 16)}`;

  return (
    <div className="print-appointment" aria-hidden="true">
      <h1>Appointment</h1>
      <dl>
        <div>
          <dt>Patient</dt>
          <dd>
            {patient?.name ?? 'Unknown patient'}
            {patient?.mrn ? ` · MRN ${patient.mrn}` : ''}
          </dd>
        </div>
        <div>
          <dt>Study</dt>
          <dd>{type?.name ?? '—'}</dd>
        </div>
        <div>
          <dt>Sonographer</dt>
          <dd>{sonographer?.name ?? '—'}</dd>
        </div>
        <div>
          <dt>Clinic</dt>
          <dd>
            {clinic?.name ?? '—'}
            {clinic ? ` (${clinic.openTime}–${clinic.closeTime})` : ''}
          </dd>
        </div>
        <div>
          <dt>Date</dt>
          <dd>{day}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{time}</dd>
        </div>
        {appointment.notes && (
          <div>
            <dt>Notes</dt>
            <dd>{appointment.notes}</dd>
          </div>
        )}
      </dl>
      <p className="print-appointment__footer">Printed from Sonographer Scheduler</p>
    </div>
  );
}
