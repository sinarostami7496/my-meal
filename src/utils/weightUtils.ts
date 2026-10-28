import type { WeightEntry } from '@/types/weight';
import { addDays, toIsoDate } from '@/utils/dateUtils';

export function getLatestWeight(entries: WeightEntry[]): WeightEntry | undefined {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))[0];
}

export function getWeightChange(
  entries: WeightEntry[],
  referenceDate?: string,
): { delta: number; from?: number; to?: number } {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) return { delta: 0 };
  const latest = sorted[sorted.length - 1];
  const first = sorted[0];
  if (referenceDate) {
    const ref = sorted.filter((e) => e.date <= referenceDate).pop();
    if (ref) return { delta: latest.weightKg - ref.weightKg, from: ref.weightKg, to: latest.weightKg };
  }
  return { delta: latest.weightKg - first.weightKg, from: first.weightKg, to: latest.weightKg };
}

export function getWeeklyWeightChange(entries: WeightEntry[]): number {
  const weekAgo = addDays(toIsoDate(), -7);
  return getWeightChange(entries, weekAgo).delta;
}

export function weeklyAverageWeight(entries: WeightEntry[], endIso: string): number | null {
  const start = addDays(endIso, -6);
  const inRange = entries.filter((e) => e.date >= start && e.date <= endIso);
  if (!inRange.length) return null;
  return inRange.reduce((s, e) => s + e.weightKg, 0) / inRange.length;
}
