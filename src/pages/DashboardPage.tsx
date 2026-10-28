import { Link } from 'react-router-dom';
import { Plus, Scale, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DateHeader } from '@/components/common/DateHeader';
import { PageHeader } from '@/components/common/PageHeader';
import { PersianNumber } from '@/components/common/PersianNumber';
import { CaloriesProgress } from '@/components/dashboard/CaloriesProgress';
import { MacroProgress } from '@/components/dashboard/MacroProgress';
import { CaloriesChart } from '@/components/reports/CaloriesChart';
import { useApp } from '@/context/AppContext';
import { useToday } from '@/hooks/useToday';
import { addDays, toIsoDate } from '@/utils/dateUtils';
import { formatPersianDate } from '@/utils/formatUtils';
import { calculateDailySummary, getCountdownToMeal } from '@/utils/mealUtils';
import { getLatestWeight, getWeeklyWeightChange } from '@/utils/weightUtils';
import { useMemo } from 'react';

export function DashboardPage() {
  const { userProfile, mealPlan, dailySelections, mealLogs, weightEntries } = useApp();
  const { summary, nextMeal, meals } = useToday();
  const today = toIsoDate();

  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(today, -6 + i);
      const s = calculateDailySummary(d, mealPlan, userProfile, dailySelections, mealLogs);
      return {
        label: formatPersianDate(d, 'MM/dd'),
        consumed: s.consumedCalories,
        target: s.targetCalories,
      };
    });
  }, [today, mealPlan, userProfile, dailySelections, mealLogs]);

  const latestWeight = getLatestWeight(weightEntries);
  const weekDelta = getWeeklyWeightChange(weightEntries);
  const countdown = nextMeal ? getCountdownToMeal(nextMeal.scheduledTime) : null;
  const remainingMeals = meals.length - summary.completedMeals;
  const caloriePct =
    summary.targetCalories > 0
      ? Math.round((summary.consumedCalories / summary.targetCalories) * 100)
      : 0;

  return (
    <div>
      <PageHeader
        title={`سلام، ${userProfile.name}`}
        subtitle="داشبورد تغذیه من"
      />
      <DateHeader date={today} />

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant={summary.dayType === 'training' ? 'default' : 'secondary'}>
          {summary.dayType === 'training' ? 'روز تمرین' : 'روز استراحت'}
        </Badge>
        <Badge variant="info">
          <PersianNumber value={remainingMeals} /> وعده باقی‌مانده
        </Badge>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>کالری امروز</CardTitle>
          </CardHeader>
          <CardContent>
            <CaloriesProgress consumed={summary.consumedCalories} target={summary.targetCalories} />
            <p className="mt-2 text-xs text-slate-500">
              پیشرفت: <PersianNumber value={caloriePct} />٪
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ماکروها</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <MacroProgress
              label="پروتئین"
              consumed={summary.consumedProtein}
              target={summary.targetProtein}
              colorClass="bg-protein"
            />
            <MacroProgress
              label="کربوهیدرات"
              consumed={summary.consumedCarbs}
              target={summary.targetCarbs}
              colorClass="bg-carbs"
            />
            <MacroProgress
              label="چربی"
              consumed={summary.consumedFat}
              target={summary.targetFat}
              colorClass="bg-fat"
            />
            {summary.consumedProtein < summary.targetProtein * 0.7 && (
              <p className="text-sm text-orange-600">مصرف پروتئین پایین‌تر از هدف است.</p>
            )}
          </CardContent>
        </Card>

        {nextMeal && (
          <Card className="md:col-span-2 border-teal-200 bg-teal-50/30">
            <CardHeader>
              <CardTitle>وعده پیش‌رو</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{nextMeal.title}</p>
              <p className="text-sm text-slate-600">{nextMeal.scheduledTime}</p>
              {countdown !== null && countdown > 0 && (
                <p className="mt-2 text-sm text-primary">
                  تا وعده بعدی:{' '}
                  <PersianNumber value={Math.floor(countdown / 3600)} />
                  :
                  <PersianNumber value={Math.floor((countdown % 3600) / 60)} />
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>وزن</CardTitle>
          </CardHeader>
          <CardContent>
            {latestWeight ? (
              <>
                <p className="text-2xl font-bold">
                  <PersianNumber value={latestWeight.weightKg} decimals={1} /> kg
                </p>
                <p className="text-sm text-slate-600">
                  تغییر هفته:{' '}
                  <span className={weekDelta <= 0 ? 'text-green-600' : 'text-orange-600'}>
                    {weekDelta > 0 ? '+' : ''}
                    <PersianNumber value={weekDelta} decimals={1} /> kg
                  </span>
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-500">هنوز وزنی ثبت نشده</p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>کالری ۷ روز اخیر</CardTitle>
          </CardHeader>
          <CardContent>
            <CaloriesChart data={chartData} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 no-print">
        <Link to="/meals/new">
          <Button type="button">
            <Plus className="h-4 w-4" /> ثبت وعده
          </Button>
        </Link>
        <Link to="/weight">
          <Button type="button" variant="secondary">
            <Scale className="h-4 w-4" /> ثبت وزن
          </Button>
        </Link>
        <Link to="/today">
          <Button type="button" variant="outline">
            <Utensils className="h-4 w-4" /> مشاهده برنامه امروز
          </Button>
        </Link>
      </div>
    </div>
  );
}
