import { PageHeader } from '@/components/ui/Card';
import { StatCard, StatGrid } from '@/components/ui/StatCard';
import { Placeholder } from '@/components/ui/Placeholder';

/** Analyst dashboard — read-only overview & monitoring (FR-063). No data entry/accounts. */
export function AnalystDashboard() {
  return (
    <>
      <PageHeader title="Health Analyst Dashboard" subtitle="Monitor and analyze disease data" />
      <StatGrid>
        <StatCard icon="patients" value="—" label="Total Patients" />
        <StatCard icon="shield" value="—" label="Disease Categories" />
        <StatCard icon="heart" value="—" label="Health Records" />
        <StatCard icon="chart" value="—" label="Data Trends" />
      </StatGrid>
      <Placeholder phase="Phase 4 — Analyst flows">
        Disease-cases trend (Plotly), top categories, and the incoming-records feed (refresh per
        CI-06 / OI-10) will be implemented here.
      </Placeholder>
    </>
  );
}
