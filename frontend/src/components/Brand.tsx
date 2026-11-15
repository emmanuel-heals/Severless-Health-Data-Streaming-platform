import { Icon } from './Icon';

/** Logo lockup used in the sidebar and login panel. */
export function Brand({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const color = variant === 'light' ? 'var(--on-primary)' : 'var(--color-primary)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      <span
        aria-hidden="true"
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 34,
          height: 34,
          borderRadius: 9,
          background: variant === 'light' ? 'rgba(255,255,255,0.15)' : 'var(--color-primary-050)',
          color,
        }}
      >
        <Icon name="heart" size={20} />
      </span>
      <span style={{ fontWeight: 800, lineHeight: 1.1, color, fontSize: 15 }}>
        Health Streaming
        <br />
        Platform
      </span>
    </div>
  );
}
