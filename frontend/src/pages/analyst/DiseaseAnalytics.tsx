import { useMemo, useState } from 'react';
import { PageHeader, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/data/DataTable';
import type { Column } from '@/components/data/DataTable';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/feedback/EmptyState';
import { FullPageLoader } from '@/components/feedback/FullPageLoader';
import { Icon } from '@/components/Icon';
import { TrendChart, CategoryBarChart } from '@/components/charts/Chart';
import { useAnalyticsRecord, useAnalyticsRecords, useCategories, useStatistics } from '@/hooks/useAnalytics';
import type { AnalyticsFilter, AnalystRecord } from '@/services/analyticsApi';
import { UNCLASSIFIED_CATEGORY_ID } from '@/types/domain';
import { formatDate, formatDateTime, measurementLabel } from '@/lib/format';
import styles from './analytics.module.css';

function maskCount(n: number, threshold: number): string {
  return n > 0 && n < threshold ? `<${threshold}` : `${n}`;
}

/** Disease analytics — descriptive, read-only (UC-015..019, FR-052..059; AR-01..06). */
export function DiseaseAnalytics() {
  const [categoryId, setCategoryId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [openRecordId, setOpenRecordId] = useState<string | null>(null);

  const filter: AnalyticsFilter = useMemo(
    () => ({ categoryId: categoryId || undefined, from: from || undefined, to: to || undefined }),
    [categoryId, from, to],
  );

  const { data: categories } = useCategories();
  const { data: records, isLoading: recLoading, isError } = useAnalyticsRecords(filter);
  const { data: stats } = useStatistics(filter);

  const showingAll = !categoryId;
  const distribution = useMemo(
    () =>
      (stats?.byCategory ?? [])
        .filter((c) => c.recordCount > 0)
        .map((c) => ({ label: c.categoryName, value: c.recordCount, highlight: c.categoryId === UNCLASSIFIED_CATEGORY_ID })),
    [stats],
  );

  const columns: Column<AnalystRecord>[] = [
    { key: 'subject', header: 'Subject', render: (r) => <strong>{r.subjectRef}</strong> },
    { key: 'category', header: 'Category', render: (r) => r.categoryName },
    { key: 'processed', header: 'Processed', render: (r) => formatDate(r.processedAt) },
    {
      key: 'summary',
      header: 'Measurements',
      render: (r) => (
        <span style={{ color: 'var(--color-muted)', fontSize: 'var(--text-sm)' }}>
          {r.measurements.slice(0, 2).map((m) => `${measurementLabel(m.type)} ${m.value}${m.unit ?? ''}`).join(' · ')}
          {r.measurements.length > 2 ? ` +${r.measurements.length - 2}` : ''}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <Button variant="secondary" onClick={() => setOpenRecordId(r.recordId)}>
          View
        </Button>
      ),
    },
  ];

  const hasFilters = !!categoryId || !!from || !!to;

  return (
    <>
      <PageHeader title="Disease Analytics" subtitle="Explore disease patterns and trends — read-only" />

      <Card style={{ marginBottom: 'var(--space-5)' }}>
        <div className={styles.filters}>
          <div className={styles.filterField}>
            <label htmlFor="f-category">Category</label>
            <select id="f-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">All categories</option>
              {(categories ?? []).map((c) => (
                <option key={c.categoryId} value={c.categoryId}>
                  {c.categoryName} ({c.recordCount})
                </option>
              ))}
            </select>
          </div>
          <div className={styles.filterField}>
            <label htmlFor="f-from">From</label>
            <input id="f-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className={styles.filterField}>
            <label htmlFor="f-to">To</label>
            <input id="f-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              onClick={() => {
                setCategoryId('');
                setFrom('');
                setTo('');
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* Descriptive statistics (AR-01..06) */}
        {stats && (
          <>
            <div className={styles.statRow}>
              <div className={styles.miniStat}>
                <div className="n">{stats.totalRecords}</div>
                <div className="l">Records</div>
              </div>
              <div className={styles.miniStat}>
                <div className="n">{maskCount(stats.totalSubjects, stats.suppressedBelow)}</div>
                <div className="l">Distinct subjects</div>
              </div>
              <div className={styles.miniStat}>
                <div className="n">{stats.trend.length}</div>
                <div className="l">Months with data</div>
              </div>
            </div>

            {stats.measurementSummaries.length > 0 ? (
              <DataTable
                caption="Measurement summary"
                columns={[
                  { key: 'metric', header: 'Measurement', render: (s: (typeof stats.measurementSummaries)[number]) => s.label },
                  { key: 'count', header: 'n', render: (s) => s.count },
                  { key: 'mean', header: 'Mean', render: (s) => `${s.mean}${s.unit ? ` ${s.unit}` : ''}` },
                  { key: 'min', header: 'Min', render: (s) => `${s.min}${s.unit ? ` ${s.unit}` : ''}` },
                  { key: 'max', header: 'Max', render: (s) => `${s.max}${s.unit ? ` ${s.unit}` : ''}` },
                ]}
                rows={stats.measurementSummaries}
                rowKey={(s) => s.type}
              />
            ) : (
              <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-sm)' }}>
                Not enough records in this selection to report measurement statistics (groups smaller than{' '}
                {stats.suppressedBelow} are suppressed for privacy).
              </p>
            )}
          </>
        )}
      </Card>

      {/* Charts */}
      <div className={styles.grid2} style={{ marginBottom: 'var(--space-5)' }}>
        <Card>
          <div className={styles.cardHead}>
            <h3>Trend</h3>
          </div>
          {stats && stats.trend.length > 0 ? (
            <TrendChart points={stats.trend} label="Records" />
          ) : (
            <EmptyState icon="chart" title="No trend data" description="No records match the current filters." />
          )}
        </Card>
        <Card>
          <div className={styles.cardHead}>
            <h3>{showingAll ? 'Distribution by category' : 'Category'}</h3>
          </div>
          {distribution.length > 0 ? (
            <CategoryBarChart data={distribution} />
          ) : (
            <EmptyState icon="chart" title="No category data" description="No records match the current filters." />
          )}
        </Card>
      </div>

      {/* Record list */}
      <Card>
        <div className={styles.cardHead}>
          <h3>Records</h3>
          <span style={{ color: 'var(--color-muted)', fontSize: 'var(--text-sm)' }}>
            {records ? `${records.length} record${records.length === 1 ? '' : 's'}` : ''}
          </span>
        </div>

        {recLoading ? (
          <FullPageLoader label="Loading records…" />
        ) : isError ? (
          <EmptyState icon="shield" title="Could not load records" description="There was a problem retrieving analytics records." />
        ) : (records ?? []).length === 0 ? (
          <EmptyState
            title="No records"
            description={hasFilters ? 'No records match the current filters. Try widening the date range or category.' : 'There are no records to display yet.'}
          />
        ) : (
          <DataTable columns={columns} rows={records ?? []} rowKey={(r) => r.recordId} caption="Analytics records" />
        )}
      </Card>

      {/* Read-only, audited individual record view */}
      <RecordModal recordId={openRecordId} onClose={() => setOpenRecordId(null)} />
    </>
  );
}

