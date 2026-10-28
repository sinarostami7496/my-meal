import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/common/PageHeader';
import { PersianNumber } from '@/components/common/PersianNumber';
import { CaloriesChart } from '@/components/reports/CaloriesChart';
import { DateRangeFilter, type RangePreset } from '@/components/reports/DateRangeFilter';
import { WeightChart } from '@/components/reports/WeightChart';
import { useApp } from '@/context/AppContext';
import { addDays, getDateRangeDays, toIsoDate } from '@/utils/dateUtils';
import { formatPersianDate } from '@/utils/formatUtils';
import { calculateWeeklySummary } from '@/utils/mealUtils';

export function ReportsPage() {
  const { mealPlan, userProfile, dailySelections, mealLogs, weightEntries } = useApp();
  const [preset, setPreset] = useState<RangePreset>('7');
  const end = toIsoDate();
  const [customStart, setCustomStart] = useState(addDays(end, -14));
  const [customEnd, setCustomEnd] = useState(end);

  const range = useMemo(() => {
    if (preset === '7') return { start: addDays(end, -6), end };
    if (preset === '30') return { start: addDays(end, -29), end };
    if (preset === '90') return { start: addDays(end, -89), end };
    return { start: customStart, end: customEnd };
  }, [preset, end, customStart, customEnd]);

  const weekly = useMemo(
    () =>
      calculateWeeklySummary(range.start, range.end, mealPlan, userProfile, dailySelections, mealLogs),
    [range, mealPlan, userProfile, dailySelections, mealLogs],
  );

  const calorieChart = weekly.map((r) => ({
    label: formatPersianDate(r.date, 'MM/dd'),
    consumed: r.consumedCalories,
    target: r.targetCalories,
  }));

  const macroBar = weekly.map((r) => ({
    label: formatPersianDate(r.date, 'MM/dd'),
    protein: r.consumedProtein,
    carbs: r.consumedCarbs,
    fat: r.consumedFat,
  }));

  const avgCal =
    weekly.length > 0
      ? Math.round(weekly.reduce((s, r) => s + r.consumedCalories, 0) / weekly.length)
      : 0;
  const avgAdherence =
    weekly.length > 0
      ? Math.round(weekly.reduce((s, r) => s + r.adherencePercent, 0) / weekly.length)
      : 0;

  const weights = getDateRangeDays(range.start, range.end)
    .map((d) => {
      const e = weightEntries.filter((w) => w.date === d).pop();
      return e ? { label: formatPersianDate(d, 'MM/dd'), weight: e.weightKg } : null;
    })
    .filter(Boolean) as { label: string; weight: number }[];

  const trainingDays = weekly.filter((r) => r.dayType === 'training');
  const restDays = weekly.filter((r) => r.dayType === 'rest');
  const avgTrain =
    trainingDays.length > 0
      ? Math.round(trainingDays.reduce((s, r) => s + r.consumedCalories, 0) / trainingDays.length)
      : 0;
  const avgRest =
    restDays.length > 0
      ? Math.round(restDays.reduce((s, r) => s + r.consumedCalories, 0) / restDays.length)
      : 0;

  const completeDays = weekly.filter((r) => r.completedMeals === r.totalMeals && r.totalMeals > 0).length;
  const lowDays = weekly.filter((r) => r.consumedCalories < r.targetCalories * 0.85).length;
  const highDays = weekly.filter((r) => r.consumedCalories > r.targetCalories * 1.1).length;

  return (
    <div>
      <PageHeader title="گزارش‌ها" />
      <DateRangeFilter
        preset={preset}
        start={customStart}
        end={customEnd}
        onPreset={(p) => setPreset(p)}
        onCustom={(s, e) => {
          setPreset('custom');
          setCustomStart(s);
          setCustomEnd(e);
        }}
      />

      <Tabs defaultValue="weekly" className="mt-6">
        <TabsList>
          <TabsTrigger value="weekly">هفتگی</TabsTrigger>
          <TabsTrigger value="monthly">خلاصه دوره</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly">
          <div className="grid gap-4 md:grid-cols-3 mt-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-slate-500">میانگین کالری</p>
                <p className="text-2xl font-bold">
                  <PersianNumber value={avgCal} />
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-slate-500">پایبندی</p>
                <p className="text-2xl font-bold">
                  <PersianNumber value={avgAdherence} />٪
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-slate-500">روزهای کامل</p>
                <p className="text-2xl font-bold">
                  <PersianNumber value={completeDays} />
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>کالری مصرفی و هدف</CardTitle>
            </CardHeader>
            <CardContent>
              <CaloriesChart data={calorieChart} />
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>ماکروهای مصرفی</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={macroBar}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis width={32} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="protein" name="پروتئین" fill="#2563eb" />
                  <Bar dataKey="carbs" name="کرب" fill="#9333ea" />
                  <Bar dataKey="fat" name="چربی" fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly">
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <Card>
              <CardContent className="pt-4 space-y-2 text-sm">
                <p>
                  مجموع کالری:{' '}
                  <PersianNumber value={weekly.reduce((s, r) => s + r.consumedCalories, 0)} />
                </p>
                <p>
                  میانگین پروتئین:{' '}
                  <PersianNumber
                    value={
                      weekly.length
                        ? weekly.reduce((s, r) => s + r.consumedProtein, 0) / weekly.length
                        : 0
                    }
                    decimals={1}
                  />
                </p>
                <p>
                  روز کم‌مصرف: <PersianNumber value={lowDays} />
                </p>
                <p>
                  روز پرمصرف: <PersianNumber value={highDays} />
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-sm">
                <p>
                  میانگین کالری روز تمرین: <PersianNumber value={avgTrain} />
                </p>
                <p>
                  میانگین کالری روز استراحت: <PersianNumber value={avgRest} />
                </p>
              </CardContent>
            </Card>
          </div>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>روند وزن</CardTitle>
            </CardHeader>
            <CardContent>
              <WeightChart data={weights} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
