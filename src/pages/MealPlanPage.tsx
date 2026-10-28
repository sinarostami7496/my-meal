import { useMemo, useState } from 'react';
import { Copy, Printer, Shuffle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { PersianNumber } from '@/components/common/PersianNumber';
import { IngredientList } from '@/components/meals/IngredientList';
import { MacroSummary } from '@/components/meals/MacroSummary';
import { MealOptionSelector } from '@/components/meals/MealOptionSelector';
import { useApp } from '@/context/AppContext';
import { useDayPlan } from '@/hooks/useToday';
import { WEEKDAY_LABELS, getReferenceDateForWeekday } from '@/utils/dateUtils';
import { calculatePlannedMacros, weekdayOrder } from '@/utils/mealUtils';
import type { WeekDay } from '@/types/user';
import { formatPersianDate } from '@/utils/formatUtils';

export function MealPlanPage() {
  const { mealPlan, changeDailyOption, rerollDay } = useApp();
  const [tab, setTab] = useState<WeekDay>('saturday');
  const [confirmReroll, setConfirmReroll] = useState(false);

  const iso = useMemo(() => getReferenceDateForWeekday(tab), [tab]);
  const { meals, summary } = useDayPlan(iso);
  const planned = calculatePlannedMacros(meals);
  const copyDay = async () => {
    const text = meals
      .map(
        (m) =>
          `${m.scheduledTime} — ${m.title}\n${m.ingredientsText}\nکالری: ${m.calories}`,
      )
      .join('\n\n');
    await navigator.clipboard.writeText(text);
    toast.success('برنامه روز کپی شد');
  };

  return (
    <div className="print-area">
      <PageHeader
        title="برنامه غذایی هفتگی"
        subtitle={formatPersianDate(iso)}
        action={
          <div className="flex flex-wrap gap-2 no-print">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> چاپ
            </Button>
            <Button variant="outline" size="sm" onClick={copyDay}>
              <Copy className="h-4 w-4" /> کپی روز
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setConfirmReroll(true)}>
              <Shuffle className="h-4 w-4" /> انتخاب مجدد تصادفی
            </Button>
          </div>
        }
      />

      <div className="no-print flex flex-wrap gap-2 mt-2">
        {weekdayOrder().map((wd) => (
          <Button
            key={wd}
            size="sm"
            variant={tab === wd ? 'default' : 'outline'}
            onClick={() => setTab(wd)}
          >
            {WEEKDAY_LABELS[wd]}
          </Button>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            summary.dayType === 'training' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100'
          }`}
        >
          {summary.dayType === 'training' ? 'روز تمرین' : 'روز استراحت'}
        </span>
        <span className="text-xs text-slate-500">
          تاریخ نمایش: {formatPersianDate(iso)}
        </span>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>جمع ماکرو روز</CardTitle>
        </CardHeader>
        <CardContent>
          <MacroSummary {...planned} />
          <p className="mt-2 text-sm text-slate-500">
            هدف کالری:{' '}
            <PersianNumber
              value={
                summary.dayType === 'training'
                  ? mealPlan.calculations.trainingDayTarget.calories
                  : mealPlan.calculations.restDayTarget.calories
              }
            />
          </p>
        </CardContent>
      </Card>

      <div className="mt-6 space-y-4">
        {meals.map((meal) => (
          <Card key={meal.slotKey}>
            <CardHeader>
              <CardTitle className="text-base">
                {meal.scheduledTime} — {meal.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <IngredientList ingredients={meal.ingredients} textFallback={meal.ingredientsText} />
              <MacroSummary
                calories={meal.calories}
                protein={meal.protein}
                carbs={meal.carbs}
                fat={meal.fat}
              />
              <MealOptionSelector
                options={meal.options}
                selectedIndex={meal.optionIndex}
                onSelect={(idx) => {
                  changeDailyOption(iso, meal.slotKey, idx);
                  toast.success('گزینه به‌روز شد');
                }}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8 border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="text-base">راهنمای کبد چرب</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
            {mealPlan.fattyLiverNotes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmReroll}
        title="انتخاب مجدد تصادفی"
        description="گزینه‌های تصادفی این روز دوباره ساخته می‌شوند. ادامه می‌دهید؟"
        onCancel={() => setConfirmReroll(false)}
        onConfirm={() => {
          rerollDay(iso);
          setConfirmReroll(false);
          toast.success('گزینه‌های جدید انتخاب شد');
        }}
      />
    </div>
  );
}
