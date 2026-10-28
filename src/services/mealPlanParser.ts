import type { MealPlanData, MealSlotTemplate } from '@/types/meal';
import type { WeekDay } from '@/types/user';
import * as XLSX from 'xlsx';

function weekdayFromFa(dayFa: string): WeekDay | undefined {
  const d = dayFa.trim().replace(/\u200c/g, '');
  const map: Record<string, WeekDay> = {
    شنبه: 'saturday',
    یکشنبه: 'sunday',
    دوشنبه: 'monday',
    'سهشنبه': 'tuesday',
    چهارشنبه: 'wednesday',
    'پنجشنبه': 'thursday',
    جمعه: 'friday',
  };
  return map[d.replace(/\u200c/g, '')];
}

export class MealPlanParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MealPlanParseError';
  }
}

export function normalizeTime(t: unknown): string {
  const s = String(t ?? '').trim();
  const m = s.match(/(\d{1,2}):(\d{2})/);
  if (!m) return '00:00';
  return `${m[1].padStart(2, '0')}:${m[2]}`;
}

export function slotKeyFromTitle(time: unknown, title: unknown): string {
  const t = normalizeTime(time).replace(':', '');
  const lower = String(title).toLowerCase();
  let cat = 'custom';
  if (lower.includes('پیش از تمرین') || lower.includes('صبحانه سبک')) cat = 'preworkout';
  else if (lower.includes('پس از تمرین') || (lower.includes('صبحانه') && !lower.includes('سبک')))
    cat = 'breakfast';
  else if (lower.includes('میان\u200cوعده ۱') || lower.includes('میان\u200cوعده 1') || lower.includes('میان‌وعده ۱'))
    cat = 'snack1';
  else if (lower.includes('ناهار')) cat = 'lunch';
  else if (lower.includes('میان\u200cوعده ۲') || lower.includes('میان\u200cوعده 2') || lower.includes('میان‌وعده ۲'))
    cat = 'snack2';
  else if (lower.includes('شام')) cat = 'dinner';
  else if (lower.includes('پیش از خواب')) cat = 'bedtime';
  return `${t}:${cat}`;
}

function parseIngredients(text: unknown) {
  const parts = String(text ?? '')
    .split(/[؛;]/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.map((part, i) => {
    const m = part.match(/^(.+?)\s+([\d.]+)\s*(g|ml|عدد|قاشق|برش)?$/u);
    if (m) {
      return { id: `ing-${i}`, name: m[1].trim(), amount: parseFloat(m[2]), unit: m[3] || 'g' };
    }
    return { id: `ing-${i}`, name: part, amount: 1, unit: 'عدد' };
  });
}

function num(v: unknown): number {
  const n = parseFloat(String(v ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function sheetByName(wb: XLSX.WorkBook, ...names: string[]) {
  for (const n of names) {
    if (wb.Sheets[n]) return wb.Sheets[n];
  }
  const found = wb.SheetNames.find((s) => names.some((n) => s.includes(n.slice(0, 2))));
  if (found) return wb.Sheets[found];
  return null;
}

function parseOptionsSheet(ws: XLSX.WorkSheet): MealSlotTemplate[] {
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, defval: '' });
  const slotsMap = new Map<string, MealSlotTemplate>();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const title = row[0];
    const time = row[1];
    const optLabel = row[2];
    const materials = row[3];
    const p = row[4];
    const c = row[5];
    const f = row[6];
    const kcal = row[7];
    if (!title && !time) continue;
    const key = slotKeyFromTitle(time, title);
    if (!slotsMap.has(key)) {
      slotsMap.set(key, {
        slotKey: key,
        title: String(title).trim(),
        scheduledTime: normalizeTime(time),
        category: key.split(':')[1] ?? 'custom',
        options: [],
      });
    }
    const slot = slotsMap.get(key)!;
    const optNum = String(optLabel).match(/(\d)/);
    const optIndex = optNum ? parseInt(optNum[1], 10) - 1 : slot.options.length;
    slot.options.push({
      id: `${key}:opt${optIndex + 1}`,
      optionIndex: optIndex,
      label: String(optLabel).trim(),
      ingredients: parseIngredients(materials),
      ingredientsText: String(materials).trim(),
      protein: num(p),
      carbs: num(c),
      fat: num(f),
      calories: num(kcal) || num(p) * 4 + num(c) * 4 + num(f) * 9,
    });
  }
  if (slotsMap.size === 0) {
    throw new MealPlanParseError('شیت «گزینه\u200cهای وعده» خالی یا نامعتبر است.');
  }
  return [...slotsMap.values()].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
}

function parseWeeklySheet(ws: XLSX.WorkSheet): MealPlanData['weekdayMeta'] {
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, defval: '' });
  const weekdayMeta: MealPlanData['weekdayMeta'] = {};
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const dayFa = row[0];
    const dayTypeFa = row[1];
    const title = row[2];
    const time = row[3];
    if (!dayFa || String(title).includes('جمع روزانه')) continue;
    const wd = weekdayFromFa(String(dayFa));
    if (!wd) continue;
    if (!weekdayMeta[wd]) {
      weekdayMeta[wd] = {
        weekday: wd,
        dayType: String(dayTypeFa).includes('تمرین') ? 'training' : 'rest',
        slots: [],
      };
    }
    weekdayMeta[wd]!.slots.push({
      slotKey: slotKeyFromTitle(time, title),
      title: String(title).trim(),
      scheduledTime: normalizeTime(time),
    });
  }
  return weekdayMeta;
}

