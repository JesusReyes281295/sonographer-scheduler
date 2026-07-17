import { describe, expect, it } from 'vitest';
import type { Appointment } from '../../core/domain/types';
import { layoutDayAppointments, weekDays } from './weekLayout';

const appt = (id: string, start: string, end: string): Appointment => ({
  id,
  sonographerId: 's1',
  clinicId: 'c1',
  patientId: 'p1',
  consultationTypeId: 'ct1',
  start: `2026-07-13T${start}:00`,
  end: `2026-07-13T${end}:00`,
});

const shape = (list: ReturnType<typeof layoutDayAppointments>) =>
  list.map((l) => ({ id: l.appointment.id, lane: l.lane, lanes: l.lanes }));

describe('weekDays', () => {
  it('returns the seven consecutive days of the Monday-based week containing the date', () => {
    const days = weekDays('2026-07-17');
    expect(days).toHaveLength(7);
    expect(days).toContain('2026-07-17');
    expect(new Date(`${days[0]}T12:00:00`).getDay()).toBe(1); // starts on a Monday
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(`${days[i - 1]}T12:00:00`).getTime();
      const cur = new Date(`${days[i]}T12:00:00`).getTime();
      expect((cur - prev) / 86_400_000).toBe(1);
    }
  });

  it('returns the same week for any day within it', () => {
    const days = weekDays('2026-07-17');
    expect(weekDays(days[0])).toEqual(days);
    expect(weekDays(days[6])).toEqual(days);
  });
});

describe('layoutDayAppointments', () => {
  it('keeps back-to-back appointments in a single lane', () => {
    // a ends exactly when b starts — touching edges don't overlap.
    const laid = layoutDayAppointments([appt('a', '09:00', '10:00'), appt('b', '10:00', '11:00')]);
    expect(shape(laid)).toEqual([
      { id: 'a', lane: 0, lanes: 1 },
      { id: 'b', lane: 0, lanes: 1 },
    ]);
  });

  it('splits two overlapping appointments into two lanes', () => {
    const laid = layoutDayAppointments([appt('a', '09:00', '10:00'), appt('b', '09:30', '10:30')]);
    const byId = Object.fromEntries(laid.map((l) => [l.appointment.id, l]));
    expect(byId.a.lanes).toBe(2);
    expect(byId.b.lanes).toBe(2);
    expect(new Set([byId.a.lane, byId.b.lane])).toEqual(new Set([0, 1]));
  });

  it('reuses a freed lane within the same overlap cluster', () => {
    // a+b overlap (2 lanes); c starts when a ends, so it reuses a's lane 0.
    const laid = layoutDayAppointments([
      appt('a', '09:00', '10:00'),
      appt('b', '09:30', '10:30'),
      appt('c', '10:00', '11:00'),
    ]);
    expect(shape(laid)).toEqual([
      { id: 'a', lane: 0, lanes: 2 },
      { id: 'b', lane: 1, lanes: 2 },
      { id: 'c', lane: 0, lanes: 2 },
    ]);
  });

  it('sorts by start time and returns every appointment', () => {
    const laid = layoutDayAppointments([appt('late', '14:00', '15:00'), appt('early', '08:00', '09:00')]);
    expect(laid.map((l) => l.appointment.id)).toEqual(['early', 'late']);
  });

  it('handles an empty day', () => {
    expect(layoutDayAppointments([])).toEqual([]);
  });
});
