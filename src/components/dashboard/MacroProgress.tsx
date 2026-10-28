import { Progress } from '@/components/ui/progress';
import { PersianNumber } from '@/components/common/PersianNumber';

export function MacroProgress({
  label,
  consumed,
  target,
  colorClass,
}: {
  label: string;
  consumed: number;
  target: number;
  colorClass?: string;
}) {
  const pct = target > 0 ? (consumed / target) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium">
          <PersianNumber value={consumed} decimals={1} />
          {' / '}
          <PersianNumber value={target} decimals={0} />
          <span className="text-slate-400 text-xs mr-1">گرم</span>
        </span>
      </div>
      <Progress value={pct} indicatorClassName={colorClass} />
    </div>
  );
}
