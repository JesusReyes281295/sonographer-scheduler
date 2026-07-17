import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Clinic, ConsultationType, Patient, Sonographer } from '../../../core/domain/types';
import {
  useClinicMutations,
  useClinics,
  useConsultationTypeMutations,
  useConsultationTypes,
  usePatientMutations,
  usePatients,
  useSonographerMutations,
  useSonographers,
} from '../hooks/useScheduleData';
import { EntityManager } from './EntityManager';
import styles from './ManagementDialog.module.css';

const CLINIC_ICONS = ['🏥', '🩺', '🔬', '🌸', '⛑️', '🚑', '🏨', '🧪'];
const STUDY_ICONS = ['🤰', '🩺', '🩸', '🦋', '🦴', '🫀', '🫘', '🎗️', '🧠', '👁️', '🫁', '🦷'];
const COLORS = [
  '#2563eb',
  '#059669',
  '#d97706',
  '#db2777',
  '#7c3aed',
  '#0891b2',
  '#dc2626',
  '#65a30d',
  '#ea580c',
  '#0d9488',
];

type TabId = 'clinics' | 'sonographers' | 'patients' | 'types';

const TABS: { id: TabId; label: string }[] = [
  { id: 'clinics', label: 'Clinics' },
  { id: 'sonographers', label: 'Sonographers' },
  { id: 'patients', label: 'Patients' },
  { id: 'types', label: 'Study types' },
];

