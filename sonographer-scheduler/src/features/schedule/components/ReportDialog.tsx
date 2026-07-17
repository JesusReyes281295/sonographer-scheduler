import { useEffect, useMemo, useRef, useState } from 'react';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import type {
  Appointment,
  Clinic,
  ConsultationType,
  Patient,
  Sonographer,
} from '../../../core/domain/types';
import { Spinner } from '../../../shared/components/Spinner';
import { useWeekAppointments } from '../hooks/useScheduleData';
import { weekDays } from '../weekLayout';
import {
  appointmentMinutes,
  formatBookedTime,
  MAX_REPORT_DAYS,
  reportDays,
  type ReportGroupBy,
} from '../report';
import styles from './ReportDialog.module.css';

interface ReportDialogProps {
  /** The day the schedule is showing — the report starts out covering it. */
  initialDate: string;
  sonographers: Sonographer[];
  clinics: Clinic[];
  patients: Patient[];
  consultationTypes: ConsultationType[];
  onClose: () => void;
}

const atNoon = (day: string) => new Date(`${day}T12:00:00`);

/**
 * Build-your-own appointment report: pick a date range, narrow it to certain
 * sonographers or clinics, choose the grouping and columns — the preview
 * updates live and prints exactly as shown.
 */
export function ReportDialog({
  initialDate,
  sonographers,
  clinics,
  patients,
  consultationTypes,
  onClose,
}: ReportDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [from, setFrom] = useState(initialDate);
  const [to, setTo] = useState(initialDate);
  const [sonographerIds, setSonographerIds] = useState<string[]>([]);
  const [clinicIds, setClinicIds] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState<ReportGroupBy>('day');
  const [showPhone, setShowPhone] = useState(true);
  const [showStudy, setShowStudy] = useState(true);
  const [showNotes, setShowNotes] = useState(false);

  // Native <dialog> gives us focus trapping, Escape-to-close and a backdrop for free.
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const days = useMemo(() => reportDays(from, to), [from, to]);
  // One cached query per day — the same keys the day and week views already use.
  const data = useWeekAppointments(days, true);

  const appointments = useMemo(() => {
    const keep = (a: Appointment) =>
      (sonographerIds.length === 0 || sonographerIds.includes(a.sonographerId)) &&
      (clinicIds.length === 0 || clinicIds.includes(a.clinicId));
    return days
      .flatMap((day) => data.byDay[day] ?? [])
      .filter(keep)
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [days, data.byDay, sonographerIds, clinicIds]);

  const toggle = (ids: string[], id: string) =>
    ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];

  const setRange = (a: Date, b: Date) => {
    setFrom(format(a, 'yyyy-MM-dd'));
    setTo(format(b, 'yyyy-MM-dd'));
  };
  const today = new Date();
  const week = weekDays(format(today, 'yyyy-MM-dd'));

  const rangeLabel =
    from === to
      ? format(atNoon(from), 'EEEE, MMMM d, yyyy')
      : `${format(atNoon(from), 'MMM d, yyyy')} – ${format(atNoon(to), 'MMM d, yyyy')}`;

  const content = (
    <ReportContent
      rangeLabel={rangeLabel}
      days={days}
      appointments={appointments}
      groupBy={groupBy}
      showPhone={showPhone}
      showStudy={showStudy}
      showNotes={showNotes}
      sonographers={sonographers}
      clinics={clinics}
      patients={patients}
      consultationTypes={consultationTypes}
    />
  );

  return (
    <>
      <dialog ref={dialogRef} className={styles.dialog} onClose={onClose} aria-labelledby="report-title">
        <div className={styles.content}>
          <header className={styles.header}>
            <h2 id="report-title">Reports</h2>
            <p className={styles.hint}>
              Pick a range and filters, choose how to group the rows, then print it.
            </p>
          </header>

          <div className={styles.config}>
            <div className={styles.configRow}>
              <fieldset className={styles.fieldset}>
                <legend>Date range</legend>
                <div className={styles.dateInputs}>
                  <label className={styles.dateLabel}>
                    From
                    <input
                      type="date"
                      className={styles.dateInput}
                      value={from}
                      onChange={(e) => e.target.value && setFrom(e.target.value)}
                    />
                  </label>
                  <label className={styles.dateLabel}>
                    To
                    <input
                      type="date"
                      className={styles.dateInput}
                      value={to}
                      onChange={(e) => e.target.value && setTo(e.target.value)}
                    />
                  </label>
                  <div className={styles.presets}>
                    <button type="button" className={styles.preset} onClick={() => setRange(today, today)}>
                      Today
                    </button>
                    <button
                      type="button"
                      className={styles.preset}
                      onClick={() => setRange(atNoon(week[0]), atNoon(week[6]))}
                    >
                      This week
                    </button>
                    <button
                      type="button"
                      className={styles.preset}
                      onClick={() => setRange(startOfMonth(today), endOfMonth(today))}
                    >
                      This month
                    </button>
                  </div>
                </div>
                {to < from && <p className={styles.rangeHint}>The end date is before the start date.</p>}
                {days.length >= MAX_REPORT_DAYS && (
                  <p className={styles.rangeHint}>Reports cover up to {MAX_REPORT_DAYS} days at a time.</p>
                )}
              </fieldset>

              <fieldset className={styles.fieldset}>
                <legend>Group by</legend>
                <select
                  className={styles.select}
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as ReportGroupBy)}
                  aria-label="Group report rows by"
                >
                  <option value="day">Day</option>
                  <option value="sonographer">Sonographer</option>
                  <option value="clinic">Clinic</option>
                </select>
              </fieldset>

              <fieldset className={styles.fieldset}>
                <legend>Columns</legend>
                <div className={styles.checkboxes}>
                  <label className={styles.checkbox}>
                    <input type="checkbox" checked={showPhone} onChange={(e) => setShowPhone(e.target.checked)} />
                    Phone
                  </label>
                  <label className={styles.checkbox}>
                    <input type="checkbox" checked={showStudy} onChange={(e) => setShowStudy(e.target.checked)} />
                    Study
                  </label>
                  <label className={styles.checkbox}>
                    <input type="checkbox" checked={showNotes} onChange={(e) => setShowNotes(e.target.checked)} />
                    Notes
                  </label>
                </div>
              </fieldset>
            </div>

            <div className={styles.configRow}>
              <fieldset className={styles.fieldset}>
                <legend>Sonographers (all when none selected)</legend>
                <div className={styles.chips}>
                  {sonographers.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={sonographerIds.includes(s.id) ? styles.chipActive : styles.chip}
                      aria-pressed={sonographerIds.includes(s.id)}
                      onClick={() => setSonographerIds((ids) => toggle(ids, s.id))}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className={styles.fieldset}>
                <legend>Clinics (all when none selected)</legend>
                <div className={styles.chips}>
                  {clinics.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={clinicIds.includes(c.id) ? styles.chipActive : styles.chip}
                      aria-pressed={clinicIds.includes(c.id)}
                      onClick={() => setClinicIds((ids) => toggle(ids, c.id))}
                    >
                      <span className={styles.dot} style={{ backgroundColor: c.color }} aria-hidden="true" />
                      {c.name}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>

          <div className={styles.preview} aria-label="Report preview">
            <p className={styles.previewCaption}>Preview</p>
            {data.isPending ? <Spinner label="Loading report…" /> : content}
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onClose}>
              Close
            </button>
            <button
              type="button"
              className="button--primary"
              onClick={() => window.print()}
              disabled={data.isPending}
            >
              Print report
            </button>
          </div>
        </div>
      </dialog>

      {/* Print copy: hidden on screen; the global @media print rules show only this. */}
      {!data.isPending && (
        <div className="print-report" aria-hidden="true">
          {content}
        </div>
      )}
    </>
  );
}

