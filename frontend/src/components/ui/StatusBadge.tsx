import styles from './badge.module.css';
import type { AccountStatus, SubmissionStatus } from '@/types/domain';

type AnyStatus = AccountStatus | SubmissionStatus | string;

const toneByStatus: Record<string, 'active' | 'inactive' | 'warning'> = {
  Active: 'active',
  processed: 'active',
  Deactivated: 'inactive',
  failed: 'inactive',
  received: 'warning',
};

export function StatusBadge({ status }: { status: AnyStatus }) {
  const tone = toneByStatus[status] ?? 'warning';
  return <span className={`${styles.badge} ${styles[tone]}`}>{status}</span>;
}