/** A labelled form control. Nesting the input keeps the two associated. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

function Picker({
  legend,
  options,
  value,
  onChange,
  swatch = false,
}: {
  legend: string;
  options: string[];
  value: string | undefined;
  onChange: (next: string) => void;
  swatch?: boolean;
}) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.fieldLabel}>{legend}</legend>
      <div className={styles.chips}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-label={option}
            aria-pressed={value === option}
            className={value === option ? styles.chipActive : styles.chip}
            style={swatch ? { backgroundColor: option, color: 'transparent', width: 28 } : undefined}
            onClick={() => onChange(option)}
          >
            {swatch ? '•' : option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function ManagementDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<TabId>('clinics');

  const clinics = useClinics();
  const sonographers = useSonographers();
  const patients = usePatients();
  const types = useConsultationTypes();

  const clinicMutations = useClinicMutations();
  const sonographerMutations = useSonographerMutations();
  const patientMutations = usePatientMutations();
  const typeMutations = useConsultationTypeMutations();

  // Native <dialog> gives us focus trapping, Escape-to-close and a backdrop for free.
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClose={onClose}
      aria-labelledby="management-title"
    >
      <div className={styles.content}>
        <header className={styles.header}>
          <h2 id="management-title">Manage your hospital</h2>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </header>
        <p className={styles.hint}>
          Set the scheduler up for your own hospital. Changes apply right away and are saved on this
          device. Anything still used by an appointment can&apos;t be deleted.
        </p>

        <div className={styles.tabs}>
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              aria-pressed={tab === entry.id}
              className={tab === entry.id ? styles.tabActive : styles.tab}
              onClick={() => setTab(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>

        {tab === 'clinics' && clinics.data && (
          <EntityManager<Clinic>
            label="clinic"
            items={clinics.data}
            emptyDraft={() => ({
              name: '',
              openTime: '09:00',
              closeTime: '17:00',
              color: COLORS[0],
              icon: CLINIC_ICONS[0],
              observesHolidays: false,
            })}
            summary={(clinic) =>
              `${clinic.openTime}–${clinic.closeTime}${
                clinic.observesHolidays ? ' · closed on US holidays' : ' · open on holidays'
              }`
            }
            renderFields={(draft, update) => (
              <>
                <Field label="Name">
                  <input
                    value={draft.name}
                    onChange={(e) => update({ name: e.target.value })}
                    required
                    maxLength={60}
                  />
                </Field>
                <div className={styles.row2}>
                  <Field label="Opens">
                    <input
                      type="time"
                      value={draft.openTime}
                      onChange={(e) => update({ openTime: e.target.value })}
                      required
                    />
                  </Field>
                  <Field label="Closes">
                    <input
                      type="time"
                      value={draft.closeTime}
                      onChange={(e) => update({ closeTime: e.target.value })}
                      required
                    />
                  </Field>
                </div>
                <Picker
                  legend="Icon"
                  options={CLINIC_ICONS}
                  value={draft.icon}
                  onChange={(icon) => update({ icon })}
                />
                <Picker
                  legend="Color"
                  options={COLORS}
                  value={draft.color}
                  onChange={(color) => update({ color })}
                  swatch
                />
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={draft.observesHolidays ?? false}
                    onChange={(e) => update({ observesHolidays: e.target.checked })}
                  />
                  <span>Closed on US federal holidays</span>
                </label>
              </>
            )}
            onCreate={(draft) => clinicMutations.create.mutateAsync(draft)}
            onUpdate={(clinic) => clinicMutations.update.mutateAsync(clinic)}
            onDelete={(id) => clinicMutations.remove.mutateAsync(id)}
          />
        )}

        {tab === 'sonographers' && sonographers.data && (
          <EntityManager<Sonographer>
            label="sonographer"
            items={sonographers.data}
            emptyDraft={() => ({ name: '', credentials: '' })}
            summary={(sonographer) => sonographer.credentials ?? 'Appears as a column in the schedule'}
            renderFields={(draft, update) => (
              <>
                <Field label="Name">
                  <input
                    value={draft.name}
                    onChange={(e) => update({ name: e.target.value })}
                    required
                    maxLength={60}
                  />
                </Field>
                <Field label="Credentials (optional, e.g. RDMS, RVT)">
                  <input
                    value={draft.credentials ?? ''}
                    onChange={(e) => update({ credentials: e.target.value })}
                    maxLength={40}
                  />
                </Field>
              </>
            )}
            onCreate={(draft) => sonographerMutations.create.mutateAsync(draft)}
            onUpdate={(sonographer) => sonographerMutations.update.mutateAsync(sonographer)}
            onDelete={(id) => sonographerMutations.remove.mutateAsync(id)}
          />
        )}

        {tab === 'patients' && patients.data && (
          <EntityManager<Patient>
            label="patient"
            items={patients.data}
            emptyDraft={() => ({ name: '', mrn: '', phone: '' })}
            summary={(patient) =>
              [patient.mrn ?? 'No MRN', patient.phone ?? 'no phone on file'].join(' · ')
            }
            renderFields={(draft, update) => (
              <>
                <Field label="Name">
                  <input
                    value={draft.name}
                    onChange={(e) => update({ name: e.target.value })}
                    required
                    maxLength={80}
                  />
                </Field>
                <Field label="Medical record number (optional)">
                  <input
                    value={draft.mrn ?? ''}
                    onChange={(e) => update({ mrn: e.target.value })}
                    maxLength={30}
                  />
                </Field>
                <Field label="Phone (for appointment reminders)">
                  <input
                    type="tel"
                    value={draft.phone ?? ''}
                    onChange={(e) => update({ phone: e.target.value })}
                    maxLength={25}
                    placeholder="(555) 123-4567"
                  />
                </Field>
              </>
            )}
            onCreate={(draft) => patientMutations.create.mutateAsync(draft)}
            onUpdate={(patient) => patientMutations.update.mutateAsync(patient)}
            onDelete={(id) => patientMutations.remove.mutateAsync(id)}
          />
        )}

        {tab === 'types' && types.data && (
          <EntityManager<ConsultationType>
            label="study type"
            items={types.data}
            emptyDraft={() => ({ name: '', icon: STUDY_ICONS[0] })}
            summary={(type) => `Shown as ${type.icon} on the schedule`}
            renderFields={(draft, update) => (
              <>
                <Field label="Name">
                  <input
                    value={draft.name}
                    onChange={(e) => update({ name: e.target.value })}
                    required
                    maxLength={60}
                  />
                </Field>
                <Picker
                  legend="Icon"
                  options={STUDY_ICONS}
                  value={draft.icon}
                  onChange={(icon) => update({ icon })}
                />
              </>
            )}
            onCreate={(draft) => typeMutations.create.mutateAsync(draft)}
            onUpdate={(type) => typeMutations.update.mutateAsync(type)}
            onDelete={(id) => typeMutations.remove.mutateAsync(id)}
          />
        )}
      </div>
    </dialog>
  );
}
