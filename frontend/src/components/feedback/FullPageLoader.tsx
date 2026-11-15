export function FullPageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--color-background)',
        color: 'var(--color-muted)',
        gap: 'var(--space-3)',
      }}
    >
      <div className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
