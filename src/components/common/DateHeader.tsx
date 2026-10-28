import { usePersianDigits } from '@/context/AppContext';
import { formatPersianDate } from '@/utils/formatUtils';
import { toIsoDate } from '@/utils/dateUtils';

export function DateHeader({ date = toIsoDate() }: { date?: string }) {
  const fa = usePersianDigits();
  return (
    <p className="text-sm text-slate-600">
      {formatPersianDate(date, fa ? 'EEEE d MMMM yyyy' : 'EEEE d MMMM yyyy')}
    </p>
  );
}
