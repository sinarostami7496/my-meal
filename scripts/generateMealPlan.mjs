import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function weekdayFromFa(dayFa) {
  const d = String(dayFa).trim().replace(/\u200c/g, '');
  const map = {
    شنبه: 'saturday',
    یکشنبه: 'sunday',
    دوشنبه: 'monday',
    سهشنبه: 'tuesday',
    چهارشنبه: 'wednesday',
    پنجشنبه: 'thursday',
    جمعه: 'friday',
  };
  return map[d.replace(/\u200c/g, '')];
}

function normalizeTime(t) {
  const s = String(t ?? '').trim();
  const m = s.match(/(\d{1,2}):(\d{2})/);
  if (!m) return '00:00';
  return `${m[1].padStart(2, '0')}:${m[2]}`;
}

function slotKey(time, title) {
  const t = normalizeTime(time).replace(':', '');
  const lower = String(title).toLowerCase();
  let cat = 'custom';
  if (lower.includes('پیش از تمرین') || lower.includes('صبحانه سبک')) cat = 'preworkout';
  else if (lower.includes('پس از تمرین') || (lower.includes('صبحانه') && !lower.includes('سبک'))) cat = 'breakfast';
  else if (lower.includes('میان\u200cوعده ۱') || lower.includes('میان\u200cوعده 1') || lower.includes('میان‌وعده ۱')) cat = 'snack1';
  else if (lower.includes('ناهار')) cat = 'lunch';
  else if (lower.includes('میان\u200cوعده ۲') || lower.includes('میان\u200cوعده 2') || lower.includes('میان‌وعده ۲')) cat = 'snack2';
  else if (lower.includes('شام')) cat = 'dinner';
  else if (lower.includes('پیش از خواب')) cat = 'bedtime';
  return `${t}:${cat}`;
}

function parseIngredients(text) {
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

function num(v) {
  const n = parseFloat(String(v ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function parseOptionsSheet(ws) {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const slotsMap = new Map();
  for (let i = 1; i < rows.length; i++) {
    const [title, time, optLabel, materials, p, c, f, kcal] = rows[i];
    if (!title && !time) continue;
    const key = slotKey(time, title);
    if (!slotsMap.has(key)) {
      slotsMap.set(key, {
        slotKey: key,
        title: String(title).trim(),
        scheduledTime: normalizeTime(time),
        category: key.split(':')[1],
        options: [],
      });
    }
    const slot = slotsMap.get(key);
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
  return [...slotsMap.values()].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
}

function parseWeeklySheet(ws) {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const weekdayMeta = {};
  for (let i = 1; i < rows.length; i++) {
    const [dayFa, dayTypeFa, title, time] = rows[i];
    if (!dayFa || String(title).includes('جمع روزانه')) continue;
    const wd = weekdayFromFa(dayFa);
    if (!wd) continue;
    if (!weekdayMeta[wd]) {
      weekdayMeta[wd] = {
        weekday: wd,
        dayType: String(dayTypeFa).includes('تمرین') ? 'training' : 'rest',
        slots: [],
      };
    }
    weekdayMeta[wd].slots.push({
      slotKey: slotKey(time, title),
      title: String(title).trim(),
      scheduledTime: normalizeTime(time),
    });
  }
  return weekdayMeta;
}

function parseCalculations(ws) {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const out = {
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
    if (label.includes('روز تمرین') && label.includes('kcal')) out.trainingDayTarget.calories = num(val) || 3100;
    if (label.includes('روز استراحت') && label.includes('kcal')) out.restDayTarget.calories = num(val) || 2900;
  }
  return out;
}

function parseGuide(ws) {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const notes = [];
  for (const row of rows) {
    const t = String(row[0] ?? row[1] ?? '').trim();
    if (t && t.length > 5) notes.push(t);
  }
  return notes.length ? notes : [
    'غذاها پخته، بخارپز، آب\u200cپز یا گریل باشند.',
    'قند افزوده و نوشیدنی شیرین حذف شوند.',
    'روغن ترانس و سرخ\u200cکردنی حذف شود.',
  ];
}

function main() {
  const downloads = 'C:/Users/rostami.s/Downloads';
  const files = fs.readdirSync(downloads).filter((f) => f.endsWith('.xlsx') && f.includes('\u06a9\u0628\u062f'));
  const srcPath =
    process.argv[2] ||
    path.join(downloads, files.find((f) => f.includes('(1)')) || files[0] || 'meal-plan.xlsx');
  const wb = XLSX.readFile(srcPath);
  const calcWs = wb.Sheets['محاسبات'] || wb.Sheets[wb.SheetNames[0]];
  const optWs = wb.Sheets['گزینه\u200cهای وعده'] || wb.Sheets[wb.SheetNames[1]];
  const weekWs = wb.Sheets['برنامه هفتگی'] || wb.Sheets[wb.SheetNames[2]];
  const guideWs = wb.Sheets['راهنما'] || wb.Sheets[wb.SheetNames[3]];

  const data = {
    version: 1,
    importedAt: new Date().toISOString(),
    sourceFileName: path.basename(srcPath),
    calculations: parseCalculations(calcWs),
    slotTemplates: parseOptionsSheet(optWs),
    weekdayMeta: parseWeeklySheet(weekWs),
    fattyLiverNotes: parseGuide(guideWs),
  };

  const outPath = path.join(__dirname, '../src/data/mealPlan.seed.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');

  const tsPath = path.join(__dirname, '../src/data/mealPlan.ts');
  fs.writeFileSync(
    tsPath,
    `import type { MealPlanData } from '@/types/meal';

export const defaultMealPlan: MealPlanData = ${JSON.stringify(data, null, 2)} as MealPlanData;
`,
    'utf8',
  );
  console.log('Written', outPath, tsPath);
}

main();
