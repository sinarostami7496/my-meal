import type { MacroTarget } from '@/types/meal';

export function calculateCaloriesFromMacros(protein: number, carbs: number, fat: number): number {
  return Math.round(protein * 4 + carbs * 4 + fat * 9);
}

export function scaleMacros(
  planned: MacroTarget,
  servings: number,
): MacroTarget {
  return {
    calories: Math.round(planned.calories * servings),
    protein: Math.round(planned.protein * servings * 10) / 10,
    carbs: Math.round(planned.carbs * servings * 10) / 10,
    fat: Math.round(planned.fat * servings * 10) / 10,
  };
}

export function sumMacros(items: MacroTarget[]): MacroTarget {
  return items.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}
