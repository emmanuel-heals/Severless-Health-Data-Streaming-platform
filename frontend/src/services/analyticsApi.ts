/*
 * Analytics data access (analyst). Mirrors the SRS REST contract (§4.3):
 *   GET /analytics/categories                      — disease categories + counts (incl. Unclassified)
 *   GET /analytics/categories/{categoryId}/records — records in a category (date-filterable)
 *   GET /analytics/records/{recordId}              — one record, read-only (access is audit-logged)
 *   GET /analytics/statistics                      — descriptive statistics (AR-01..06)
 *   GET /analytics/incoming                        — recent incoming records (polled feed, OI-10/CI-06)
 *
 * The analyst role is READ-ONLY and monitors disease patterns, not individuals: records are
 * exposed under a de-identified subject reference, never patient name/contact (privacy posture,
 * OI-08). Small groups are suppressed in statistics (AR small-cell rule). The UI imports only
 * `analyticsService`; swapping to the real backend touches nothing else.
 */
import type { CategoryStat, Measurement, TrendPoint } from '@/types/domain';
import { UNCLASSIFIED_CATEGORY_ID } from '@/types/domain';
import { measurementTypeByKey } from '@/config/fieldSchemas';
import { env } from '@/config/env';
import { apiClient } from './apiClient';

/** A record as the analyst sees it — de-identified (no patient identity). */
export interface AnalystRecord {
  recordId: string;
  categoryId: string | null; // null => Unclassified (BR-11)
  categoryName: string;
  subjectRef: string; // pseudonymous subject id, NOT a patient name (OI-08)
  processedAt: string;
  measurements: Measurement[];
}

export interface AnalyticsFilter {
  categoryId?: string; // UNCLASSIFIED_CATEGORY_ID selects unclassified; undefined = all
  from?: string; // ISO date (inclusive)
  to?: string; // ISO date (inclusive)
}

export interface MeasurementSummary {
  type: string;
  label: string;
  unit?: string;
  count: number;
  mean: number;
  min: number;
  max: number;
}

export interface Statistics {
  totalRecords: number;
  totalSubjects: number;
  byCategory: CategoryStat[];
  trend: TrendPoint[]; // monthly record counts
  measurementSummaries: MeasurementSummary[];
  /** Groups smaller than this are suppressed/masked for privacy (AR small-cell rule). */
  suppressedBelow: number;
}

export interface IncomingItem {
  id: string;
  categoryName: string;
  subjectRef: string;
  receivedAt: string;
}

export interface AnalyticsService {
  categories(): Promise<CategoryStat[]>;
  records(filter: AnalyticsFilter): Promise<AnalystRecord[]>;
  record(recordId: string): Promise<AnalystRecord | null>;
  statistics(filter: AnalyticsFilter): Promise<Statistics>;
  incoming(): Promise<IncomingItem[]>;
}

/** Below this count, a group's figures are masked (shown as "<5") in the UI. */
export const MIN_CELL = 5;

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/* -------------------------------------------------------------------------- */
/* Mock dataset — cross-practitioner aggregate for the analyst view           */
/* -------------------------------------------------------------------------- */

interface CategoryDef {
  categoryId: string | null;
  name: string;
  metrics: string[]; // measurement types typical of this category
}

const CATEGORIES: CategoryDef[] = [
  { categoryId: 'c-htn', name: 'Hypertension', metrics: ['bp_systolic', 'bp_diastolic', 'heart_rate'] },
  { categoryId: 'c-dm', name: 'Diabetes', metrics: ['blood_glucose', 'weight'] },
  { categoryId: 'c-resp', name: 'Respiratory Infection', metrics: ['spo2', 'temperature', 'heart_rate'] },
  { categoryId: 'c-cvd', name: 'Cardiovascular', metrics: ['bp_systolic', 'heart_rate', 'spo2'] },
  { categoryId: null, name: 'Unclassified', metrics: ['temperature', 'heart_rate'] },
];

