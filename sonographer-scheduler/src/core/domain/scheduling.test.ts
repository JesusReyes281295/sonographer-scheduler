import { describe, expect, it } from 'vitest';
import { overlaps, validateAppointment } from './scheduling';
import type { Appointment, AppointmentDraft, Clinic } from './types';

const clinic: Clinic = {
  id: 'c1',
  name: 'Downtown Imaging',
  openTime: '08:00',
  closeTime: '17:00',
  color: '#2563eb',
};

const at = (time: string) => new Date(`2026-07-13T${time}:00`);

const booked: Appointment = {
  id: 'a1',
  sonographerId: 's1',
  clinicId: 'c1',
  patientName: 'Maria Lopez',
  start: '2026-07-13T09:00:00',
  end: '2026-07-13T10:00:00',
};

const draft = (overrides: Partial<AppointmentDraft> = {}): AppointmentDraft => ({
  sonographerId: 's1',
  clinicId: 'c1',
  patientName: 'Test Patient',
  start: '2026-07-13T10:00:00',
  end: '2026-07-13T11:00:00',
  ...overrides,
});

const codes = (errors: { code: string }[]) => errors.map((e) => e.code);

describe('overlaps', () => {
  it('detects partial overlap', () => {
    expect(overlaps(at('09:00'), at('10:00'), at('09:30'), at('10:30'))).toBe(true);
  });

  it('detects full containment', () => {
    expect(overlaps(at('09:00'), at('12:00'), at('10:00'), at('11:00'))).toBe(true);
  });

  it('detects identical ranges', () => {
    expect(overlaps(at('09:00'), at('10:00'), at('09:00'), at('10:00'))).toBe(true);
  });

  it('treats touching edges as free (back-to-back appointments allowed)', () => {
    expect(overlaps(at('09:00'), at('10:00'), at('10:00'), at('11:00'))).toBe(false);
    expect(overlaps(at('10:00'), at('11:00'), at('09:00'), at('10:00'))).toBe(false);
  });

  it('returns false for disjoint ranges', () => {
    expect(overlaps(at('08:00'), at('09:00'), at('14:00'), at('15:00'))).toBe(false);
  });
});

describe('validateAppointment', () => {
  it('accepts a valid appointment', () => {
    expect(validateAppointment(draft(), [booked], clinic)).toEqual([]);
  });

  it('rejects end before start', () => {
    const result = validateAppointment(
      draft({ start: '2026-07-13T11:00:00', end: '2026-07-13T10:00:00' }),
      [],
      clinic,
    );
    expect(codes(result)).toEqual(['INVALID_RANGE']);
  });

  it('rejects zero-length appointments', () => {
    const result = validateAppointment(
      draft({ start: '2026-07-13T10:00:00', end: '2026-07-13T10:00:00' }),
      [],
      clinic,
    );
    expect(codes(result)).toEqual(['INVALID_RANGE']);
  });

  it('rejects appointments starting before the clinic opens', () => {
    const result = validateAppointment(
      draft({ start: '2026-07-13T07:30:00', end: '2026-07-13T08:30:00' }),
      [],
      clinic,
    );
    expect(codes(result)).toContain('OUTSIDE_CLINIC_HOURS');
  });

  it('rejects appointments ending after the clinic closes', () => {
    const result = validateAppointment(
      draft({ start: '2026-07-13T16:30:00', end: '2026-07-13T17:30:00' }),
      [],
      clinic,
    );
    expect(codes(result)).toContain('OUTSIDE_CLINIC_HOURS');
  });

  it('accepts appointments exactly at the clinic boundaries', () => {
    const result = validateAppointment(
      draft({ sonographerId: 's2', start: '2026-07-13T08:00:00', end: '2026-07-13T17:00:00' }),
      [booked],
      clinic,
    );
    expect(result).toEqual([]);
  });

  it('rejects double-booking the same sonographer', () => {
    const result = validateAppointment(
      draft({ start: '2026-07-13T09:30:00', end: '2026-07-13T10:30:00' }),
      [booked],
      clinic,
    );
    expect(codes(result)).toEqual(['DOUBLE_BOOKED']);
  });

  it('allows the same time slot for a different sonographer', () => {
    const result = validateAppointment(
      draft({ sonographerId: 's2', start: '2026-07-13T09:30:00', end: '2026-07-13T10:30:00' }),
      [booked],
      clinic,
    );
    expect(result).toEqual([]);
  });

  it('ignores the appointment being edited, so it can be moved', () => {
    const result = validateAppointment(
      draft({ id: 'a1', start: '2026-07-13T09:15:00', end: '2026-07-13T10:15:00' }),
      [booked],
      clinic,
    );
    expect(result).toEqual([]);
  });

  it('reports hour and booking violations together', () => {
    const result = validateAppointment(
      draft({ start: '2026-07-13T07:30:00', end: '2026-07-13T09:30:00' }),
      [booked],
      clinic,
    );
    expect(codes(result)).toEqual(expect.arrayContaining(['OUTSIDE_CLINIC_HOURS', 'DOUBLE_BOOKED']));
  });
});
