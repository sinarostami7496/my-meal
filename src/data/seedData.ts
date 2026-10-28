import { defaultMealPlan } from '@/data/mealPlan';
import type { AppSettings, UserProfile } from '@/types/user';

export const APP_VERSION = 1;

export const defaultUserProfile: UserProfile = {
  id: 'user-1',
  name: 'ورزشکار',
  age: 30,
  gender: 'male',
  heightCm: 175,
  initialWeightKg: 85,
  currentWeightKg: 85,
  trainingDays: ['saturday', 'sunday', 'tuesday', 'wednesday'],
  workoutStartTime: '06:00',
  workoutEndTime: '08:00',
  trainingDayTarget: defaultMealPlan.calculations.trainingDayTarget,
  restDayTarget: defaultMealPlan.calculations.restDayTarget,
};

export const defaultSettings: AppSettings = {
  usePersianDigits: true,
  allowMultipleWeightLogsPerDay: false,
  mealTimes: {
    preworkout: '05:30',
    breakfast: '08:30',
    snack1: '11:15',
    lunch: '13:45',
    snack2: '17:15',
    dinner: '20:15',
    bedtime: '22:45',
  },
};
