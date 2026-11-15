import { PageHeader } from '@/components/ui/Card';
import { StatCard, StatGrid } from '@/components/ui/StatCard';
import { LinkButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Placeholder } from '@/components/ui/Placeholder';

/** Practitioner dashboard — own data only (FR-062). */
export function PractitionerDashboard() {
  return (
    <>
      <PageHeader title="Practitioner Dashboard" subtitle="Manage your patients and health data" />
      <StatGrid>
        <StatCard icon="patients" value="—" label="My Patients" />
        <StatCard icon="heart" value="—" label="Health Records" />
        <StatCard icon="check" value="—" label="Submitted Today" />
        <StatCard icon="clock" value="—" label="Pending Review" />
      </StatGrid>

      <Card style={{ marginBottom: 'var(--space-5)' }}>
        <h3>Quick actions</h3>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <LinkButton to="/practitioner/patients/register">Register New Patient</LinkButton>
          <LinkButton to="/practitioner/data-entry" variant="secondary">
            Enter Health Measurements
          </LinkButton>
          <LinkButton to="/practitioner/patients" variant="ghost">
            View Patient Records
          </LinkButton>
        </div>
      </Card>

      <Placeholder phase="Phase 3 — Practitioner flows">
        Recent patients and recent submission statuses (received / processed / failed) will appear
        here.
      </Placeholder>
    </>
  );
}
