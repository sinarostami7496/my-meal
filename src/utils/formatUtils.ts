import { format as formatJalali } from 'date-fns-jalali/format';
import { parseIsoDate } from '@/utils/dateUtils';

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

export function toPersianDigits(value: string | number, usePersian = true): string {
  const s = String(value);
  if (!usePersian) return s;
  return s.replace(/\d/g, (d) => FA_DIGITS[parseInt(d, 10)] ?? d);
}

export function formatPersianNumber(n: number, usePersian = true, decimals = 0): string {
  const formatted =
    decimals > 0
      ? n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
      : Math.round(n).toLocaleString('en-US');
  return toPersianDigits(formatted, usePersian);
}

export function formatPersianDate(iso: string, pattern = 'EEEE d MMMM yyyy'): string {
  try {
    return formatJalali(parseIsoDate(iso), pattern);
  } catch {
    return iso;
  }
}

export function formatTime24(time: string, usePersian = true): string {
  return toPersianDigits(time, usePersian);
}
