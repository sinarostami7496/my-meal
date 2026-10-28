import type { WeekDay } from '@/types/user';

const JS_TO_WEEKDAY: Record<number, WeekDay> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

export const WEEKDAY_LABELS: Record<WeekDay, string> = {
  saturday: 'شنبه',
  sunday: 'یکشنبه',
  monday: 'دوشنبه',
  tuesday: 'سه\u200cشنبه',
  wednesday: 'چهارشنبه',
  thursday: 'پنج\u200cشنبه',
  friday: 'جمعه',
};

export function toIsoDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getWeekdayFromDate(date: Date): WeekDay {
  return JS_TO_WEEKDAY[date.getDay()];
}

export function getWeekdayFromIso(iso: string): WeekDay {
  return getWeekdayFromDate(parseIsoDate(iso));
}

export function addDays(iso: string, days: number): string {
  const d = parseIsoDate(iso);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

export function compareTime(a: string, b: string): number {
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  return ah * 60 + am - (bh * 60 + bm);
}

export function isoDateInRange(iso: string, start: string, end: string): boolean {
  return iso >= start && iso <= end;
}

export function getDateRangeDays(start: string, end: string): string[] {
  const days: string[] = [];
  let cur = start;
  while (cur <= end) {
    days.push(cur);
    cur = addDays(cur, 1);
  }
  return days;
}

/** نزدیک\u200cترین تاریخ همان weekday در هفته جاری (شنبه شروع) */
export function getReferenceDateForWeekday(weekday: WeekDay, base = new Date()): string {
  const target = Object.entries(JS_TO_WEEKDAY).find(([, w]) => w === weekday)?.[0];
  const targetDay = target ? parseInt(target, 10) : 6;
  const d = new Date(base);
  const diff = targetDay - d.getDay();
  d.setDate(d.getDate() + diff);
  return toIsoDate(d);
}
