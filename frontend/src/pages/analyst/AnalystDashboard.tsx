import { useMemo } from 'react';
import { PageHeader, Card } from '@/components/ui/Card';
import { StatCard, StatGrid } from '@/components/ui/StatCard';
import { LinkButton } from '@/components/ui/Button';
import { FullPageLoader } from '@/components/feedback/FullPageLoader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { TrendChart, CategoryBarChart } from '@/components/charts/Chart';
import { IncomingFeed } from '@/components/analytics/IncomingFeed';
import { useCategories, useStatistics } from '@/hooks/useAnalytics';
import { UNCLASSIFIED_CATEGORY_ID } from '@/types/domain';
import styles from './analytics.module.css';

/** Analyst dashboard — read-only overview & monitoring (FR-063). No data entry, no accounts. */
export function AnalystDashboard() {
  const { data: categories, isLoading: catLoading } = useCategories();
  const { data: stats, isLoading: statLoading } = useStatistics({});

  const topCategories = useMemo(
    () =>
      (categories ?? [])
        .filter((c) => c.recordCount > 0)
        .slice(0, 6)
        .map((c) => ({ label: c.categoryName, value: c.recordCount, highlight: c.categoryId === UNCLASSIFIED_CATEGORY_ID })),
    [categories],
  );

  const diseaseCategoryCount = useMemo(
    () => (categories ?? []).filter((c) => c.categoryId !== UNCLASSIFIED_CATEGORY_ID && c.recordCount > 0).length,
    [categories],
  );

  const latestMonth = stats?.trend.at(-1)?.count ?? 0;

  if (catLoading || statLoading) return <FullPageLoader label="Loading analytics…" />;

  return (
    <>
      <PageHeader title="Health Analyst Dashboard" subtitle="Monitor and analyze disease data" />

      <StatGrid>
        <StatCard icon="heart" value={stats?.totalRecords ?? 0} label="Health Records" />
        <StatCard icon="patients" value={stats?.totalSubjects ?? 0} label="Monitored Subjects" />
        <StatCard icon="shield" value={diseaseCategoryCount} label="Disease Categories" />
        <StatCard icon="activity" value={latestMonth} label="Records (latest month)" />
      </StatGrid>

      <div className={styles.grid2} style={{ marginBottom: 'var(--space-5)' }}>
        <Card>
          <div className={styles.cardHead}>
            <h3>Records over time</h3>
            <LinkButton to="/analyst/analytics" variant="ghost">
              Explore
            </LinkButton>
          </div>
          {stats && stats.trend.length > 0 ? (
            <TrendChart points={stats.trend} label="Records" />
          ) : (
            <EmptyState icon="chart" title="No trend data" description="There are no processed records to chart yet." />
          )}
        </Card>

        <Card>
          <div className={styles.cardHead}>
            <h3>Records by category</h3>
          </div>
          {topCategories.length > 0 ? (
            <CategoryBarChart data={topCategories} />
          ) : (
            <EmptyState icon="chart" title="No category data" description="Records will be grouped here once available." />
          )}
        </Card>
      </div>

      <Card>
        <IncomingFeed />
      </Card>
    </>
  );
}
