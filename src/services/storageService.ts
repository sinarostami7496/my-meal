import { defaultMealPlan } from '@/data/mealPlan';
import { APP_VERSION, defaultSettings, defaultUserProfile } from '@/data/seedData';
import type { DailySelections, Meal, MealLog, MealPlanData } from '@/types/meal';
import type { AppSettings, UserProfile } from '@/types/user';
import type { WeightEntry } from '@/types/weight';

export const STORAGE_KEYS = {
  userProfile: 'cleanBulk:userProfile',
  mealPlan: 'cleanBulk:mealPlan',
  dailyMealSelections: 'cleanBulk:dailyMealSelections',
  mealLogs: 'cleanBulk:mealLogs',
  customMeals: 'cleanBulk:customMeals',
  weightEntries: 'cleanBulk:weightEntries',
  settings: 'cleanBulk:settings',
  appVersion: 'cleanBulk:appVersion',
} as const;

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function initializeStorage(): void {
  const version = readJson<number>(STORAGE_KEYS.appVersion);
  if (version === null) {
    writeJson(STORAGE_KEYS.appVersion, APP_VERSION);
  }
  if (!readJson(STORAGE_KEYS.mealPlan)) {
    writeJson(STORAGE_KEYS.mealPlan, defaultMealPlan);
  }
  if (!readJson(STORAGE_KEYS.userProfile)) {
    writeJson(STORAGE_KEYS.userProfile, defaultUserProfile);
  }
  if (!readJson(STORAGE_KEYS.settings)) {
    writeJson(STORAGE_KEYS.settings, defaultSettings);
  }
  if (!readJson(STORAGE_KEYS.dailyMealSelections)) {
    writeJson(STORAGE_KEYS.dailyMealSelections, {});
  }
  if (!readJson(STORAGE_KEYS.mealLogs)) {
    writeJson(STORAGE_KEYS.mealLogs, []);
  }
  if (!readJson(STORAGE_KEYS.customMeals)) {
    writeJson(STORAGE_KEYS.customMeals, []);
  }
  if (!readJson(STORAGE_KEYS.weightEntries)) {
    writeJson(STORAGE_KEYS.weightEntries, []);
  }
}

export function getMealPlan(): MealPlanData {
  return readJson<MealPlanData>(STORAGE_KEYS.mealPlan) ?? defaultMealPlan;
}

export function setMealPlan(data: MealPlanData): void {
  writeJson(STORAGE_KEYS.mealPlan, data);
}

export function resetMealPlanToSeed(): void {
  writeJson(STORAGE_KEYS.mealPlan, defaultMealPlan);
}

export function getUserProfile(): UserProfile {
  return readJson<UserProfile>(STORAGE_KEYS.userProfile) ?? defaultUserProfile;
}

export function setUserProfile(profile: UserProfile): void {
  writeJson(STORAGE_KEYS.userProfile, profile);
}

export function getSettings(): AppSettings {
  return readJson<AppSettings>(STORAGE_KEYS.settings) ?? defaultSettings;
}

export function setSettings(settings: AppSettings): void {
  writeJson(STORAGE_KEYS.settings, settings);
}

export function getDailySelections(): DailySelections {
  return readJson<DailySelections>(STORAGE_KEYS.dailyMealSelections) ?? {};
}

export function setDailySelections(selections: DailySelections): void {
  writeJson(STORAGE_KEYS.dailyMealSelections, selections);
}

export function clearDailySelections(fromDate?: string): void {
  const all = getDailySelections();
  if (!fromDate) {
    setDailySelections({});
    return;
  }
  const next: DailySelections = {};
  for (const [date, slots] of Object.entries(all)) {
    if (date < fromDate) next[date] = slots;
  }
  setDailySelections(next);
}

export function getMealLogs(): MealLog[] {
  return readJson<MealLog[]>(STORAGE_KEYS.mealLogs) ?? [];
}

export function setMealLogs(logs: MealLog[]): void {
  writeJson(STORAGE_KEYS.mealLogs, logs);
}

export function getCustomMeals(): Meal[] {
  return readJson<Meal[]>(STORAGE_KEYS.customMeals) ?? [];
}

export function setCustomMeals(meals: Meal[]): void {
  writeJson(STORAGE_KEYS.customMeals, meals);
}

export function getWeightEntries(): WeightEntry[] {
  return readJson<WeightEntry[]>(STORAGE_KEYS.weightEntries) ?? [];
}

export function setWeightEntries(entries: WeightEntry[]): void {
  writeJson(STORAGE_KEYS.weightEntries, entries);
}

export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  initializeStorage();
}

export interface AppBackup {
  version: number;
  exportedAt: string;
  userProfile: UserProfile;
  mealPlan: MealPlanData;
  dailyMealSelections: DailySelections;
  mealLogs: MealLog[];
  customMeals: Meal[];
  weightEntries: WeightEntry[];
  settings: AppSettings;
}

export function exportBackup(): AppBackup {
  return {
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    userProfile: getUserProfile(),
    mealPlan: getMealPlan(),
    dailyMealSelections: getDailySelections(),
    mealLogs: getMealLogs(),
    customMeals: getCustomMeals(),
    weightEntries: getWeightEntries(),
    settings: getSettings(),
  };
}

export function importBackup(data: AppBackup): void {
  setUserProfile(data.userProfile);
  setMealPlan(data.mealPlan);
  setDailySelections(data.dailyMealSelections ?? {});
  setMealLogs(data.mealLogs ?? []);
  setCustomMeals(data.customMeals ?? []);
  setWeightEntries(data.weightEntries ?? []);
  setSettings(data.settings ?? defaultSettings);
  writeJson(STORAGE_KEYS.appVersion, APP_VERSION);
}
