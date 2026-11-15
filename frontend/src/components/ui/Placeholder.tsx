import type { ReactNode } from 'react';
import { Card } from './Card';
import { Icon } from '@/components/Icon';

/** Marks a view/section scheduled for a later delivery phase. */
export function Placeholder({ phase, children }: { phase: string; children: ReactNode }) {
  return (
    <Card>
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
        <span
          aria-hidden="true"
          style={{
            color: 'var(--color-primary-700)',
            background: 'var(--color-primary-050)',
            borderRadius: 10,
            padding: 8,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icon name="clock" size={22} />
        </span>
        <div>
          <strong style={{ display: 'block', marginBottom: 4 }}>Planned — {phase}</strong>
          <span style={{ color: 'var(--color-muted)' }}>{children}</span>
        </div>
      </div>
    </Card>
  );
}
