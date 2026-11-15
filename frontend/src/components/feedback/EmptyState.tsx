import type { ReactNode } from 'react';
import { Icon } from '@/components/Icon';

/** Friendly empty state with an optional next action. */
export function EmptyState({
  icon = 'patients',
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: 'var(--space-8) var(--space-5)',
        color: 'var(--color-muted)',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: 'inline-grid',
          placeItems: 'center',
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--color-primary-050)',
          color: 'var(--color-primary-700)',
          marginBottom: 'var(--space-3)',
        }}
      >
        <Icon name={icon} size={28} />
      </span>
      <h3 style={{ color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>{title}</h3>
      {description && <p style={{ maxWidth: 420, margin: '0 auto var(--space-4)' }}>{description}</p>}
      {action}
    </div>
  );
}
