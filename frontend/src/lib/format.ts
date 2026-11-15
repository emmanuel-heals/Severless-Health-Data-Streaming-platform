import type { Patient } from '@/types/domain';
import { measurementTypeByKey } from '@/config/fieldSchemas';

/** Generate a client-side idempotency key (FR-038). crypto.randomUUID with a safe fallback. */
export function newIdempotencyKey(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function patientName(p: Patient): string {
  const first = (p.fields.firstName as string) ?? '';
  const last = (p.fields.lastName as string) ?? '';
  const full = `${first} ${last}`.trim();
  return full || p.patientId;
}

export function patientInitials(p: Patient): string {
  const first = ((p.fields.firstName as string) ?? '').charAt(0);
  const last = ((p.fields.lastName as string) ?? '').charAt(0);
  return (first + last).toUpperCase() || '?';
}

export function measurementLabel(type: string): string {
  return measurementTypeByKey[type]?.label ?? type;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Age in whole years from an ISO date (YYYY-MM-DD or full ISO). Empty string if unknown. */
export function ageFrom(dob: unknown): string {
  if (typeof dob !== 'string' || !dob) return '';
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const mo = now.getMonth() - d.getMonth();
  if (mo < 0 || (mo === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 && age < 150 ? `${age}` : '';
}
