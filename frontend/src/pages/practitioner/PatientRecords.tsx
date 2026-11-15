import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Card } from '@/components/ui/Card';
import { Button, LinkButton } from '@/components/ui/Button';
import { DataTable } from '@/components/data/DataTable';
import type { Column } from '@/components/data/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { FullPageLoader } from '@/components/feedback/FullPageLoader';
import { Icon } from '@/components/Icon';
import { usePatients, usePatientHistory } from '@/hooks/usePatients';
import type { Patient } from '@/types/domain';
import { ageFrom, formatDate, formatDateTime, measurementLabel, patientInitials, patientName } from '@/lib/format';
import styles from './records.module.css';

const SEX_LABEL: Record<string, string> = {
  female: 'Female',
  male: 'Male',
  other: 'Other',
  undisclosed: 'Undisclosed',
};

/** Entry point: patient list, or a single patient's record when :patientId is present. */
export function PatientRecords() {
  const { patientId } = useParams();
  return patientId ? <PatientDetail patientId={patientId} /> : <PatientList />;
}

/* ----------------------------- Patient list ----------------------------- */

function PatientList() {
  const { data: patients, isLoading, isError, refetch } = usePatients();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const list = patients ?? [];
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter((p) => {
      const hay = `${patientName(p)} ${p.patientId} ${(p.fields.nationalId as string) ?? ''}`.toLowerCase();
      return hay.includes(term);
    });
  }, [patients, q]);

  const columns: Column<Patient>[] = [
    {
      key: 'name',
      header: 'Patient',
      render: (p) => (
        <span className={styles.nameCell}>
          <span className={styles.avatar} aria-hidden="true">
            {patientInitials(p)}
          </span>
          <span>
            <strong style={{ display: 'block' }}>{patientName(p)}</strong>
            <span style={{ color: 'var(--color-muted)', fontSize: 'var(--text-xs)' }}>{p.patientId}</span>
          </span>
        </span>
      ),
    },
    {
      key: 'dob',
      header: 'Age',
      render: (p) => {
        const age = ageFrom(p.fields.dateOfBirth);
        return age ? `${age} yrs` : '—';
      },
    },
    { key: 'sex', header: 'Sex', render: (p) => SEX_LABEL[p.fields.sex as string] ?? '—' },
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

  if (isLoading) return <FullPageLoader label="Loading your patients…" />;

  return (
    <>
      <PageHeader title="My Patients" subtitle="Patients you have registered" />
      <Card>
        <div className={styles.toolbar}>
          <div className={styles.search}>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or ID…"
              aria-label="Search patients"
            />
          </div>
          <LinkButton to="/practitioner/patients/register">+ Register patient</LinkButton>
        </div>

        {isError ? (
          <EmptyState
            icon="shield"
            title="Could not load patients"
            description="There was a problem retrieving your patient list."
            action={<Button onClick={() => void refetch()}>Retry</Button>}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title={q ? 'No matching patients' : 'No patients yet'}
            description={q ? 'Try a different name or ID.' : 'Register your first patient to get started.'}
            action={!q && <LinkButton to="/practitioner/patients/register">Register patient</LinkButton>}
          />
        ) : (
          <DataTable columns={columns} rows={rows} rowKey={(p) => p.patientId} caption="Your patients" />
        )}
      </Card>
    </>
  );
}

/* ---------------------------- Patient detail ---------------------------- */

function PatientDetail({ patientId }: { patientId: string }) {
  const { data, isLoading, isError, refetch } = usePatientHistory(patientId);

  if (isLoading) return <FullPageLoader label="Loading patient record…" />;

  // null = not found OR not owned by this practitioner — same response, no data leak (FR-028).
  if (!isError && data === null) {
    return (
      <>
        <PageHeader title="Patient Medical Record" />
        <Card>
          <EmptyState
            icon="shield"
            title="Record unavailable"
            description="This patient does not exist, or is not registered under your care. Only a patient's own practitioner can view their record."
            action={<LinkButton to="/practitioner/patients">Back to my patients</LinkButton>}
          />
        </Card>
      </>
    );
  }

  if (isError || !data) {
    return (
      <>
        <PageHeader title="Patient Medical Record" />
        <Card>
          <EmptyState
            icon="shield"
            title="Could not load record"
            description="There was a problem retrieving this patient's record."
            action={<Button onClick={() => void refetch()}>Retry</Button>}
          />
        </Card>
      </>
    );
  }

  const { patient, records, submissions } = data;
  const pendingSubs = submissions.filter((s) => s.status !== 'processed');

  return (
    <>
      <PageHeader title={patientName(patient)} subtitle={`Patient ${patient.patientId}`} />

      <div style={{ marginBottom: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <LinkButton to={`/practitioner/data-entry?patient=${encodeURIComponent(patient.patientId)}`}>
          Enter measurements
        </LinkButton>
        <LinkButton to="/practitioner/patients" variant="ghost">
          Back to my patients
        </LinkButton>
      </div>

      <div className={styles.detailGrid}>
        <Card>
          <h3 style={{ marginTop: 0 }}>Demographics</h3>
          <dl className={styles.demographics}>
            <dt>Age</dt>
            <dd>{ageFrom(patient.fields.dateOfBirth) ? `${ageFrom(patient.fields.dateOfBirth)} years` : '—'}</dd>
            <dt>Date of birth</dt>
            <dd>{patient.fields.dateOfBirth ? formatDate(String(patient.fields.dateOfBirth)) : '—'}</dd>
            <dt>Sex</dt>
            <dd>{SEX_LABEL[patient.fields.sex as string] ?? '—'}</dd>
            <dt>Phone</dt>
            <dd>{(patient.fields.phone as string) || '—'}</dd>
            <dt>National/health ID</dt>
            <dd>{(patient.fields.nationalId as string) || '—'}</dd>
            <dt>Registered</dt>
            <dd>{formatDate(patient.createdAt)}</dd>
          </dl>
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Health records</h3>

          {pendingSubs.length > 0 && (
            <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-sm)' }}>
              {pendingSubs.length} submission{pendingSubs.length > 1 ? 's' : ''} still processing — records appear here
              once processed.
            </p>
          )}

          {records.length === 0 ? (
            <EmptyState
              icon="heart"
              title="No records yet"
              description="No processed health records for this patient. Enter measurements to create the first one."
              action={
                <LinkButton to={`/practitioner/data-entry?patient=${encodeURIComponent(patient.patientId)}`}>
                  Enter measurements
                </LinkButton>
              }
            />
          ) : (
            <div className={styles.timeline}>
              {records.map((r) => (
                <div key={r.recordId} className={styles.record}>
                  <div className={styles.recordHead}>
                    <span className={styles.recordDate}>{formatDateTime(r.processedAt)}</span>
                    <StatusBadge status="processed" />
                  </div>
                  <div className={styles.measurements}>
                    {(r.measurements ?? []).map((m, i) => (
                      <div key={i} className={styles.measurement}>
                        <span className={styles.mLabel}>{measurementLabel(m.type)}</span>
                        <span>
                          <span className={styles.mValue}>{m.value}</span>
                          {m.unit && <span className={styles.mUnit}>{m.unit}</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                  {r.documents && r.documents.length > 0 && (
                    <div className={styles.docs}>
                      {r.documents.map((d) => (
                        <span key={d.documentId} className={styles.docChip}>
                          <Icon name="file" size={14} /> {d.fileName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
