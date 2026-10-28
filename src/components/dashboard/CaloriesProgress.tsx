import { Progress } from '@/components/ui/progress';
import { PersianNumber } from '@/components/common/PersianNumber';

export function CaloriesProgress({
  consumed,
  target,
}: {
  consumed: number;
  target: number;
}) {
  const remaining = target - consumed;
  const pct = target > 0 ? (consumed / target) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-sm text-slate-500">کالری مصرف‌شده</p>
          <p className="text-3xl font-bold text-calorie">
            <PersianNumber value={consumed} />
          </p>
        </div>
        <div className="text-left">
          <p className="text-sm text-slate-500">هدف</p>
          <p className="text-lg font-semibold">
            <PersianNumber value={target} />
          </p>
        </div>
      </div>
      <Progress value={pct} indicatorClassName="bg-calorie" />
      <p className="text-sm text-slate-600">
        {remaining >= 0 ? (
          <>
            باقی‌مانده: <PersianNumber value={remaining} /> کیلوکالری
          </>
        ) : (
          <span className="text-warning">
            از هدف <PersianNumber value={Math.abs(remaining)} /> کیلوکالری بیشتر مصرف شده
          </span>
        )}
      </p>
    </div>
  );
}
