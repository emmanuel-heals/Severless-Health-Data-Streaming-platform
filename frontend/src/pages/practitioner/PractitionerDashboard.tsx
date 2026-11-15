import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Card } from '@/components/ui/Card';
import { StatCard, StatGrid } from '@/components/ui/StatCard';
import { Button, LinkButton } from '@/components/ui/Button';
import { DataTable } from '@/components/data/DataTable';
import type { Column } from '@/components/data/DataTable';
import { EmptyState } from '@/components/feedback/EmptyState';
import { FullPageLoader } from '@/components/feedback/FullPageLoader';
import { usePatients } from '@/hooks/usePatients';
import { ageFrom, formatDate, patientName } from '@/lib/format';
import type { Patient } from '@/types/domain';

/** Practitioner dashboard — own data only (FR-062). Figures are derived from the scoped list. */
export function PractitionerDashboard() {
  const { data: patients, isLoading } = usePatients();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const list = patients ?? [];
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return {
      total: list.length,
      newThisWeek: list.filter((p) => new Date(p.createdAt).getTime() >= weekAgo).length,
      newThisMonth: list.filter((p) => new Date(p.createdAt).getTime() >= monthAgo).length,
    };
  }, [patients]);

  const recent = useMemo(
    () =>
      [...(patients ?? [])]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    [patients],
  );

  const columns: Column<Patient>[] = [
    { key: 'name', header: 'Patient', render: (p) => <strong>{patientName(p)}</strong> },
    { key: 'age', header: 'Age', render: (p) => (ageFrom(p.fields.dateOfBirth) ? `${ageFrom(p.fields.dateOfBirth)} yrs` : '—') },
    { key: 'registered', header: 'Registered', render: (p) => formatDate(p.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (p) => (
        <Button variant="secondary" onClick={() => navigate(`/practitioner/patients/${encodeURIComponent(p.patientId)}`)}>
          View record
        </Button>
      ),
    },
  ];

  if (isLoading) return <FullPageLoader label="Loading your dashboard…" />;

  return (
    <>
      <PageHeader title="Practitioner Dashboard" subtitle="Manage your patients and health data" />

      <StatGrid>
        <StatCard icon="patients" value={stats.total} label="My Patients" />
        <StatCard icon="user-plus" value={stats.newThisWeek} label="Registered this week" />
        <StatCard icon="activity" value={stats.newThisMonth} label="Registered this month" />
      </StatGrid>

      <Card style={{ marginBottom: 'var(--space-5)' }}>
        <h3 style={{ marginTop: 0 }}>Quick actions</h3>
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

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0 }}>Recent patients</h3>
          <LinkButton to="/practitioner/patients" variant="ghost">
            View all
          </LinkButton>
        </div>
        <div style={{ marginTop: 'var(--space-4)' }}>
          {recent.length === 0 ? (
            <EmptyState
              title="No patients yet"
              description="Register your first patient to get started."
              action={<LinkButton to="/practitioner/patients/register">Register patient</LinkButton>}
            />
          ) : (
            <DataTable columns={columns} rows={recent} rowKey={(p) => p.patientId} caption="Recent patients" />
          )}
        </div>
      </Card>
    </>
  );
}
