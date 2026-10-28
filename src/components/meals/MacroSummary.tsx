import { PersianNumber } from '@/components/common/PersianNumber';

export function MacroSummary({
  calories,
  protein,
  carbs,
  fat,
  label = 'جمع',
}: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  label?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
      <div>
        <p className="text-slate-500">{label} کالری</p>
        <p className="font-semibold text-calorie">
          <PersianNumber value={calories} />
        </p>
      </div>
      <div>
        <p className="text-slate-500">پروتئین</p>
        <p className="font-semibold text-protein">
          <PersianNumber value={protein} decimals={1} />g
        </p>
      </div>
      <div>
        <p className="text-slate-500">کربوهیدرات</p>
        <p className="font-semibold text-carbs">
          <PersianNumber value={carbs} decimals={1} />g
        </p>
      </div>
      <div>
        <p className="text-slate-500">چربی</p>
        <p className="font-semibold text-fat">
          <PersianNumber value={fat} decimals={1} />g
        </p>
      </div>
    </div>
  );
}
