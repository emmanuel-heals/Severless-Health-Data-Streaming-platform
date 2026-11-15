/*
 * Config-driven field definitions. Clinical/account field lists are Open Issues in the SRS
 * (OI-01 patient, OI-02 measurements, OI-17 account). Keeping them here as data means
 * confirming a TBC is a config change, not a component rewrite.
 */

export type FieldType = 'text' | 'email' | 'date' | 'number' | 'select';

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** simple client-side hints; server remains authoritative (FR-013/022/032) */
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

/** Account creation fields (OI-17). Role is NOT here — it is fixed by the create action. */
export const accountCreateFields: FieldDef[] = [
  { name: 'name', label: 'Full name', type: 'text', required: true, placeholder: 'e.g. Dr. Sarah Johnson', maxLength: 120 },
  { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'name@organization.org' },
  // Additional account attributes are TBC (OI-17) — add here when confirmed.
];

/**
 * Patient registration fields (OI-01). Demographic/contact attributes are an Open Issue,
 * so they live here as data. Ownership (ownerPractitionerId) is NOT a field — it is set
 * server-side from the caller's token and never sent by the client (FR-024, BR-07).
 */
export const patientRegistrationFields: FieldDef[] = [
  { name: 'firstName', label: 'First name', type: 'text', required: true, placeholder: 'e.g. Grace', maxLength: 80 },
  { name: 'lastName', label: 'Last name', type: 'text', required: true, placeholder: 'e.g. Adeyemi', maxLength: 80 },
  { name: 'dateOfBirth', label: 'Date of birth', type: 'date', required: true },
  {
    name: 'sex',
    label: 'Sex',
    type: 'select',
    required: true,
    options: [
      { value: 'female', label: 'Female' },
      { value: 'male', label: 'Male' },
      { value: 'other', label: 'Other' },
      { value: 'undisclosed', label: 'Prefer not to say' },
    ],
  },
  { name: 'phone', label: 'Phone', type: 'text', required: false, placeholder: '+234 …', maxLength: 32 },
  { name: 'nationalId', label: 'National/health ID', type: 'text', required: false, maxLength: 40 },
];

/**
 * Measurement type catalogue (OI-02). Types, value kinds and units are TBC in the SRS,
 * so the data-entry form is generated from this list rather than hard-coded.
 */
export interface MeasurementTypeDef {
  type: string;
  label: string;
  unit?: string;
  /** numeric hints for client-side sanity checks; the backend remains authoritative (FR-032) */
  min?: number;
  max?: number;
  step?: number;
}

export const measurementTypes: MeasurementTypeDef[] = [
  { type: 'bp_systolic', label: 'Blood pressure (systolic)', unit: 'mmHg', min: 40, max: 300 },
  { type: 'bp_diastolic', label: 'Blood pressure (diastolic)', unit: 'mmHg', min: 20, max: 200 },
  { type: 'heart_rate', label: 'Heart rate', unit: 'bpm', min: 20, max: 300 },
  { type: 'temperature', label: 'Body temperature', unit: '°C', min: 25, max: 45, step: 0.1 },
  { type: 'spo2', label: 'Oxygen saturation (SpO₂)', unit: '%', min: 50, max: 100 },
  { type: 'blood_glucose', label: 'Blood glucose', unit: 'mmol/L', min: 0, max: 60, step: 0.1 },
  { type: 'weight', label: 'Weight', unit: 'kg', min: 0, max: 500, step: 0.1 },
  { type: 'height', label: 'Height', unit: 'cm', min: 0, max: 260, step: 0.1 },
];

export const measurementTypeByKey: Record<string, MeasurementTypeDef> = Object.fromEntries(
  measurementTypes.map((m) => [m.type, m]),
);
