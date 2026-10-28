import { useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { toIsoDate } from '@/utils/dateUtils';
import {
  calculateDailySummary,
  findLogForMeal,
  getMealStatus,
  getNextMeal,
  getPlannedMealsForDate,
} from '@/utils/mealUtils';
import type { MealDisplayStatus } from '@/types/meal';

export function useDayPlan(iso: string) {
  const {
    mealPlan,
    userProfile,
    dailySelections,
    mealLogs,
    ensureDateSelections,
  } = useApp();

  useEffect(() => {
    ensureDateSelections(iso);
  }, [iso, ensureDateSelections]);

  const meals = useMemo(
    () => getPlannedMealsForDate(iso, mealPlan, dailySelections),
    [iso, mealPlan, dailySelections],
  );

  const summary = useMemo(
    () => calculateDailySummary(iso, mealPlan, userProfile, dailySelections, mealLogs),
    [iso, mealPlan, userProfile, dailySelections, mealLogs],
  );

  const nextMeal = useMemo(
    () => getNextMeal(meals, mealLogs, iso),
    [meals, mealLogs, iso],
  );

  const statuses = useMemo(() => {
    const map = new Map<string, MealDisplayStatus>();
    for (const meal of meals) {
      const log = findLogForMeal(mealLogs, iso, meal.slotKey);
      let status = getMealStatus(meal, log);
      if (nextMeal?.slotKey === meal.slotKey && status === 'pending') status = 'upcoming';
      map.set(meal.slotKey, status);
    }
    return map;
  }, [meals, mealLogs, iso, nextMeal]);

  return { meals, summary, nextMeal, statuses, mealLogs };
}

export function useToday() {
  return useDayPlan(toIsoDate());
}
