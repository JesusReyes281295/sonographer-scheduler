/**
 * US federal holiday calendar — pure date math, no dependencies.
 *
 * Clinics that observe holidays are closed on these dates, so the scheduler can
 * block bookings and recommend a clinic that is open instead. Floating holidays
 * (e.g. "3rd Monday of January") are computed; fixed-date holidays that fall on a
 * weekend use the federally observed weekday (Saturday → Friday, Sunday → Monday).
 */

export interface Holiday {
  /** Observed date, "yyyy-MM-dd". */
  date: string;
  name: string;
}

const pad2 = (n: number): string => String(n).padStart(2, '0');
const toYmd = (d: Date): string => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const ymd = (year: number, month: number, day: number): string => `${year}-${pad2(month)}-${pad2(day)}`;

/** Day (1–31) of the nth given weekday (0=Sun … 6=Sat) in a month. */
function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): number {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const offset = (weekday - firstDow + 7) % 7;
  return 1 + offset + (n - 1) * 7;
}

/** Day (1–31) of the last given weekday in a month. */
function lastWeekdayOfMonth(year: number, month: number, weekday: number): number {
  const lastDay = new Date(year, month, 0).getDate();
  const lastDow = new Date(year, month - 1, lastDay).getDay();
  return lastDay - ((lastDow - weekday + 7) % 7);
}

/** Federally observed date for a fixed-date holiday (weekend → nearest weekday). */
function observed(year: number, month: number, day: number): string {
  const d = new Date(year, month - 1, day);
  const dow = d.getDay();
  if (dow === 6) d.setDate(d.getDate() - 1); // Saturday → Friday
  else if (dow === 0) d.setDate(d.getDate() + 1); // Sunday → Monday
  return toYmd(d);
}

/** All US federal holidays (observed dates) for a given year. */
export function getUsFederalHolidays(year: number): Holiday[] {
  const floating = (month: number, weekday: number, n: number, name: string): Holiday => ({
    date: ymd(year, month, nthWeekdayOfMonth(year, month, weekday, n)),
    name,
  });
  const lastMonday = (month: number, name: string): Holiday => ({
    date: ymd(year, month, lastWeekdayOfMonth(year, month, 1)),
    name,
  });
  const fixed = (month: number, day: number, name: string): Holiday => ({
    date: observed(year, month, day),
    name,
  });

  return [
    fixed(1, 1, "New Year's Day"),
    floating(1, 1, 3, 'Martin Luther King Jr. Day'),
    floating(2, 1, 3, "Presidents' Day"),
    lastMonday(5, 'Memorial Day'),
    fixed(6, 19, 'Juneteenth'),
    fixed(7, 4, 'Independence Day'),
    floating(9, 1, 1, 'Labor Day'),
    floating(10, 1, 2, 'Columbus Day'),
    fixed(11, 11, 'Veterans Day'),
    floating(11, 4, 4, 'Thanksgiving Day'),
    fixed(12, 25, 'Christmas Day'),
  ];
}

/**
 * Returns the holiday name if the given date ("yyyy-MM-dd") is a US federal
 * holiday, otherwise null. Also checks the next year so a New Year's Day observed
 * on Dec 31 is caught.
 */
export function getUsHoliday(dateStr: string): string | null {
  const year = Number(dateStr.slice(0, 4));
  if (!Number.isFinite(year)) return null;
  const holidays = [...getUsFederalHolidays(year), ...getUsFederalHolidays(year + 1)];
  return holidays.find((h) => h.date === dateStr)?.name ?? null;
}