/* ------------------------- Read-only record view ------------------------- */

function RecordModal({ recordId, onClose }: { recordId: string | null; onClose: () => void }) {
  // Opening a record hits /analytics/records/{id}, whose access is audit-logged server-side (BR-14).
  const { data: record, isLoading } = useAnalyticsRecord(recordId);

  return (
    <Modal open={recordId !== null} onClose={onClose} title="Health record (read-only)">
      {isLoading || !record ? (
        <p style={{ color: 'var(--color-muted)' }}>Loading record…</p>
      ) : (
        <>
          <dl className={styles.recordMeta}>
            <div>
              <dt>Subject</dt>
              <dd>{record.subjectRef}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{record.categoryName}</dd>
            </div>
            <div>
              <dt>Processed</dt>
              <dd>{formatDateTime(record.processedAt)}</dd>
            </div>
            <div>
              <dt>Record ID</dt>
              <dd>{record.recordId}</dd>
            </div>
          </dl>

          <div className={styles.measureGrid}>
            {record.measurements.map((m, i) => (
              <div key={i} className={styles.measureCell}>
                <span className="ml">{measurementLabel(m.type)}</span>
                <span className="mv">
                  {m.value}
                  {m.unit ? ` ${m.unit}` : ''}
                </span>
              </div>
            ))}
          </div>

          <p className={styles.auditNote}>
            <Icon name="shield" size={14} /> De-identified view. This access is recorded in the audit log.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
            <Button onClick={onClose} data-autofocus>
              Close
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
