import { PageHeader } from '@/components/ui/Card';
import { Placeholder } from '@/components/ui/Placeholder';

/** Health data entry + submission (UC-008/009/012, FR-030..038). */
export function HealthDataEntry() {
  return (
    <>
      <PageHeader title="Enter Health Measurements" subtitle="Record new health data for a selected patient" />
      <Placeholder phase="Phase 3 — Practitioner flows">
        Own-patient selector, config-driven measurement form (OI-02), optional document upload
        (OI-15), and submission with an idempotency key (FR-038). "Accepted" is shown only after
        Kinesis acknowledges (FR-035/FR-041).
      </Placeholder>
    </>
  );
}
