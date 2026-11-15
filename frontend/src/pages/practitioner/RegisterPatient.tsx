import { PageHeader } from '@/components/ui/Card';
import { Placeholder } from '@/components/ui/Placeholder';

/** Register patient (UC-007, FR-021..024). Fields are config-driven (OI-01). */
export function RegisterPatient() {
  return (
    <>
      <PageHeader title="Register New Patient" subtitle="Add a new patient to your practice" />
      <Placeholder phase="Phase 3 — Practitioner flows">
        Config-driven registration form (OI-01). Ownership is set server-side from the token, never
        sent by the client (FR-024). On success it shows the system-generated patient ID and a
        continue-to-measurements action.
      </Placeholder>
    </>
  );
}
