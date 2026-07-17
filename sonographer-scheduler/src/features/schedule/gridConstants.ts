// Vertical time-axis geometry shared by the day and week grids.

export const DAY_START_HOUR = 7;
export const DAY_END_HOUR = 19;
export const PX_PER_MINUTE = 1;
export const SLOT_MINUTES = 30;
/** Enough for the patient name alone. */
export const MIN_CARD_HEIGHT = 24;

export const DAY_START_MINUTES = DAY_START_HOUR * 60;
export const DAY_HEIGHT = (DAY_END_HOUR - DAY_START_HOUR) * 60 * PX_PER_MINUTE;

export const HOURS = Array.from(
  { length: DAY_END_HOUR - DAY_START_HOUR },
  (_, i) => DAY_START_HOUR + i,
);
export const SLOTS = Array.from(
  { length: ((DAY_END_HOUR - DAY_START_HOUR) * 60) / SLOT_MINUTES },
  (_, i) => DAY_START_MINUTES + i * SLOT_MINUTES,
);
