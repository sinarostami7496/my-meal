import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { defaultMealPlan } from '@/data/mealPlan';
import { defaultSettings, defaultUserProfile } from '@/data/seedData';
import type { AppBackup } from '@/services/storageService';
import {
  clearAllData,
  clearDailySelections,
  exportBackup,
  getCustomMeals,
  getDailySelections,
  getMealLogs,
  getMealPlan,
  getSettings,
  getUserProfile,
  getWeightEntries,
  importBackup,
  initializeStorage,
  resetMealPlanToSeed,
  setCustomMeals,
  setDailySelections,
  setMealLogs,
  setMealPlan,
  setSettings,
  setUserProfile,
  setWeightEntries,
} from '@/services/storageService';
import type { DailySelections, Meal, MealLog, MealPlanData } from '@/types/meal';
import type { AppSettings, UserProfile } from '@/types/user';
import type { WeightEntry } from '@/types/weight';
import { toIsoDate } from '@/utils/dateUtils';
import {
  ensureDailySelections,
  rerollDailySelections,
  setDailyOption,
} from '@/utils/mealUtils';
import { generateId } from '@/lib/utils';

initializeStorage();

interface AppContextValue {
  userProfile: UserProfile;
  mealPlan: MealPlanData;
  settings: AppSettings;
  dailySelections: DailySelections;
  mealLogs: MealLog[];
  customMeals: Meal[];
  weightEntries: WeightEntry[];
  refresh: () => void;
  updateProfile: (p: UserProfile) => void;
  updateSettings: (s: AppSettings) => void;
  setMealPlanData: (p: MealPlanData, clearSelections?: boolean) => void;
  resetMealPlan: () => void;
  ensureDateSelections: (iso: string) => void;
  changeDailyOption: (iso: string, slotKey: string, optionIndex: number) => void;
  rerollDay: (iso: string) => void;
  upsertMealLog: (log: MealLog) => void;
  removeMealLog: (id: string) => void;
  clearDayLogs: (iso: string) => void;
  addCustomMeal: (meal: Meal) => void;
  addWeightEntry: (entry: WeightEntry) => void;
  updateWeightEntry: (entry: WeightEntry) => void;
  deleteWeightEntry: (id: string) => void;
  exportJson: () => AppBackup;
  importJson: (data: AppBackup) => void;
  wipeAll: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function loadState() {
  return {
    userProfile: getUserProfile(),
    mealPlan: getMealPlan(),
    settings: getSettings(),
    dailySelections: getDailySelections(),
    mealLogs: getMealLogs(),
    customMeals: getCustomMeals(),
    weightEntries: getWeightEntries(),
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(loadState);

  const refresh = useCallback(() => setState(loadState()), []);

  const updateProfile = useCallback((p: UserProfile) => {
    setUserProfile(p);
    setState(loadState());
  }, []);

  const updateSettings = useCallback((s: AppSettings) => {
    setSettings(s);
    setState(loadState());
  }, []);

  const setMealPlanData = useCallback((p: MealPlanData, clearSelections = true) => {
    setMealPlan(p);
    if (clearSelections) clearDailySelections(toIsoDate());
    setUserProfile({
      ...getUserProfile(),
      trainingDayTarget: p.calculations.trainingDayTarget,
      restDayTarget: p.calculations.restDayTarget,
    });
    setState(loadState());
  }, []);

  const resetMealPlan = useCallback(() => {
    resetMealPlanToSeed();
    clearDailySelections();
    setState(loadState());
  }, []);

  const ensureDateSelections = useCallback(
    (iso: string) => {
      const next = ensureDailySelections(iso, state.mealPlan, state.dailySelections);
      if (next !== state.dailySelections) {
        setDailySelections(next);
        setState(loadState());
      }
    },
    [state.mealPlan, state.dailySelections],
  );

  const changeDailyOption = useCallback(
    (iso: string, slotKey: string, optionIndex: number) => {
      const next = setDailyOption(state.dailySelections, iso, slotKey, optionIndex);
      setDailySelections(next);
      setState(loadState());
    },
    [state.dailySelections],
  );

  const rerollDay = useCallback(
    (iso: string) => {
      const next = rerollDailySelections(iso, state.mealPlan, state.dailySelections);
      setDailySelections(next);
      setState(loadState());
    },
    [state.mealPlan, state.dailySelections],
  );

  const upsertMealLog = useCallback((log: MealLog) => {
    const logs = getMealLogs();
    const idx = logs.findIndex(
      (l) => l.date === log.date && l.slotKey === log.slotKey,
    );
    const next = [...logs];
    if (idx >= 0) next[idx] = log;
    else next.push(log);
    setMealLogs(next);
    setState(loadState());
  }, []);

  const removeMealLog = useCallback((id: string) => {
    setMealLogs(getMealLogs().filter((l) => l.id !== id));
    setState(loadState());
  }, []);

  const clearDayLogs = useCallback((iso: string) => {
    setMealLogs(getMealLogs().filter((l) => l.date !== iso));
    setState(loadState());
  }, []);

  const addCustomMeal = useCallback((meal: Meal) => {
    const meals = [...getCustomMeals(), meal];
    setCustomMeals(meals);
    setState(loadState());
  }, []);

  const addWeightEntry = useCallback((entry: WeightEntry) => {
    setWeightEntries([...getWeightEntries(), entry]);
    const profile = getUserProfile();
    setUserProfile({ ...profile, currentWeightKg: entry.weightKg });
    setState(loadState());
  }, []);

  const updateWeightEntry = useCallback((entry: WeightEntry) => {
    setWeightEntries(getWeightEntries().map((e) => (e.id === entry.id ? entry : e)));
    setState(loadState());
  }, []);

  const deleteWeightEntry = useCallback((id: string) => {
    setWeightEntries(getWeightEntries().filter((e) => e.id !== id));
    setState(loadState());
  }, []);

  const exportJson = useCallback(() => exportBackup(), []);

  const importJson = useCallback((data: AppBackup) => {
    importBackup(data);
    setState(loadState());
  }, []);

  const wipeAll = useCallback(() => {
    clearAllData();
    setState(loadState());
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      refresh,
      updateProfile,
      updateSettings,
      setMealPlanData,
      resetMealPlan,
      ensureDateSelections,
      changeDailyOption,
      rerollDay,
      upsertMealLog,
      removeMealLog,
      clearDayLogs,
      addCustomMeal,
      addWeightEntry,
      updateWeightEntry,
      deleteWeightEntry,
      exportJson,
      importJson,
      wipeAll,
    }),
    [
      state,
      refresh,
      updateProfile,
      updateSettings,
      setMealPlanData,
      resetMealPlan,
      ensureDateSelections,
      changeDailyOption,
      rerollDay,
      upsertMealLog,
      removeMealLog,
      clearDayLogs,
      addCustomMeal,
      addWeightEntry,
      updateWeightEntry,
      deleteWeightEntry,
      exportJson,
      importJson,
      wipeAll,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function usePersianDigits() {
  const { settings } = useApp();
  return settings.usePersianDigits;
}

export { generateId, defaultMealPlan, defaultUserProfile, defaultSettings };
