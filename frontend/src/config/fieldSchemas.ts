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
