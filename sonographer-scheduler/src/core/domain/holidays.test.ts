import { describe, expect, it } from 'vitest';
import { getUsFederalHolidays, getUsHoliday } from './holidays';

describe('US federal holidays', () => {
  it('computes floating holidays for 2026', () => {
    const byName = Object.fromEntries(getUsFederalHolidays(2026).map((h) => [h.name, h.date]));
    expect(byName['Martin Luther King Jr. Day']).toBe('2026-01-19'); // 3rd Monday of January
    expect(byName['Memorial Day']).toBe('2026-05-25'); // last Monday of May
    expect(byName['Labor Day']).toBe('2026-09-07'); // 1st Monday of September
    expect(byName['Thanksgiving Day']).toBe('2026-11-26'); // 4th Thursday of November
  });

  it('shifts a fixed holiday that lands on a weekend to the observed weekday', () => {
    // July 4, 2026 is a Saturday → federally observed on Friday, July 3.
    expect(getUsHoliday('2026-07-04')).toBeNull();
    expect(getUsHoliday('2026-07-03')).toBe('Independence Day');
  });

  it('recognizes fixed weekday holidays on their real date', () => {
    expect(getUsHoliday('2026-12-25')).toBe('Christmas Day'); // Friday
    expect(getUsHoliday('2026-01-01')).toBe("New Year's Day"); // Thursday
  });

  it('returns null for an ordinary working day', () => {
    expect(getUsHoliday('2026-07-16')).toBeNull();
  });
});
