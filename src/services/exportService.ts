import * as XLSX from 'xlsx';
import type { AppBackup } from '@/services/storageService';
import {
  getDailySelections,
  getMealLogs,
  getMealPlan,
  getUserProfile,
  getWeightEntries,
} from '@/services/storageService';
import { WEEKDAY_LABELS } from '@/utils/dateUtils';
import { formatPersianDate } from '@/utils/formatUtils';
import {
  calculateDailySummary,
  getPlannedMealsForDate,
} from '@/utils/mealUtils';
import { addDays, getDateRangeDays, toIsoDate } from '@/utils/dateUtils';
import { getSettings } from '@/services/storageService';

export function exportReportExcel(startDate?: string, endDate?: string): void {
  const end = endDate ?? toIsoDate();
  const start = startDate ?? addDays(end, -30);
  const mealPlan = getMealPlan();
  const profile = getUserProfile();
  const selections = getDailySelections();
  const logs = getMealLogs();
  const weights = getWeightEntries();
  const settings = getSettings();

  const dailyRows = getDateRangeDays(start, end).map((date) => {
    const s = calculateDailySummary(date, mealPlan, profile, selections, logs);
    const adherence =
      s.targetCalories > 0
        ? Math.round((s.consumedCalories / s.targetCalories) * 100)
        : 0;
    return {
      تاریخ: formatPersianDate(date),
      'نوع روز': s.dayType === 'training' ? 'تمرین' : 'استراحت',
      'کالری هدف': s.targetCalories,
      'کالری مصرف‌شده': s.consumedCalories,
      'پروتئین هدف': s.targetProtein,
      'پروتئین مصرف‌شده': s.consumedProtein,
      'کربوهیدرات هدف': s.targetCarbs,
      'کربوهیدرات مصرف‌شده': s.consumedCarbs,
      'چربی هدف': s.targetFat,
      'چربی مصرف‌شده': s.consumedFat,
      'تعداد وعده‌ها': s.totalMeals,
      'وعده‌های تکمیل‌شده': s.completedMeals,
      'درصد پایبندی': adherence,
    };
  });

  const plannedRows: Record<string, string | number>[] = [];
  for (const date of getDateRangeDays(start, end)) {
    const meals = getPlannedMealsForDate(date, mealPlan, selections);
    for (const m of meals) {
      plannedRows.push({
        تاریخ: formatPersianDate(date),
        'روز هفته': WEEKDAY_LABELS[m.weekday],
        ساعت: m.scheduledTime,
        عنوان: m.title,
        نوع: m.category,
        مواد: m.ingredientsText,
        کالری: m.calories,
        پروتئین: m.protein,
        کربوهیدرات: m.carbs,
        چربی: m.fat,
      });
    }
  }

  const logRows = logs
    .filter((l) => l.date >= start && l.date <= end)
    .map((l) => ({
      تاریخ: formatPersianDate(l.date),
      وعده: l.mealId,
      سروینگ: l.servings,
      'کالری واقعی': l.actualCalories,
      'پروتئین واقعی': l.actualProtein,
      'کربوهیدرات واقعی': l.actualCarbs,
      'چربی واقعی': l.actualFat,
      'زمان ثبت': l.consumedAt ?? '',
      توضیحات: l.notes ?? '',
    }));

  const weightRows = weights
    .filter((w) => w.date >= start && w.date <= end)
    .map((w) => ({
      تاریخ: formatPersianDate(w.date),
      وزن: w.weightKg,
      'دور کمر': w.waistCm ?? '',
      'درصد چربی': w.bodyFatPercent ?? '',
      توضیحات: w.notes ?? '',
    }));

  const settingsRows = [
    { کلید: 'نام', مقدار: profile.name },
    { کلید: 'سن', مقدار: profile.age },
    { کلید: 'قد', مقدار: profile.heightCm },
    { کلید: 'وزن اولیه', مقدار: profile.initialWeightKg },
    { کلید: 'هدف کالری تمرین', مقدار: profile.trainingDayTarget.calories },
    { کلید: 'هدف کالری استراحت', مقدار: profile.restDayTarget.calories },
    { کلید: 'اعداد فارسی', مقدار: settings.usePersianDigits ? 'بله' : 'خیر' },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dailyRows), 'خلاصه روزانه');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(plannedRows), 'وعده‌های برنامه');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(logRows), 'سوابق مصرف');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(weightRows), 'سوابق وزن');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(settingsRows), 'تنظیمات');
  XLSX.writeFile(wb, `clean-bulk-report-${toIsoDate()}.xlsx`);
}

export function downloadJsonBackup(data: AppBackup): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clean-bulk-backup-${toIsoDate()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
