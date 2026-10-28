import type {
  DailySelections,
  DailySummary,
  DayType,
  MealDisplayStatus,
  MealLog,
  MealPlanData,
  MealSlotTemplate,
  PlannedMeal,
} from '@/types/meal';
import type { UserProfile, WeekDay } from '@/types/user';
import { compareTime, getDateRangeDays, getWeekdayFromIso, toIsoDate } from '@/utils/dateUtils';
import { scaleMacros, sumMacros } from '@/utils/macroUtils';

function randomOptionIndex(): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % 3;
}

export function getDayType(iso: string, mealPlan: MealPlanData, profile: UserProfile): DayType {
  const wd = getWeekdayFromIso(iso);
  const meta = mealPlan.weekdayMeta[wd];
  if (meta) return meta.dayType;
  return profile.trainingDays.includes(wd) ? 'training' : 'rest';
}

export function getDailyTarget(
  iso: string,
  mealPlan: MealPlanData,
  profile: UserProfile,
): { dayType: DayType; target: typeof profile.trainingDayTarget } {
  const dayType = getDayType(iso, mealPlan, profile);
  const target =
    dayType === 'training'
      ? { ...profile.trainingDayTarget, ...mealPlan.calculations.trainingDayTarget }
      : { ...profile.restDayTarget, ...mealPlan.calculations.restDayTarget };
  return { dayType, target };
}

export function getOrderedSlots(mealPlan: MealPlanData, iso: string): MealSlotTemplate[] {
  const wd = getWeekdayFromIso(iso);
  const meta = mealPlan.weekdayMeta[wd];
  if (meta?.slots.length) {
    return meta.slots
      .map((s) => mealPlan.slotTemplates.find((t) => t.slotKey === s.slotKey))
      .filter((t): t is MealSlotTemplate => !!t);
  }
  return [...mealPlan.slotTemplates].sort((a, b) =>
    a.scheduledTime.localeCompare(b.scheduledTime),
  );
}

export function ensureDailySelections(
  iso: string,
  mealPlan: MealPlanData,
  selections: DailySelections,
): DailySelections {
  const next = { ...selections };
  if (!next[iso]) next[iso] = {};
  const slots = getOrderedSlots(mealPlan, iso);
  let changed = false;
  for (const slot of slots) {
    if (next[iso][slot.slotKey] === undefined) {
      next[iso][slot.slotKey] = randomOptionIndex();
      changed = true;
    }
  }
  return changed ? next : selections;
}

export function rerollDailySelections(
  iso: string,
  mealPlan: MealPlanData,
  selections: DailySelections,
): DailySelections {
  const dayMap: Record<string, number> = {};
  const slots = getOrderedSlots(mealPlan, iso);
  for (const slot of slots) {
    dayMap[slot.slotKey] = randomOptionIndex();
  }
  return { ...selections, [iso]: dayMap };
}

export function setDailyOption(
  selections: DailySelections,
  iso: string,
  slotKey: string,
  optionIndex: number,
): DailySelections {
  return {
    ...selections,
    [iso]: {
      ...selections[iso],
      [slotKey]: optionIndex,
    },
  };
}

export function getPlannedMealsForDate(
  iso: string,
  mealPlan: MealPlanData,
  selections: DailySelections,
): PlannedMeal[] {
  const wd = getWeekdayFromIso(iso);
  const daySelections = selections[iso] ?? {};
  const slots = getOrderedSlots(mealPlan, iso);
  return slots.map((slot) => {
    const optIdx = Math.min(
      Math.max(daySelections[slot.slotKey] ?? 0, 0),
      slot.options.length - 1,
    );
    const option = slot.options[optIdx] ?? slot.options[0];
    return {
      id: option.id,
      slotKey: slot.slotKey,
      date: iso,
      weekday: wd,
      title: slot.title,
      category: slot.category as PlannedMeal['category'],
      scheduledTime: slot.scheduledTime,
      optionIndex: optIdx,
      ingredients: option.ingredients,
      ingredientsText: option.ingredientsText,
      calories: option.calories,
      protein: option.protein,
      carbs: option.carbs,
      fat: option.fat,
      options: slot.options,
    };
  });
}

export function findLogForMeal(logs: MealLog[], date: string, slotKey: string): MealLog | undefined {
  return logs.find((l) => l.date === date && l.slotKey === slotKey);
}

