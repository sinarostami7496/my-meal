import {
  MealPlanParseError,
  parseMealPlanArrayBuffer,
} from '@/services/mealPlanParser';
import type { MealPlanData } from '@/types/meal';

export async function importMealPlanFromFile(file: File): Promise<MealPlanData> {
  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
    throw new MealPlanParseError('فقط فایل Excel (.xlsx) پشتیبانی می\u200cشود.');
  }
  const buffer = await file.arrayBuffer();
  return parseMealPlanArrayBuffer(buffer, file.name);
}