/** Deterministic pseudo-random so the dataset (and stats) are stable across calls. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function measuredValue(type: string, rnd: () => number): number {
  const def = measurementTypeByKey[type];
  const ranges: Record<string, [number, number]> = {
    bp_systolic: [110, 170],
    bp_diastolic: [70, 105],
    heart_rate: [58, 105],
    temperature: [36.2, 39.4],
    spo2: [88, 100],
    blood_glucose: [4.2, 12.5],
    weight: [55, 105],
    height: [150, 190],
  };
  const [lo, hi] = ranges[type] ?? [0, 100];
  const raw = lo + rnd() * (hi - lo);
  const step = def?.step ?? 1;
  return Math.round(raw / step) * step;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function buildRecords(): AnalystRecord[] {
  const rnd = mulberry32(20260401);
  const records: AnalystRecord[] = [];
  const SUBJECTS = 42;
  const TOTAL = 140;
  const now = Date.now();
  const sixMonths = 183 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < TOTAL; i++) {
    const cat = CATEGORIES[Math.floor(rnd() * CATEGORIES.length)];
    const subjectNum = 1 + Math.floor(rnd() * SUBJECTS);
    const processedAt = new Date(now - Math.floor(rnd() * sixMonths)).toISOString();
    const measurements: Measurement[] = cat.metrics.map((type) => ({
      type,
      value: measuredValue(type, rnd),
      unit: measurementTypeByKey[type]?.unit,
    }));
    records.push({
      recordId: `ar-${1000 + i}`,
      categoryId: cat.categoryId,
      categoryName: cat.name,
      subjectRef: `SUBJ-${String(subjectNum).padStart(4, '0')}`,
      processedAt,
      measurements,
    });
  }
  return records.sort((a, b) => b.processedAt.localeCompare(a.processedAt));
}

const ALL_RECORDS = buildRecords();

// Rolling incoming feed, seeded then grown over time to simulate a live stream (OI-10).
let incomingFeed: IncomingItem[] = ALL_RECORDS.slice(0, 6).map((r, i) => ({
  id: `in-${i}`,
  categoryName: r.categoryName,
  subjectRef: r.subjectRef,
  receivedAt: new Date(Date.now() - i * 45_000).toISOString(),
}));
let incomingCounter = incomingFeed.length;

function matches(r: AnalystRecord, f: AnalyticsFilter): boolean {
  if (f.categoryId) {
    const wantUnclassified = f.categoryId === UNCLASSIFIED_CATEGORY_ID;
    if (wantUnclassified && r.categoryId !== null) return false;
    if (!wantUnclassified && r.categoryId !== f.categoryId) return false;
  }
  if (f.from && r.processedAt.slice(0, 10) < f.from) return false;
  if (f.to && r.processedAt.slice(0, 10) > f.to) return false;
  return true;
}

class MockAnalyticsService implements AnalyticsService {
  async categories(): Promise<CategoryStat[]> {
    return delay(this.computeByCategory(ALL_RECORDS));
  }

  async records(filter: AnalyticsFilter): Promise<AnalystRecord[]> {
    return delay(ALL_RECORDS.filter((r) => matches(r, filter)).map((r) => ({ ...r })));
  }

  async record(recordId: string): Promise<AnalystRecord | null> {
    const r = ALL_RECORDS.find((x) => x.recordId === recordId);
    // In the real system this read is audit-logged server-side (BR-14, FR-028).
    return delay(r ? { ...r } : null, 200);
  }

  async statistics(filter: AnalyticsFilter): Promise<Statistics> {
    const subset = ALL_RECORDS.filter((r) => matches(r, filter));
    const subjects = new Set(subset.map((r) => r.subjectRef));

    // Monthly trend.
    const byMonth = new Map<string, number>();
    for (const r of subset) {
      const k = monthKey(new Date(r.processedAt));
      byMonth.set(k, (byMonth.get(k) ?? 0) + 1);
    }
    const trend: TrendPoint[] = [...byMonth.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([period, count]) => ({ period, count }));

    // Measurement summaries (descriptive only).
    const byType = new Map<string, number[]>();
    for (const r of subset) {
      for (const m of r.measurements) {
        const v = typeof m.value === 'number' ? m.value : Number(m.value);
        if (!Number.isNaN(v)) byType.set(m.type, [...(byType.get(m.type) ?? []), v]);
      }
    }
    const measurementSummaries: MeasurementSummary[] = [...byType.entries()]
      .map(([type, values]) => ({
        type,
        label: measurementTypeByKey[type]?.label ?? type,
        unit: measurementTypeByKey[type]?.unit,
        count: values.length,
        mean: round1(values.reduce((s, v) => s + v, 0) / values.length),
        min: Math.min(...values),
        max: Math.max(...values),
      }))
      // Suppress summaries computed on too few records (privacy).
      .filter((s) => s.count >= MIN_CELL)
      .sort((a, b) => a.label.localeCompare(b.label));

    return delay({
      totalRecords: subset.length,
      totalSubjects: subjects.size,
      byCategory: this.computeByCategory(subset),
      trend,
      measurementSummaries,
      suppressedBelow: MIN_CELL,
    });
  }

  async incoming(): Promise<IncomingItem[]> {
    // Simulate a live stream: most polls bring one new record in.
    if (Math.random() < 0.7) {
      const r = ALL_RECORDS[Math.floor(Math.random() * ALL_RECORDS.length)];
      incomingFeed = [
        { id: `in-${incomingCounter++}`, categoryName: r.categoryName, subjectRef: r.subjectRef, receivedAt: new Date().toISOString() },
        ...incomingFeed,
      ].slice(0, 15);
    }
    return delay(incomingFeed.map((x) => ({ ...x })), 150);
  }

  private computeByCategory(records: AnalystRecord[]): CategoryStat[] {
    return CATEGORIES.map((c) => {
      const inCat = records.filter((r) => r.categoryId === c.categoryId);
      return {
        categoryId: c.categoryId ?? UNCLASSIFIED_CATEGORY_ID,
        categoryName: c.name,
        recordCount: inCat.length,
        patientCount: new Set(inCat.map((r) => r.subjectRef)).size,
      };
    }).sort((a, b) => b.recordCount - a.recordCount);
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/* -------------------------------------------------------------------------- */
/* Real HTTP implementation                                                   */
/* -------------------------------------------------------------------------- */

