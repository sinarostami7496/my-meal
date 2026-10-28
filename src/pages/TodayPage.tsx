import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { DateHeader } from '@/components/common/DateHeader';
import { PageHeader } from '@/components/common/PageHeader';
import { MealCard } from '@/components/meals/MealCard';
import { MacroSummary } from '@/components/meals/MacroSummary';
import { generateId, useApp } from '@/context/AppContext';
import { useToday } from '@/hooks/useToday';
import { toIsoDate, addDays } from '@/utils/dateUtils';
import {
  calculatePlannedMacros,
  createMealLogFromPlanned,
  findLogForMeal,
} from '@/utils/mealUtils';
import type { MealLog } from '@/types/meal';

export function TodayPage() {
  const today = toIsoDate();
  const {
    changeDailyOption,
    upsertMealLog,
    removeMealLog,
  } = useApp();
  const { meals, summary, statuses, mealLogs } = useToday();
  const [search, setSearch] = useState('');

  const planned = calculatePlannedMacros(meals);
  const filtered = meals.filter(
    (m) =>
      !search ||
      m.title.includes(search) ||
      m.ingredientsText.includes(search),
  );

  const allDone = meals.every((m) => {
    const log = findLogForMeal(mealLogs, today, m.slotKey);
    return log?.consumed || log?.skipped;
  });

  const handleConsume = (meal: (typeof meals)[0], servings: number) => {
    const base = createMealLogFromPlanned(meal, servings);
    const existing = findLogForMeal(mealLogs, today, meal.slotKey);
    const log: MealLog = {
      ...base,
      id: existing?.id ?? generateId('log'),
    };
    upsertMealLog(log);
    toast.success('وعده ثبت شد');
  };

  const handleSkip = (slotKey: string) => {
    const existing = findLogForMeal(mealLogs, today, slotKey);
    upsertMealLog({
      id: existing?.id ?? generateId('log'),
      mealId: '',
      slotKey,
      date: today,
      servings: 0,
      consumed: false,
      skipped: true,
      actualCalories: 0,
      actualProtein: 0,
      actualCarbs: 0,
      actualFat: 0,
    });
    toast.message('وعده رد شد');
  };

  return (
    <div>
      <PageHeader title="برنامه امروز" subtitle="وعده‌ها بر اساس ساعت سیستم" />
      <DateHeader date={today} />

      <input
        className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        placeholder="جستجوی وعده..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {allDone && (
        <Card className="mt-4 border-green-200 bg-green-50">
          <CardContent className="py-4 text-center text-green-800 font-medium">
            برنامه امروز کامل شده است
          </CardContent>
        </Card>
      )}

      <div className="mt-6 space-y-4">
        {filtered.map((meal) => {
          const log = findLogForMeal(mealLogs, today, meal.slotKey);
          const status = statuses.get(meal.slotKey) ?? 'pending';
          return (
            <MealCard
              key={meal.slotKey}
              meal={meal}
              status={status}
              log={log}
              onConsume={(s) => handleConsume(meal, s)}
              onSkip={() => handleSkip(meal.slotKey)}
              onUndo={() => log && removeMealLog(log.id)}
              onServingsChange={(s) => handleConsume(meal, s)}
              onOptionChange={(idx) => {
                changeDailyOption(today, meal.slotKey, idx);
                toast.success('گزینه وعده تغییر کرد');
              }}
            />
          );
        })}
      </div>

      <Card className="mt-8 sticky bottom-20 md:bottom-4">
        <CardContent className="py-4 space-y-4">
          <p className="font-semibold">مجموع مصرف واقعی امروز</p>
          <MacroSummary
            calories={summary.consumedCalories}
            protein={summary.consumedProtein}
            carbs={summary.consumedCarbs}
            fat={summary.consumedFat}
            label="مصرف"
          />
          <p className="text-sm text-slate-500 border-t pt-3">برنامه‌ریزی‌شده (گزینه‌های انتخابی)</p>
          <MacroSummary {...planned} label="برنامه" />
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-slate-400">
        فردا: اولین وعده در {addDays(today, 1)} — از صفحه برنامه غذایی قابل مشاهده است.
      </p>
    </div>
  );
}
