import { Icon } from '@/components/Icon';
import styles from './ui.module.css';

export function StatCard({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string | number;
  label: string;
}) {
  return (
    <div className={styles.stat}>
      <span className={styles.statIcon} aria-hidden="true">
        <Icon name={icon} size={24} />
      </span>
      <span className={styles.statBody}>
        <span className={styles.statValue}>{value}</span>
        <span className={styles.statLabel}>{label}</span>
      </span>
    </div>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className={styles.statGrid}>{children}</div>;
}