function parseCalculations(ws: XLSX.WorkSheet): MealPlanData['calculations'] {
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, defval: '' });
  const out: MealPlanData['calculations'] = {
    bmr: 1799,
    tdee: 2788,
    trainingDayTarget: { calories: 3100, protein: 190, carbs: 400, fat: 80 },
    restDayTarget: { calories: 2900, protein: 185, carbs: 350, fat: 85 },
  };
  for (const row of rows) {
    const label = String(row[0] ?? '');
    const val = row[1];
    if (label.includes('BMR')) out.bmr = num(val) || out.bmr;
    if (label.includes('TDEE')) out.tdee = num(val) || out.tdee;
    if (label.includes('روز تمرین') && label.includes('kcal'))
      out.trainingDayTarget.calories = num(val) || out.trainingDayTarget.calories;
    if (label.includes('روز استراحت') && label.includes('kcal'))
      out.restDayTarget.calories = num(val) || out.restDayTarget.calories;
  }
  return out;
}

function parseGuide(ws: XLSX.WorkSheet | null): string[] {
  if (!ws) {
    return [
      'غذاها پخته، بخارپز، آب\u200cپز یا گریل باشند.',
      'قند افزوده و نوشیدنی شیرین حذف شوند.',
      'روغن ترانس و سرخ\u200cکردنی حذف شود.',
    ];
  }
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, defval: '' });
  const notes: string[] = [];
  for (const row of rows) {
    const t = String(row[0] ?? row[1] ?? '').trim();
    if (t.length > 5) notes.push(t);
  }
  return notes.length ? notes : parseGuide(null);
}

export function parseMealPlanWorkbook(wb: XLSX.WorkBook, sourceFileName = 'import.xlsx'): MealPlanData {
  const calcWs = sheetByName(wb, 'محاسبات');
  const optWs = sheetByName(wb, 'گزینه\u200cهای وعده', 'گزینه');
  const weekWs = sheetByName(wb, 'برنامه هفتگی', 'هفتگی');
  const guideWs = sheetByName(wb, 'راهنما');

  if (!optWs) throw new MealPlanParseError('شیت «گزینه\u200cهای وعده» یافت نشد.');
  if (!weekWs) throw new MealPlanParseError('شیت «برنامه هفتگی» یافت نشد.');

  return {
    version: 1,
    importedAt: new Date().toISOString(),
    sourceFileName,
    calculations: calcWs ? parseCalculations(calcWs) : parseCalculations({} as XLSX.WorkSheet),
    slotTemplates: parseOptionsSheet(optWs),
    weekdayMeta: parseWeeklySheet(weekWs),
    fattyLiverNotes: parseGuide(guideWs),
  };
}

export function parseMealPlanArrayBuffer(buffer: ArrayBuffer, fileName: string): MealPlanData {
  const wb = XLSX.read(buffer, { type: 'array' });
  return parseMealPlanWorkbook(wb, fileName);
}
