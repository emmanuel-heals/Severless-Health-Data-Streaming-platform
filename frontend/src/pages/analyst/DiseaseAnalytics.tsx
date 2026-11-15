import { PageHeader } from '@/components/ui/Card';
import { Placeholder } from '@/components/ui/Placeholder';

/** Disease analytics — descriptive only (UC-015..019, FR-052..059). */
export function DiseaseAnalytics() {
  return (
    <>
      <PageHeader title="Disease Analytics" subtitle="Explore disease patterns and trends" />
      <Placeholder phase="Phase 4 — Analyst flows">
        Category + date-range filters, category record list (with Unclassified), read-only
        individual record view (audited), descriptive statistics (AR-01..06) and Plotly charts/
        trends with empty states.
      </Placeholder>
    </>
  );
}
