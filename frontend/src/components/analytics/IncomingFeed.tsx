/*
 * Live incoming-records feed for analysts. Polls on an interval (OI-10 / CI-06) and shows
 * de-identified subject references only — no patient identity (privacy posture, OI-08).
 */
import { useIncomingFeed } from '@/hooks/useAnalytics';
import { EmptyState } from '@/components/feedback/EmptyState';
import { timeAgo } from '@/lib/format';
import { env } from '@/config/env';
import styles from '@/pages/analyst/analytics.module.css';

export function IncomingFeed({ limit }: { limit?: number }) {
  const { data, isLoading, isFetching } = useIncomingFeed();
  const items = (data ?? []).slice(0, limit ?? 15);
  const seconds = Math.round(env.incomingFeedPollMs / 1000);

  return (
    <>
      <div className={styles.cardHead}>
        <h3>Incoming records</h3>
        <span className={styles.liveDot} title={`Refreshes every ${seconds}s`}>
          {isFetching ? 'Updating' : 'Live'}
        </span>
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--color-muted)' }}>Connecting to the feed…</p>
      ) : items.length === 0 ? (
        <EmptyState icon="activity" title="No incoming records" description="New records will appear here as they arrive." />
      ) : (
        <ul className={styles.feed} aria-live="polite">
          {items.map((it) => (
            <li key={it.id} className={styles.feedItem}>
              <span className={styles.feedLeft}>
                <span className={styles.feedDot} aria-hidden="true" />
                <span style={{ minWidth: 0 }}>
                  <span className={styles.feedSubject}>{it.subjectRef}</span>
                  <span className={styles.feedCat} style={{ display: 'block' }}>
                    {it.categoryName}
                  </span>
                </span>
              </span>
              <span className={styles.feedTime}>{timeAgo(it.receivedAt)}</span>
            </li>
          ))}
        </ul>
      )}
      <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-3)' }}>
        De-identified subject references only. Refreshes every {seconds}s.
      </p>
    </>
  );
}