export function getMealStatus(
  meal: PlannedMeal,
  log: MealLog | undefined,
  now: Date = new Date(),
): MealDisplayStatus {
  if (log?.consumed) return 'consumed';
  if (log?.skipped) return 'skipped';
  const todayIso = toIsoDate(now);
  const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  if (meal.date < todayIso) return 'missed';
  if (meal.date > todayIso) return 'pending';
  const cmp = compareTime(nowTime, meal.scheduledTime);
  if (cmp > 60) return 'missed';
  if (cmp >= -15 && cmp <= 60) return 'current';
  if (cmp < -15) return 'pending';
  return 'pending';
}

export function getNextMeal(
  meals: PlannedMeal[],
  logs: MealLog[],
  date: string,
  now: Date = new Date(),
): PlannedMeal | null {
  const todayIso = toIsoDate(now);
  const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  if (date !== todayIso) return meals[0] ?? null;
  for (const meal of meals) {
    const log = findLogForMeal(logs, date, meal.slotKey);
    if (log?.consumed || log?.skipped) continue;
    if (compareTime(meal.scheduledTime, nowTime) >= -15) return meal;
  }
  return null;
}

export function calculateConsumedMacros(logs: MealLog[], date: string) {
  const dayLogs = logs.filter((l) => l.date === date && l.consumed && !l.skipped);
  return sumMacros(
    dayLogs.map((l) => ({
      calories: l.actualCalories,
      protein: l.actualProtein,
      carbs: l.actualCarbs,
      fat: l.actualFat,
    })),
  );
}

export function calculatePlannedMacros(meals: PlannedMeal[]) {
  return sumMacros(
    meals.map((m) => ({
      calories: m.calories,
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
    })),
  );
}

export function calculateDailySummary(
  iso: string,
  mealPlan: MealPlanData,
  profile: UserProfile,
  selections: DailySelections,
  logs: MealLog[],
): DailySummary {
  const { dayType, target } = getDailyTarget(iso, mealPlan, profile);
  const meals = getPlannedMealsForDate(iso, mealPlan, selections);
  const consumed = calculateConsumedMacros(logs, iso);
  const planned = calculatePlannedMacros(meals);
  const completedMeals = meals.filter((m) => {
    const log = findLogForMeal(logs, iso, m.slotKey);
    return log?.consumed && !log.skipped;
  }).length;
  return {
    date: iso,
    dayType,
    targetCalories: target.calories,
    consumedCalories: consumed.calories,
    targetProtein: target.protein,
    consumedProtein: consumed.protein,
    targetCarbs: target.carbs,
    consumedCarbs: consumed.carbs,
    targetFat: target.fat,
    consumedFat: consumed.fat,
    plannedCalories: planned.calories,
    completedMeals,
    totalMeals: meals.length,
  };
}

export function createMealLogFromPlanned(
  meal: PlannedMeal,
  servings: number,
  notes?: string,
): Omit<MealLog, 'id'> {
  const scaled = scaleMacros(
    {
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
    },
    servings,
  );
  return {
    mealId: meal.id,
    slotKey: meal.slotKey,
    date: meal.date,
    servings,
    consumed: true,
    consumedAt: new Date().toISOString(),
    actualCalories: scaled.calories,
    actualProtein: scaled.protein,
    actualCarbs: scaled.carbs,
    actualFat: scaled.fat,
    notes,
  };
}

export function calculateWeeklySummary(
  startDate: string,
  endDate: string,
  mealPlan: MealPlanData,
  profile: UserProfile,
  selections: DailySelections,
  logs: MealLog[],
) {
  const days = getDateRangeDays(startDate, endDate);
  return days.map((date) => {
    const summary = calculateDailySummary(date, mealPlan, profile, selections, logs);
    const adherence =
      summary.targetCalories > 0
        ? Math.min(100, Math.round((summary.consumedCalories / summary.targetCalories) * 100))
        : 0;
    return { ...summary, adherencePercent: adherence };
  });
}

export function getCountdownToMeal(scheduledTime: string, now: Date = new Date()): number | null {
  const [h, m] = scheduledTime.split(':').map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  const diff = target.getTime() - now.getTime();
  if (diff < 0) return null;
  return Math.floor(diff / 1000);
}

export function weekdayOrder(): WeekDay[] {
  return ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
}
