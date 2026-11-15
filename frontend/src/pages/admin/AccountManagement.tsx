import { useMemo, useState } from 'react';
import { PageHeader, Card } from '@/components/ui/Card';
import { StatCard, StatGrid } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/data/DataTable';
import type { Column } from '@/components/data/DataTable';
import { EmptyState } from '@/components/feedback/EmptyState';
import { FullPageLoader } from '@/components/feedback/FullPageLoader';
import { useToast } from '@/components/feedback/ToastProvider';
import { useAccounts, useDeactivateAccount } from '@/hooks/useAccounts';
import type { CreatableRole } from '@/services/accountsApi';
import type { ApiError } from '@/services/apiClient';
import type { Role, UserAccount } from '@/types/domain';
import { CreateAccountForm } from './CreateAccountForm';
import styles from './accounts.module.css';

type Tab = Extract<Role, 'practitioner' | 'analyst'>;

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * sys_admin Account Management (UC-002..005; FR-011..019; FR-061).
 * Shows ONLY account data — never patient/health/analytics (FR-061, AC-10).
 */
export function AccountManagement() {
  const { data: accounts, isLoading, isError, refetch } = useAccounts();
  const deactivate = useDeactivateAccount();
  const toast = useToast();

  const [tab, setTab] = useState<Tab>('practitioner');
  const [createRole, setCreateRole] = useState<CreatableRole | null>(null);
  const [toDeactivate, setToDeactivate] = useState<UserAccount | null>(null);

  const counts = useMemo(() => {
    const list = accounts ?? [];
    const by = (role: Role) => list.filter((a) => a.role === role);
    const active = (arr: UserAccount[]) => arr.filter((a) => a.status === 'Active').length;
    const prac = by('practitioner');
    const anal = by('analyst');
    return {
      prac: { total: prac.length, active: active(prac) },
      anal: { total: anal.length, active: active(anal) },
    };
  }, [accounts]);

  const rows = useMemo(() => (accounts ?? []).filter((a) => a.role === tab), [accounts, tab]);

  async function confirmDeactivate() {
    if (!toDeactivate) return;
    try {
      await deactivate.mutateAsync(toDeactivate.userId);
      toast.success(`${toDeactivate.name} has been deactivated.`);
      setToDeactivate(null);
    } catch (e) {
      toast.error((e as ApiError).message ?? 'Could not deactivate the account.');
    }
  }

  const columns: Column<UserAccount>[] = [
    { key: 'name', header: 'Name', render: (a) => <strong>{a.name}</strong> },
    { key: 'email', header: 'Email', render: (a) => a.email },
    { key: 'role', header: 'Role', render: (a) => (a.role === 'practitioner' ? 'Doctor' : 'Analyst') },
    { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} /> },
    { key: 'created', header: 'Created', render: (a) => fmtDate(a.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (a) => (
        <Button
          variant={a.status === 'Active' ? 'highlight' : 'secondary'}
          onClick={() => setToDeactivate(a)}
          disabled={a.status !== 'Active'}
        >
          {a.status === 'Active' ? 'Deactivate' : 'Deactivated'}
        </Button>
      ),
    },
  ];

  if (isLoading) return <FullPageLoader label="Loading accounts…" />;

  return (
    <>
      <PageHeader title="Account Management" subtitle="Create and deactivate Health Practitioner and Health Analyst accounts" />

      <StatGrid>
        <StatCard icon="patients" value={counts.prac.total} label={`Health Practitioners · ${counts.prac.active} active`} />
        <StatCard icon="chart" value={counts.anal.total} label={`Health Analysts · ${counts.anal.active} active`} />
      </StatGrid>

      <Card>
        <div className={styles.toolbar}>
          <div className={styles.tabs} role="tablist" aria-label="Account type">
            <button role="tab" aria-selected={tab === 'practitioner'} className={`${styles.tab} ${tab === 'practitioner' ? styles.tabActive : ''}`} onClick={() => setTab('practitioner')}>
              Practitioners
            </button>
            <button role="tab" aria-selected={tab === 'analyst'} className={`${styles.tab} ${tab === 'analyst' ? styles.tabActive : ''}`} onClick={() => setTab('analyst')}>
              Analysts
            </button>
          </div>
          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => setCreateRole('practitioner')}>+ Create Practitioner</Button>
            <Button onClick={() => setCreateRole('analyst')}>+ Create Analyst</Button>
          </div>
        </div>

        {isError ? (
          <EmptyState
            icon="shield"
            title="Could not load accounts"
            description="There was a problem retrieving the account list."
            action={<Button onClick={() => void refetch()}>Retry</Button>}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title={`No ${tab === 'practitioner' ? 'practitioner' : 'analyst'} accounts yet`}
            description="Create the first account to get started."
            action={<Button onClick={() => setCreateRole(tab)}>{`Create ${tab === 'practitioner' ? 'Practitioner' : 'Analyst'}`}</Button>}
          />
        ) : (
          <DataTable columns={columns} rows={rows} rowKey={(a) => a.userId} caption={`${tab} accounts`} />
        )}
      </Card>

      {/* Create modal */}
      <Modal open={createRole !== null} onClose={() => setCreateRole(null)} title={createRole === 'analyst' ? 'Create Health Analyst' : 'Create Health Practitioner'}>
        {createRole && <CreateAccountForm role={createRole} onDone={() => setCreateRole(null)} onCancel={() => setCreateRole(null)} />}
      </Modal>

      {/* Deactivate confirmation (FR-018 / UI-05) */}
      <ConfirmDialog
        open={toDeactivate !== null}
        title="Deactivate account?"
        confirmLabel="Deactivate"
        busy={deactivate.isPending}
        message={
          toDeactivate && (
            <>
              This disables sign-in for <strong>{toDeactivate.name}</strong> and signs them out everywhere.
              {toDeactivate.role === 'practitioner'
                ? ' Their patients, submissions and records are retained unchanged.'
                : ' Their audit history is retained.'}
            </>
          )
        }
        onConfirm={() => void confirmDeactivate()}
        onCancel={() => setToDeactivate(null)}
      />
    </>
  );
}
