/*
 * Health-data submission (practitioner). Mirrors the SRS REST contract (§4.3):
 *   POST /submissions          — enqueue a measurement submission (Kinesis), returns "received"
 *   GET  /submissions/{id}     — poll processing status (received -> processed | failed)
 *
 * Idempotency (FR-038): the client generates a key once per attempt and re-sends it on retry,
 * so a retried network call never creates a duplicate submission. The mock honours this with an
 * in-memory key->submission map; the real API receives it via the Idempotency-Key header.
 */
import type { Measurement, Submission } from '@/types/domain';
import { env } from '@/config/env';
import { apiClient } from './apiClient';
import { nextId, store } from './mockStore';

export interface SubmitInput {
  patientId: string;
  measurements: Measurement[];
  /** Document metadata only; bytes are uploaded out-of-band (OI-15, gated by a feature flag). */
  documentNames?: string[];
}

export interface SubmissionsService {
  submit(input: SubmitInput, idempotencyKey: string): Promise<Submission>;
  get(submissionId: string): Promise<Submission | null>;
}

function delay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/* -------------------------------------------------------------------------- */
/* Mock implementation                                                        */
/* -------------------------------------------------------------------------- */

/** Simulated downstream processing latency (received -> processed). */
const PROCESS_MS = 4000;

class MockSubmissionsService implements SubmissionsService {
  async submit(input: SubmitInput, idempotencyKey: string): Promise<Submission> {
    // Idempotent retry: same key returns the original submission (FR-038).
    const existingId = store.idempotency.get(idempotencyKey);
    if (existingId) {
      const existing = store.submissions.find((s) => s.submissionId === existingId);
      if (existing) return delay({ ...existing });
    }

    const submission: Submission = {
      submissionId: nextId('s'),
      patientId: input.patientId,
      status: 'received', // accepted into the stream; not yet processed (FR-035)
      createdAt: new Date().toISOString(),
    };
    store.submissions = [submission, ...store.submissions];
    store.idempotency.set(idempotencyKey, submission.submissionId);

    // Emulate asynchronous processing: flip to "processed" and materialise a health record.
    setTimeout(() => {
      const idx = store.submissions.findIndex((s) => s.submissionId === submission.submissionId);
      if (idx === -1) return;
      store.submissions[idx] = { ...store.submissions[idx], status: 'processed' };
      const patient = store.patients.find((p) => p.patientId === input.patientId);
      store.records = [
        {
          recordId: nextId('r'),
          submissionId: submission.submissionId,
          patientId: input.patientId,
          practitionerId: patient?.ownerPractitionerId ?? 'u-doc-1',
          categoryId: null, // unclassified until analytics categorisation (BR-11)
          processedAt: new Date().toISOString(),
          measurements: input.measurements,
          documents: input.documentNames?.map((fileName) => ({
            documentId: nextId('doc'),
            fileName,
            contentType: 'application/octet-stream',
            uploadedAt: new Date().toISOString(),
          })),
        },
        ...store.records,
      ];
    }, PROCESS_MS);

    return delay({ ...submission });
  }

  async get(submissionId: string): Promise<Submission | null> {
    const s = store.submissions.find((x) => x.submissionId === submissionId);
    return delay(s ? { ...s } : null, 200);
  }
}

/* -------------------------------------------------------------------------- */
/* Real HTTP implementation                                                   */
/* -------------------------------------------------------------------------- */

class ApiSubmissionsService implements SubmissionsService {
  async submit(input: SubmitInput, idempotencyKey: string): Promise<Submission> {
    const { data } = await apiClient.post<Submission>(
      '/submissions',
      { patientId: input.patientId, measurements: input.measurements, documentNames: input.documentNames },
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
    return data;
  }
  async get(submissionId: string): Promise<Submission | null> {
    const { data } = await apiClient.get<Submission>(`/submissions/${encodeURIComponent(submissionId)}`);
    return data;
  }
}

export const submissionsService: SubmissionsService =
  env.authMode === 'cognito' ? new ApiSubmissionsService() : new MockSubmissionsService();
