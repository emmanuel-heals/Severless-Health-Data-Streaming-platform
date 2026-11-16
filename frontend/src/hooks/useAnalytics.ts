import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analyticsApi';
import type { AnalystRecord, AnalyticsFilter, IncomingItem, Statistics } from '@/services/analyticsApi';
import type { CategoryStat } from '@/types/domain';
import { env } from '@/config/env';

export function useCategories() {
  return useQuery<CategoryStat[]>({
    queryKey: ['analytics', 'categories'],
    queryFn: () => analyticsService.categories(),
  });
}

export function useAnalyticsRecords(filter: AnalyticsFilter) {
  return useQuery<AnalystRecord[]>({
    queryKey: ['analytics', 'records', filter],
    queryFn: () => analyticsService.records(filter),
  });
}

export function useAnalyticsRecord(recordId: string | null) {
  return useQuery<AnalystRecord | null>({
    queryKey: ['analytics', 'record', recordId],
    queryFn: () => analyticsService.record(recordId as string),
    enabled: !!recordId,
  });
}

export function useStatistics(filter: AnalyticsFilter) {
  return useQuery<Statistics>({
    queryKey: ['analytics', 'statistics', filter],
    queryFn: () => analyticsService.statistics(filter),
  });
}

/** Incoming-records feed. Polls on an interval (OI-10 / CI-06), configurable via env. */
export function useIncomingFeed() {
  return useQuery<IncomingItem[]>({
    queryKey: ['analytics', 'incoming'],
    queryFn: () => analyticsService.incoming(),
    refetchInterval: env.incomingFeedPollMs,
    refetchIntervalInBackground: false,
  });
}
