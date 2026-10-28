import { usePersianDigits } from '@/context/AppContext';
import { formatPersianNumber } from '@/utils/formatUtils';

export function PersianNumber({
  value,
  decimals = 0,
}: {
  value: number;
  decimals?: number;
}) {
  const fa = usePersianDigits();
  return <>{formatPersianNumber(value, fa, decimals)}</>;
}
