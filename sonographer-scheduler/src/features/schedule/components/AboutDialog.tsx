import { useEffect, useRef } from 'react';
import styles from './AboutDialog.module.css';

interface Feature {
  icon: string;
  title: string;
  body: string;
}

const CURRENT_FEATURES: Feature[] = [
  { icon: '📅', title: 'Day & week views', body: 'See one day in detail or the whole week at a glance, and jump between them instantly.' },
  { icon: '🖱️', title: 'Drag to reschedule', body: 'Move an appointment to another time, another sonographer, or another day — just drag it.' },
  { icon: '⛔', title: 'No double-bookings', body: 'The schedule refuses overlaps, out-of-hours slots and closed-clinic holidays as you book.' },
  { icon: '🎉', title: 'Holiday-aware', body: 'Clinics that close on US federal holidays are blocked automatically, with open alternatives suggested.' },
  { icon: '🏥', title: 'Manage your hospital', body: 'Add and edit clinics, sonographers, patients and study types — the schedule updates right away.' },
  { icon: '🔎', title: 'Filters', body: 'Focus the board on the sonographers or clinics you care about.' },
  { icon: '💾', title: 'Works offline', body: 'Everything is saved on the device and survives a reload — no setup, no database.' },
  { icon: '🖨️', title: 'Printable appointments', body: 'Print a clean summary of any saved appointment in one click.' },
];

const FUTURE_FEATURES: Feature[] = [
  { icon: '📧', title: 'Reminders by email, WhatsApp & SMS', body: 'Send patients an automatic confirmation and a reminder before their appointment.' },
  { icon: '🗓️', title: 'Any appointment type', body: 'Go beyond ultrasound — schedule consultations, lab work and other hospital services on the same board.' },
  { icon: '🎨', title: 'Your hospital, your brand', body: 'Add your logo and colours so the schedule and printouts look like your own.' },
  { icon: '📊', title: 'Weekly reports', body: 'Automatic weekly and monthly reports on volume, utilisation and no-shows.' },
  { icon: '📱', title: 'Patient self-scheduling', body: 'Let patients pick an open slot online, with the same rules protecting your calendar.' },
  { icon: '🔔', title: 'Live notifications & waitlists', body: 'Fill cancellations instantly by pulling the next patient from a smart waitlist.' },
  { icon: '📈', title: 'Analytics dashboard', body: 'Spot busy hours, idle rooms and bottlenecks to plan staffing with confidence.' },
  { icon: '🔗', title: 'EMR integration', body: 'Sync patients and results with your hospital information system.' },
  { icon: '🌐', title: 'Multi-language', body: 'Run the whole experience in your team’s language.' },
];

/** Marketing-style "about" page: what the app does today and what's coming next. */
export function AboutDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog ref={dialogRef} className={styles.dialog} onClose={onClose} aria-labelledby="about-title">
      <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
        ×
      </button>

      <header className={styles.hero}>
        <p className={styles.eyebrow}>Sonographer Scheduler</p>
        <h1 id="about-title" className={styles.title}>
          Plan every ultrasound, without the double-bookings.
        </h1>
        <p className={styles.lede}>
          A fast, friendly board for booking sonographer appointments across clinics — built to keep
          your day organised and your calendar conflict-free.
        </p>
      </header>

      <section className={styles.section} aria-labelledby="about-today">
        <h2 id="about-today" className={styles.sectionTitle}>What it does today</h2>
        <div className={styles.grid}>
          {CURRENT_FEATURES.map((f) => (
            <article key={f.title} className={styles.card}>
              <span className={styles.icon} aria-hidden="true">{f.icon}</span>
              <h3 className={styles.cardTitle}>{f.title}</h3>
              <p className={styles.cardBody}>{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.future}`} aria-labelledby="about-next">
        <h2 id="about-next" className={styles.sectionTitle}>
          Coming soon <span className={styles.badge}>Roadmap</span>
        </h2>
        <p className={styles.sectionLede}>Where Sonographer Scheduler is headed next:</p>
        <div className={styles.grid}>
          {FUTURE_FEATURES.map((f) => (
            <article key={f.title} className={`${styles.card} ${styles.futureCard}`}>
              <span className={styles.icon} aria-hidden="true">{f.icon}</span>
              <h3 className={styles.cardTitle}>{f.title}</h3>
              <p className={styles.cardBody}>{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <button type="button" className="button--primary" onClick={onClose}>
          Start scheduling
        </button>
      </footer>
    </dialog>
  );
}
