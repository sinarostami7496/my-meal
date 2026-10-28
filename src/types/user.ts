import type { MacroTarget } from '@/types/meal';

export type WeekDay =
  | 'saturday'
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday';

export type Gender = 'male' | 'female';

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  heightCm: number;
  initialWeightKg: number;
  currentWeightKg?: number;
  trainingDays: WeekDay[];
  workoutStartTime: string;
  workoutEndTime: string;
  trainingDayTarget: MacroTarget;
  restDayTarget: MacroTarget;
}

export interface AppSettings {
  usePersianDigits: boolean;
  allowMultipleWeightLogsPerDay: boolean;
  mealTimes: Record<string, string>;
}

export const DEFAULT_TRAINING_DAYS: WeekDay[] = [
  'saturday',
  'sunday',
  'tuesday',
  'wednesday',
];
