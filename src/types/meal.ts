import type { WeekDay } from '@/types/user';

export type MealCategory =
  | 'preworkout'
  | 'breakfast'
  | 'snack1'
  | 'lunch'
  | 'snack2'
  | 'dinner'
  | 'bedtime'
  | 'custom';

export type DayType = 'training' | 'rest';

export interface MacroTarget {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface MealOption {
  id: string;
  optionIndex: number;
  label: string;
  ingredients: Ingredient[];
  ingredientsText: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

export interface MealSlotTemplate {
  slotKey: string;
  title: string;
  scheduledTime: string;
  category: string;
  options: MealOption[];
}

export interface WeekdayMeta {
  weekday: WeekDay;
  dayType: DayType;
  slots: { slotKey: string; title: string; scheduledTime: string }[];
}

export interface MealPlanCalculations {
  bmr: number;
  tdee: number;
  trainingDayTarget: MacroTarget;
  restDayTarget: MacroTarget;
}

export interface MealPlanData {
  version: number;
  importedAt: string;
  sourceFileName: string;
  calculations: MealPlanCalculations;
  slotTemplates: MealSlotTemplate[];
  weekdayMeta: Partial<Record<WeekDay, WeekdayMeta>>;
  fattyLiverNotes: string[];
}

export interface PlannedMeal {
  id: string;
  slotKey: string;
  date: string;
  weekday: WeekDay;
  title: string;
  category: MealCategory;
  scheduledTime: string;
  optionIndex: number;
  ingredients: Ingredient[];
  ingredientsText: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  options: MealOption[];
}

export interface Meal {
  id: string;
  date?: string;
  weekday?: WeekDay;
  title: string;
  category: MealCategory;
  scheduledTime: string;
  ingredients: Ingredient[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
  isCustom: boolean;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MealLogStatus = 'consumed' | 'skipped' | 'pending';

export interface MealLog {
  id: string;
  mealId: string;
  slotKey: string;
  date: string;
  servings: number;
  consumed: boolean;
  skipped?: boolean;
  consumedAt?: string;
  actualCalories: number;
  actualProtein: number;
  actualCarbs: number;
  actualFat: number;
  notes?: string;
}

export type DailySelections = Record<string, Record<string, number>>;

export interface DailySummary {
  date: string;
  dayType: DayType;
  targetCalories: number;
  consumedCalories: number;
  targetProtein: number;
  consumedProtein: number;
  targetCarbs: number;
  consumedCarbs: number;
  targetFat: number;
  consumedFat: number;
  plannedCalories: number;
  completedMeals: number;
  totalMeals: number;
}

export type MealDisplayStatus =
  | 'pending'
  | 'upcoming'
  | 'current'
  | 'consumed'
  | 'skipped'
  | 'missed';
