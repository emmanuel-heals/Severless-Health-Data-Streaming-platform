import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
  message?: string;
}

/**
 * Catches render-time errors so a single broken view never blanks the whole app
 * (NFR-USA: graceful failure). The UI is not the security boundary — this only improves UX.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : 'Unexpected error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Hook for a real logger/monitoring sink later; avoid leaking details to users.
    if (import.meta.env.DEV) console.error('ErrorBoundary caught:', error, info);
  }

  handleReset = () => this.setState({ hasError: false, message: undefined });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div role="alert" style={{ padding: 'var(--space-8) var(--space-5)', textAlign: 'center', color: 'var(--color-muted)' }}>
        <h2 style={{ color: 'var(--color-text)' }}>Something went wrong</h2>
        <p>This view ran into a problem. You can try again.</p>
        <button
          type="button"
          onClick={this.handleReset}
          style={{
            marginTop: 'var(--space-3)',
            padding: '10px 18px',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary)',
            color: 'var(--on-primary)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </div>
    );
  }
}
