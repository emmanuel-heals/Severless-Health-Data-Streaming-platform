import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/Card';
import { Placeholder } from '@/components/ui/Placeholder';

/** Patient list + individual patient history (UC-010/011, FR-025/027). */
export function PatientRecords() {
  const { patientId } = useParams();
  return (
    <>
      <PageHeader
        title={patientId ? 'Patient Medical Record' : 'My Patients'}
        subtitle={patientId ? `Patient ${patientId}` : 'Patients you have registered'}
      />
      <Placeholder phase="Phase 3 — Practitioner flows">
        {patientId
          ? 'Chronological measurements, processed records and document links (via short-lived URLs). Non-owned patients return no data and are audit-logged (FR-028).'
          : 'Searchable list of your own patients only (FR-025), with pagination and a register CTA when empty.'}
      </Placeholder>
    </>
  );
}