interface ReportContentProps {
  rangeLabel: string;
  days: string[];
  appointments: Appointment[];
  groupBy: ReportGroupBy;
  showPhone: boolean;
  showStudy: boolean;
  showNotes: boolean;
  sonographers: Sonographer[];
  clinics: Clinic[];
  patients: Patient[];
  consultationTypes: ConsultationType[];
}

interface ReportGroup {
  key: string;
  title: string;
  subtitle?: string;
  items: Appointment[];
}

/** The report itself — rendered once as the live preview and once as the print copy. */
function ReportContent({
  rangeLabel,
  days,
  appointments,
  groupBy,
  showPhone,
  showStudy,
  showNotes,
  sonographers,
  clinics,
  patients,
  consultationTypes,
}: ReportContentProps) {
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

  let groups: ReportGroup[];
  if (groupBy === 'sonographer') {
    groups = [...sonographers].sort(byName).map((s) => ({
      key: s.id,
      title: s.name,
      subtitle: s.credentials,
      items: appointments.filter((a) => a.sonographerId === s.id),
    }));
  } else if (groupBy === 'clinic') {
    groups = [...clinics].sort(byName).map((c) => ({
      key: c.id,
      title: c.name,
      subtitle: `${c.openTime}–${c.closeTime}`,
      items: appointments.filter((a) => a.clinicId === c.id),
    }));
  } else {
    groups = days.map((day) => ({
      key: day,
      title: format(atNoon(day), 'EEEE, MMMM d, yyyy'),
      items: appointments.filter((a) => a.start.slice(0, 10) === day),
    }));
  }
  groups = groups.filter((g) => g.items.length > 0);

  const totalMinutes = appointments.reduce((sum, a) => sum + appointmentMinutes(a), 0);
  // Dates only matter in the Time column when the range spans days and rows of
  // different days share a table (i.e. any grouping other than by day).
  const showDate = groupBy !== 'day' && days.length > 1;

  const timeCell = (a: Appointment) => {
    const time = `${a.start.slice(11, 16)}–${a.end.slice(11, 16)}`;
    return showDate ? `${format(atNoon(a.start.slice(0, 10)), 'MMM d')} · ${time}` : time;
  };

  return (
    <div className={styles.report}>
      <h3 className={styles.reportTitle}>Appointment report</h3>
      <p className={styles.reportMeta}>{rangeLabel}</p>

      {appointments.length === 0 ? (
        <p className={styles.emptyReport}>No appointments match this report.</p>
      ) : (
        <>
          <dl className={styles.summary}>
            <div>
              <dt>Appointments</dt>
              <dd>{appointments.length}</dd>
            </div>
            <div>
              <dt>Booked time</dt>
              <dd>{formatBookedTime(totalMinutes)}</dd>
            </div>
            <div>
              <dt>Sonographers</dt>
              <dd>{new Set(appointments.map((a) => a.sonographerId)).size}</dd>
            </div>
            <div>
              <dt>Clinics</dt>
              <dd>{new Set(appointments.map((a) => a.clinicId)).size}</dd>
            </div>
          </dl>

          {groups.map((group) => (
            <section key={group.key}>
              <h4 className={styles.groupTitle}>
                {group.title}
                {group.subtitle && <span className={styles.groupSub}> · {group.subtitle}</span>}
                <span className={styles.groupSub}>
                  {' '}
                  · {group.items.length} appointment{group.items.length === 1 ? '' : 's'}
                </span>
              </h4>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Time</th>
                    <th scope="col">Patient</th>
                    {showPhone && <th scope="col">Phone</th>}
                    {showStudy && <th scope="col">Study</th>}
                    {groupBy !== 'sonographer' && <th scope="col">Sonographer</th>}
                    {groupBy !== 'clinic' && <th scope="col">Clinic</th>}
                    {showNotes && <th scope="col">Notes</th>}
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((a) => {
                    const patient = patients.find((p) => p.id === a.patientId);
                    const type = consultationTypes.find((t) => t.id === a.consultationTypeId);
                    return (
                      <tr key={a.id}>
                        <td className={styles.timeCol}>{timeCell(a)}</td>
                        <td>{patient?.name ?? 'Unknown patient'}</td>
                        {showPhone && <td>{patient?.phone ?? '—'}</td>}
                        {showStudy && <td>{type ? `${type.icon} ${type.name}` : '—'}</td>}
                        {groupBy !== 'sonographer' && (
                          <td>{sonographers.find((s) => s.id === a.sonographerId)?.name ?? '—'}</td>
                        )}
                        {groupBy !== 'clinic' && (
                          <td>{clinics.find((c) => c.id === a.clinicId)?.name ?? '—'}</td>
                        )}
                        {showNotes && <td>{a.notes ?? ''}</td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          ))}
        </>
      )}

      <p className={styles.footerNote}>
        Generated {format(new Date(), "MMM d, yyyy 'at' HH:mm")} · Printed from Sonographer Scheduler
      </p>
    </div>
  );
}
