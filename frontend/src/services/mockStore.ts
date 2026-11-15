/*
 * Shared in-memory data store for frontend-only (mock) mode. Patients, submissions and
 * processed records live together here so the Register -> Submit -> Records demo flow is
 * internally consistent without a backend.
 *
 * IMPORTANT: ownership isolation is simulated here purely so the UI can be exercised. In the
 * real system the backend derives ownership from the Cognito token and is the only authority
 * (FR-024, FR-025, FR-028, BR-07); the client never sends or trusts ownerPractitionerId.
 */
import type { HealthRecord, Measurement, Patient, Submission } from '@/types/domain';

interface Store {
  patients: Patient[];
  submissions: Submission[];
  records: HealthRecord[];
  /** idempotency key -> submissionId, so a retried submit returns the same submission (FR-038). */
  idempotency: Map<string, string>;
}

function iso(daysAgo: number, hour = 9): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function dob(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

// Patients owned by the demo practitioner (u-doc-1) plus one owned by u-doc-2 to prove isolation.
const seededPatients: Patient[] = [
  {
    patientId: 'p-1001',
    ownerPractitionerId: 'u-doc-1',
    createdAt: iso(60),
    fields: { firstName: 'Grace', lastName: 'Adeyemi', dateOfBirth: dob(1984, 3, 12), sex: 'female', phone: '+234 802 111 2233', nationalId: 'NG-4471190' },
  },
  {
    patientId: 'p-1002',
    ownerPractitionerId: 'u-doc-1',
    createdAt: iso(45),
    fields: { firstName: 'Daniel', lastName: 'Okonkwo', dateOfBirth: dob(1991, 7, 2), sex: 'male', phone: '+234 803 555 7788', nationalId: 'NG-8820145' },
  },
  {
    patientId: 'p-1003',
    ownerPractitionerId: 'u-doc-1',
    createdAt: iso(14),
    fields: { firstName: 'Fatima', lastName: 'Bello', dateOfBirth: dob(1976, 11, 25), sex: 'female', phone: '', nationalId: '' },
  },
  {
    patientId: 'p-2001',
    ownerPractitionerId: 'u-doc-2',
    createdAt: iso(20),
    fields: { firstName: 'Samuel', lastName: 'Eze', dateOfBirth: dob(1988, 1, 9), sex: 'male' },
  },
];

function m(type: string, value: number, unit?: string): Measurement {
  return { type, value, unit };
}

const seededRecords: HealthRecord[] = [
  {
    recordId: 'r-5001',
    submissionId: 's-9001',
    patientId: 'p-1001',
    practitionerId: 'u-doc-1',
    categoryId: null,
    processedAt: iso(30, 10),
    measurements: [m('bp_systolic', 128, 'mmHg'), m('bp_diastolic', 82, 'mmHg'), m('heart_rate', 74, 'bpm')],
  },
  {
    recordId: 'r-5002',
    submissionId: 's-9002',
    patientId: 'p-1001',
    practitionerId: 'u-doc-1',
    categoryId: null,
    processedAt: iso(10, 11),
    measurements: [m('bp_systolic', 134, 'mmHg'), m('bp_diastolic', 86, 'mmHg'), m('temperature', 36.8, '°C')],
  },
  {
    recordId: 'r-5003',
    submissionId: 's-9003',
    patientId: 'p-1002',
    practitionerId: 'u-doc-1',
    categoryId: null,
    processedAt: iso(5, 14),
    measurements: [m('blood_glucose', 5.6, 'mmol/L'), m('weight', 81.2, 'kg')],
  },
];

const seededSubmissions: Submission[] = [
  { submissionId: 's-9001', patientId: 'p-1001', status: 'processed', createdAt: iso(30, 10) },
  { submissionId: 's-9002', patientId: 'p-1001', status: 'processed', createdAt: iso(10, 11) },
  { submissionId: 's-9003', patientId: 'p-1002', status: 'processed', createdAt: iso(5, 14) },
];

export const store: Store = {
  patients: seededPatients,
  submissions: seededSubmissions,
  records: seededRecords,
  idempotency: new Map(),
};

export function nextId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
