import { PageHeader } from '@/components/ui/Card';
import { StatCard, StatGrid } from '@/components/ui/StatCard';
import { Placeholder } from '@/components/ui/Placeholder';

/**
 * sys_admin Account Management (UC-002..005, FR-011..019, FR-061).
 * Shows ONLY account data — never patient/health/analytics (FR-061, AC-10).
 */
export function AccountManagement() {
  return (
    <>
      <PageHeader
        title="Account Management"
        subtitle="Create and deactivate Health Practitioner and Health Analyst accounts"
      />
      <StatGrid>
        <StatCard icon="patients" value="—" label="Health Practitioners" />
        <StatCard icon="chart" value="—" label="Health Analysts" />
      </StatGrid>
      <Placeholder phase="Phase 2 — Account Management">
        Account list (name, email, role, status, created) with Create Practitioner / Create Analyst
        and Deactivate (with confirmation) will be implemented here against <code>/accounts</code>.
      </Placeholder>
    </>
  );
}
