import { type CSSProperties, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import styles from './TutorialTour.module.css';

export interface TourStep {
  /** CSS selector for the element to spotlight. Omit to center the card (intro/outro). */
  target?: string;
  title: string;
  body: string;
}

interface TutorialTourProps {
  steps: TourStep[];
  onClose: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const CARD_WIDTH = 320;
const GAP = 12;

/**
 * Lightweight guided tour: dims the app, spotlights one element at a time and
 * explains it in a card. Back/Next/Finish, arrow keys, and Escape to exit. It
 * never changes app state, so leaving the tour leaves everything as it was.
 */
export function TutorialTour({ steps, onClose }: TutorialTourProps) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const cardRef = useRef<HTMLDialogElement>(null);

  const step = steps[index];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  const measure = useCallback(() => {
    const el = step?.target ? document.querySelector(step.target) : null;
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  // Bring the target into view, then measure it (re-measure on scroll/resize).
  useLayoutEffect(() => {
    if (step?.target) {
      document.querySelector(step.target)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    measure();
  }, [measure, step]);

  useEffect(() => {
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [measure]);

  // Keyboard: Escape exits, arrows move between steps.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'ArrowRight') {
        setIndex((i) => Math.min(steps.length - 1, i + 1));
      } else if (event.key === 'ArrowLeft') {
        setIndex((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, steps.length]);

  // Move focus to the card on each step so keyboard users follow along.
  useEffect(() => {
    cardRef.current?.focus();
  }, [index]);

  const next = () => (isLast ? onClose() : setIndex((i) => i + 1));
  const back = () => setIndex((i) => Math.max(0, i - 1));

  let cardStyle: CSSProperties;
  if (rect) {
    const below = rect.top + rect.height + GAP;
    const fitsBelow = window.innerHeight - below > 200;
    const top = fitsBelow ? below : Math.max(GAP, rect.top - GAP - 200);
    const left = Math.min(Math.max(GAP, rect.left), window.innerWidth - CARD_WIDTH - GAP);
    cardStyle = { top, left };
  } else {
    cardStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }

  return (
    <div className={`${styles.overlay}${rect ? '' : ` ${styles.dim}`}`}>
      {rect && (
        <div
          className={styles.spotlight}
          style={{ top: rect.top - 4, left: rect.left - 4, width: rect.width + 8, height: rect.height + 8 }}
          aria-hidden="true"
        />
      )}

      <dialog
        ref={cardRef}
        open
        className={styles.card}
        style={cardStyle}
        aria-modal="true"
        aria-labelledby="tour-title"
        tabIndex={-1}
      >
        <p className={styles.counter}>
          Step {index + 1} of {steps.length}
        </p>
        <h2 id="tour-title" className={styles.title}>
          {step.title}
        </h2>
        <p className={styles.body}>{step.body}</p>

        <div className={styles.actions}>
          <button type="button" onClick={onClose}>
            Finish
          </button>
          <span className={styles.spacer} />
          {!isFirst && (
            <button type="button" onClick={back}>
              Back
            </button>
          )}
          <button type="button" className="button--primary" onClick={next}>
            {isLast ? 'Done' : 'Next'}
          </button>
        </div>
      </dialog>
    </div>
  );
}