function query(filter: AnalyticsFilter): Record<string, string> {
  const q: Record<string, string> = {};
  if (filter.from) q.from = filter.from;
  if (filter.to) q.to = filter.to;
  if (filter.categoryId) q.categoryId = filter.categoryId;
  return q;
}

class ApiAnalyticsService implements AnalyticsService {
  async categories(): Promise<CategoryStat[]> {
    const { data } = await apiClient.get<CategoryStat[]>('/analytics/categories');
    return data;
  }
  async records(filter: AnalyticsFilter): Promise<AnalystRecord[]> {
    const categoryId = filter.categoryId ?? 'all';
    const { data } = await apiClient.get<AnalystRecord[]>(
      `/analytics/categories/${encodeURIComponent(categoryId)}/records`,
      { params: query(filter) },
    );
    return data;
  }
  async record(recordId: string): Promise<AnalystRecord | null> {
    const { data } = await apiClient.get<AnalystRecord>(`/analytics/records/${encodeURIComponent(recordId)}`);
    return data;
  }
  async statistics(filter: AnalyticsFilter): Promise<Statistics> {
    const { data } = await apiClient.get<Statistics>('/analytics/statistics', { params: query(filter) });
    return data;
  }
  async incoming(): Promise<IncomingItem[]> {
    const { data } = await apiClient.get<IncomingItem[]>('/analytics/incoming');
    return data;
  }
}

export const analyticsService: AnalyticsService =
  env.authMode === 'cognito' ? new ApiAnalyticsService() : new MockAnalyticsService();
