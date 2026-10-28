import { Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IngredientList } from '@/components/meals/IngredientList';
import { MacroSummary } from '@/components/meals/MacroSummary';
import { MealOptionSelector } from '@/components/meals/MealOptionSelector';
import { MealStatusBadge } from '@/components/meals/MealStatusBadge';
import { PersianNumber } from '@/components/common/PersianNumber';
import type { MealDisplayStatus, MealLog, PlannedMeal } from '@/types/meal';
import { formatTime24 } from '@/utils/formatUtils';
import { usePersianDigits } from '@/context/AppContext';
import { cn } from '@/lib/utils';

export function MealCard({
  meal,
  status,
  log,
  onConsume,
  onSkip,
  onUndo,
  onServingsChange,
  onOptionChange,
}: {
  meal: PlannedMeal;
  status: MealDisplayStatus;
  log?: MealLog;
  onConsume: (servings: number) => void;
  onSkip: () => void;
  onUndo: () => void;
  onServingsChange: (servings: number) => void;
  onOptionChange: (index: number) => void;
}) {
  const fa = usePersianDigits();
  const highlight =
    status === 'current' || status === 'upcoming'
      ? 'ring-2 ring-primary/40'
      : status === 'missed'
        ? 'border-orange-300 bg-orange-50/50'
        : status === 'consumed'
          ? 'opacity-75'
          : '';

  return (
    <Card className={cn(highlight, status === 'consumed' && 'border-green-200')}>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <p className="text-xs text-slate-500">{formatTime24(meal.scheduledTime, fa)}</p>
          <CardTitle className="text-base">{meal.title}</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {status === 'consumed' && <Check className="h-5 w-5 text-green-600" />}
          <MealStatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <IngredientList ingredients={meal.ingredients} textFallback={meal.ingredientsText} />
        <MacroSummary
          calories={meal.calories}
          protein={meal.protein}
          carbs={meal.carbs}
          fat={meal.fat}
          label="برنامه"
        />
        <MealOptionSelector
          options={meal.options}
          selectedIndex={meal.optionIndex}
          onSelect={onOptionChange}
        />
        {!log?.consumed && !log?.skipped && (
          <div className="flex flex-wrap gap-2">
            {[0.5, 1, 1.5, 2].map((s) => (
              <Button key={s} size="sm" variant="secondary" onClick={() => onConsume(s)}>
                ثبت ×<PersianNumber value={s} decimals={1} />
              </Button>
            ))}
            <Button size="sm" variant="outline" onClick={onSkip}>
              رد کردن
            </Button>
          </div>
        )}
        {log?.consumed && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>
              ثبت شده با <PersianNumber value={log.servings} decimals={1} /> سروینگ
            </span>
            {[0.5, 1, 1.5, 2].map((s) => (
              <Button key={s} size="sm" variant="ghost" onClick={() => onServingsChange(s)}>
                <RotateCcw className="h-3 w-3" />
                <PersianNumber value={s} decimals={1} />
              </Button>
            ))}
            <Button size="sm" variant="outline" onClick={onUndo}>
              لغو ثبت
            </Button>
          </div>
        )}
        {log?.skipped && (
          <Button size="sm" variant="outline" onClick={onUndo}>
            بازگردانی
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
