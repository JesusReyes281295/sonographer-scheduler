import type { Clinic, Sonographer } from '../../../core/domain/types';
import { EMPTY_FILTERS, type Filters } from '../filters';
import styles from './ScheduleFilters.module.css';

interface ScheduleFiltersProps {
  sonographers: Sonographer[];
  clinics: Clinic[];
  value: Filters;
  onChange: (next: Filters) => void;
}

const toggle = (ids: string[], id: string) =>
  ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];

/**
 * Sonographer + clinic filters. An empty selection means "show everything", so the
 * default is no filtering. Applied to both the day and week views by the page.
 */
export function ScheduleFilters({ sonographers, clinics, value, onChange }: ScheduleFiltersProps) {
  const activeCount = value.sonographerIds.length + value.clinicIds.length;

  return (
    <details className={styles.filters} data-tour="filters">
      <summary className={styles.summary}>
        Filters
        {activeCount > 0 && <span className={styles.badge}>{activeCount}</span>}
      </summary>

      <div className={styles.panel}>
        <fieldset className={styles.group}>
          <legend>Sonographers</legend>
          <div className={styles.options}>
            {sonographers.map((s) => (
              <label key={s.id} className={styles.option}>
                <input
                  type="checkbox"
                  checked={value.sonographerIds.includes(s.id)}
                  onChange={() =>
                    onChange({ ...value, sonographerIds: toggle(value.sonographerIds, s.id) })
                  }
                />
                {s.name}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.group}>
          <legend>Clinics</legend>
          <div className={styles.options}>
            {clinics.map((c) => (
              <label key={c.id} className={styles.option}>
                <input
                  type="checkbox"
                  checked={value.clinicIds.includes(c.id)}
                  onChange={() => onChange({ ...value, clinicIds: toggle(value.clinicIds, c.id) })}
                />
                <span className={styles.dot} style={{ backgroundColor: c.color }} aria-hidden="true" />
                {c.name}
              </label>
            ))}
          </div>
        </fieldset>

        {activeCount > 0 && (
          <button type="button" className={styles.clear} onClick={() => onChange(EMPTY_FILTERS)}>
            Clear filters
          </button>
        )}
      </div>
    </details>
  );
}
