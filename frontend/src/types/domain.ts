/*
 * Domain models — mirror the SRS logical data model (§10.1).
 * Only identifiers, ownership and audit-relevant fields are fixed; clinical attribute
 * lists are TBC (OI-01, OI-02, OI-03) and handled via config-driven field schemas.
 */

export type Role = 'sys_admin' | 'practitioner' | 'analyst';

export type AccountStatus = 'Active' | 'Deactivated';

/** A system account (SRS: User entity). Role is Cognito group membership (FR-003). */
export interface UserAccount {
  userId: string; // Cognito sub
  name: string;
  email: string;
  role: Role;
  status: AccountStatus;
  createdAt: string; // ISO
  createdBy?: string;
  deactivatedAt?: string;
  deactivatedBy?: string;
}

/** Patient — data subject owned by exactly one Practitioner (FR-024, BR-07). */
export interface Patient {
  patientId: string;
  ownerPractitionerId: string;
  createdAt: string;
  // Demographic/contact fields are TBC (OI-01) — kept as an open bag for config-driven forms.
  fields: Record<string, unknown>;
}

/** A single measurement value (SRS: Health Measurement). Types/units TBC (OI-02). */
export interface Measurement {
  measurementId?: string;
  type: string;
  value: string | number;
  unit?: string;
  measuredAt?: string;
}

export type SubmissionStatus = 'received' | 'processed' | 'failed';

/** Processing status of a submission (FR-048). */
export interface Submission {
  submissionId: string;
  patientId: string;
  status: SubmissionStatus;
  createdAt: string;
  error?: string;
}

/** Processed health record (SRS: Health Record). */
export interface HealthRecord {
  recordId: string;
  submissionId: string;
  patientId: string;
  practitionerId: string;
  categoryId?: string | null; // null/undefined = Unclassified (BR-11)
  processedAt: string;
  measurements?: Measurement[];
  documents?: MedicalDocumentRef[];
}

export interface MedicalDocumentRef {
  documentId: string;
  fileName: string;
  contentType: string;
  sizeBytes?: number;
  uploadedAt?: string;
  // Content is never embedded; opened via a short-lived backend URL (NFR-SEC-06).
}

export interface DiseaseCategory {
  categoryId: string;
  name: string;
}

export const UNCLASSIFIED_CATEGORY_ID = '__unclassified__';

/** Aggregated analytics payload shape (metrics TBC, OI-03). */
export interface CategoryStat {
  categoryId: string;
  categoryName: string;
  recordCount: number;
  patientCount: number;
}

export interface TrendPoint {
  period: string; // e.g. "2026-01" or ISO date
  count: number;
}
