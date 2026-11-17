import { describe, it, expect } from 'vitest';
import { analyticsService, MIN_CELL } from './analyticsApi';
import { UNCLASSIFIED_CATEGORY_ID } from '@/types/domain';

describe('analytics mock service', () => {
  it('exposes categories including Unclassified, each with counts', async () => {
    const cats = await analyticsService.categories();
    expect(cats.length).toBeGreaterThan(0);
    expect(cats.some((c) => c.categoryId === UNCLASSIFIED_CATEGORY_ID)).toBe(true);
    for (const c of cats) {
      expect(c.recordCount).toBeGreaterThanOrEqual(0);
      expect(c.patientCount).toBeGreaterThanOrEqual(0);
    }
  });

  it('returns de-identified records only (subject refs, never patient identity)', async () => {
    const records = await analyticsService.records({});
    expect(records.length).toBeGreaterThan(0);
    for (const r of records) {
      expect(r.subjectRef).toMatch(/^SUBJ-\d{4}$/);
      // No patient-identifying fields leak into the analyst view.
      expect(r).not.toHaveProperty('fields');
      expect(JSON.stringify(r)).not.toMatch(/firstName|lastName|phone|nationalId/);
    }
  });

  it('filters records by category', async () => {
    const htn = await analyticsService.records({ categoryId: 'c-htn' });
    expect(htn.length).toBeGreaterThan(0);
    expect(htn.every((r) => r.categoryId === 'c-htn')).toBe(true);
  });

  it('suppresses measurement summaries computed on too-few records (privacy)', async () => {
    const stats = await analyticsService.statistics({});
    expect(stats.suppressedBelow).toBe(MIN_CELL);
    for (const s of stats.measurementSummaries) {
      expect(s.count).toBeGreaterThanOrEqual(MIN_CELL);
      expect(s.max).toBeGreaterThanOrEqual(s.min);
    }
  });
});
