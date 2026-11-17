import { describe, it, expect } from 'vitest';
import { ageFrom, measurementLabel, patientInitials, patientName, timeAgo } from './format';
import type { Patient } from '@/types/domain';

const patient: Patient = {
  patientId: 'p-1',
  ownerPractitionerId: 'u-doc-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  fields: { firstName: 'Grace', lastName: 'Adeyemi', dateOfBirth: '1990-06-15' },
};

describe('format helpers', () => {
  it('builds a display name and initials', () => {
    expect(patientName(patient)).toBe('Grace Adeyemi');
    expect(patientInitials(patient)).toBe('GA');
  });

  it('falls back to the id when name fields are empty', () => {
    expect(patientName({ ...patient, fields: {} })).toBe('p-1');
  });

  it('computes a plausible age', () => {
    const age = Number(ageFrom('1990-06-15'));
    expect(age).toBeGreaterThanOrEqual(35);
    expect(age).toBeLessThan(40);
    expect(ageFrom('')).toBe('');
    expect(ageFrom('not-a-date')).toBe('');
  });

  it('labels known measurement types and passes through unknown ones', () => {
    expect(measurementLabel('bp_systolic')).toMatch(/systolic/i);
    expect(measurementLabel('mystery')).toBe('mystery');
  });

  it('formats recent times relatively', () => {
    expect(timeAgo(new Date().toISOString())).toBe('just now');
    expect(timeAgo(new Date(Date.now() - 5 * 60_000).toISOString())).toBe('5m ago');
  });
});
