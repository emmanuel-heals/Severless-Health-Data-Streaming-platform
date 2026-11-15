/*
 * Patient data access (practitioner). Mirrors the SRS REST contract (§4.3):
 *   GET  /patients                 — own patients only (server scopes by token)
 *   POST /patients                 — register; owner set server-side from token (FR-024)
 *   GET  /patients/{id}            — own patient (non-owned -> 404, audit-logged FR-028)
 *   GET  /patients/{id}/history    — chronological submissions + processed records
 *
 * The UI imports only `patientsService`. `ctx.practitionerId` is passed so the MOCK can emulate
 * server-side ownership scoping; the real HTTP implementation ignores it and never sends an
 * owner — the backend derives ownership from the JWT and is the sole authority (FR-024/025/028).
 */
import type { HealthRecord, Patient, Submission } from '@/types/domain';
import { env } from '@/config/env';
import { apiClient } from './apiClient';
import type { ApiError } from './apiClient';
import { nextId, store } from './mockStore';

export interface PatientCtx {
  /** The signed-in practitioner's id — mock-only ownership emulation; never sent to the API. */
  practitionerId: string;
}

export interface CreatePatientInput {
  fields: Record<string, unknown>;
}

export interface PatientHistory {
  patient: Patient;
  submissions: Submission[];
  records: HealthRecord[];
}

export interface PatientsService {
  list(ctx: PatientCtx): Promise<Patient[]>;
  get(patientId: string, ctx: PatientCtx): Promise<Patient | null>;
  create(input: CreatePatientInput, ctx: PatientCtx): Promise<Patient>;
  history(patientId: string, ctx: PatientCtx): Promise<PatientHistory | null>;
}

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/* -------------------------------------------------------------------------- */
/* Mock implementation                                                        */
/* -------------------------------------------------------------------------- */

class MockPatientsService implements PatientsService {
  async list(ctx: PatientCtx): Promise<Patient[]> {
    // Server-side scoping emulated: only the caller's own patients (FR-025).
    const own = store.patients.filter((p) => p.ownerPractitionerId === ctx.practitionerId);
    return delay(own.map((p) => ({ ...p })));
  }

  async get(patientId: string, ctx: PatientCtx): Promise<Patient | null> {
    const p = store.patients.find((x) => x.patientId === patientId);
    // Non-owned or missing -> no data (FR-028). Backend would also audit-log the attempt.
    if (!p || p.ownerPractitionerId !== ctx.practitionerId) return delay(null);
    return delay({ ...p });
  }

  async create(input: CreatePatientInput, ctx: PatientCtx): Promise<Patient> {
    const patient: Patient = {
      patientId: nextId('p'),
      ownerPractitionerId: ctx.practitionerId, // set here only to emulate the server (FR-024)
      createdAt: new Date().toISOString(),
      fields: { ...input.fields },
    };
    store.patients = [patient, ...store.patients];
    return delay(patient);
  }

  async history(patientId: string, ctx: PatientCtx): Promise<PatientHistory | null> {
    const patient = await this.get(patientId, ctx);
    if (!patient) return null;
    const submissions = store.submissions
      .filter((s) => s.patientId === patientId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const records = store.records
      .filter((r) => r.patientId === patientId)
      .sort((a, b) => b.processedAt.localeCompare(a.processedAt));
    return delay({ patient, submissions, records });
  }
}

/* -------------------------------------------------------------------------- */
/* Real HTTP implementation                                                   */
/* -------------------------------------------------------------------------- */

class ApiPatientsService implements PatientsService {
  async list(): Promise<Patient[]> {
    const { data } = await apiClient.get<Patient[]>('/patients');
    return data;
  }
  async get(patientId: string): Promise<Patient | null> {
    try {
      const { data } = await apiClient.get<Patient>(`/patients/${encodeURIComponent(patientId)}`);
      return data;
    } catch (e) {
      if ((e as ApiError).status === 404) return null;
      throw e;
    }
  }
  async create(input: CreatePatientInput): Promise<Patient> {
    // Only the demographic fields are sent — ownership is never client-supplied (FR-024).
    const { data } = await apiClient.post<Patient>('/patients', input.fields);
    return data;
  }
  async history(patientId: string): Promise<PatientHistory | null> {
    try {
      const { data } = await apiClient.get<PatientHistory>(`/patients/${encodeURIComponent(patientId)}/history`);
      return data;
    } catch (e) {
      if ((e as ApiError).status === 404) return null;
      throw e;
    }
  }
}

export const patientsService: PatientsService =
  env.authMode === 'cognito' ? new ApiPatientsService() : new MockPatientsService();
