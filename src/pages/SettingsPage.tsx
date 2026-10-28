import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { useApp } from '@/context/AppContext';
import { MealPlanParseError } from '@/services/mealPlanParser';
import { importMealPlanFromFile } from '@/services/mealPlanImportService';
import { downloadJsonBackup, exportReportExcel } from '@/services/exportService';
import type { UserProfile, WeekDay } from '@/types/user';
import { WEEKDAY_LABELS } from '@/utils/dateUtils';
import { weekdayOrder } from '@/utils/mealUtils';

export function SettingsPage() {
  const {
    userProfile,
    updateProfile,
    settings,
    updateSettings,
    mealPlan,
    setMealPlanData,
    resetMealPlan,
    exportJson,
    importJson,
    wipeAll,
    clearDayLogs,
  } = useApp();

  const fileRef = useRef<HTMLInputElement>(null);
  const jsonRef = useRef<HTMLInputElement>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [confirmWipe2, setConfirmWipe2] = useState(false);
  const [clearDay, setClearDay] = useState('');

  const saveProfile = (partial: Partial<UserProfile>) => {
    updateProfile({ ...userProfile, ...partial });
    toast.success('ذخیره شد');
  };

  const onExcel = async (file: File) => {
    try {
      const data = await importMealPlanFromFile(file);
      setMealPlanData(data, true);
      toast.success('برنامه غذایی از فایل Excel بارگذاری شد');
    } catch (e) {
      toast.error(e instanceof MealPlanParseError ? e.message : 'خطا در خواندن فایل');
    }
  };

  return (
    <div>
      <PageHeader title="تنظیمات" />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>پروفایل</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>نام</Label>
            <Input
              defaultValue={userProfile.name}
              onBlur={(e) => saveProfile({ name: e.target.value })}
            />
          </div>
          <div>
            <Label>سن</Label>
            <Input
              type="number"
              defaultValue={userProfile.age}
              onBlur={(e) => saveProfile({ age: parseInt(e.target.value, 10) })}
            />
          </div>
          <div>
            <Label>قد (cm)</Label>
            <Input
              type="number"
              defaultValue={userProfile.heightCm}
              onBlur={(e) => saveProfile({ heightCm: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <Label>وزن اولیه (kg)</Label>
            <Input
              type="number"
              defaultValue={userProfile.initialWeightKg}
              onBlur={(e) => saveProfile({ initialWeightKg: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <Label>ساعت تمرین</Label>
            <div className="flex gap-2">
              <Input
                type="time"
                defaultValue={userProfile.workoutStartTime}
                onBlur={(e) => saveProfile({ workoutStartTime: e.target.value })}
              />
              <Input
                type="time"
                defaultValue={userProfile.workoutEndTime}
                onBlur={(e) => saveProfile({ workoutEndTime: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>اهداف تغذیه</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>کالری روز تمرین</Label>
            <Input
              type="number"
              defaultValue={userProfile.trainingDayTarget.calories}
              onBlur={(e) =>
                saveProfile({
                  trainingDayTarget: {
                    ...userProfile.trainingDayTarget,
                    calories: parseInt(e.target.value, 10),
                  },
                })
              }
            />
          </div>
          <div>
            <Label>کالری روز استراحت</Label>
            <Input
              type="number"
              defaultValue={userProfile.restDayTarget.calories}
              onBlur={(e) =>
                saveProfile({
                  restDayTarget: {
                    ...userProfile.restDayTarget,
                    calories: parseInt(e.target.value, 10),
                  },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>برنامه غذایی (Excel)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            فایل فعلی: {mealPlan.sourceFileName} —{' '}
            {new Date(mealPlan.importedAt).toLocaleDateString('fa-IR')}
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onExcel(f);
              e.target.value = '';
            }}
          />
          <Button type="button" onClick={() => fileRef.current?.click()}>
            بارگذاری فایل Excel برنامه غذایی
          </Button>
          <Button type="button" variant="outline" onClick={() => resetMealPlan()}>
            بازگردانی برنامه اولیه (seed)
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>نمایش و داده</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.usePersianDigits}
              onChange={(e) =>
                updateSettings({ ...settings, usePersianDigits: e.target.checked })
              }
            />
            نمایش اعداد فارسی
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.allowMultipleWeightLogsPerDay}
              onChange={(e) =>
                updateSettings({
                  ...settings,
                  allowMultipleWeightLogsPerDay: e.target.checked,
                })
              }
            />
            چند ثبت وزن در یک روز
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => downloadJsonBackup(exportJson())}>
              خروجی JSON پشتیبان
            </Button>
            <input
              ref={jsonRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  const text = await f.text();
                  importJson(JSON.parse(text));
                  toast.success('پشتیبان بازیابی شد');
                } catch {
                  toast.error('فایل JSON نامعتبر است');
                }
                e.target.value = '';
              }}
            />
            <Button type="button" variant="outline" onClick={() => jsonRef.current?.click()}>
              ورود JSON
            </Button>
            <Button type="button" variant="outline" onClick={() => exportReportExcel()}>
              خروجی Excel گزارش
            </Button>
          </div>
          <div className="flex gap-2 items-end">
            <div>
              <Label>پاک‌سازی لاگ یک روز (ISO)</Label>
              <Input type="date" value={clearDay} onChange={(e) => setClearDay(e.target.value)} />
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={!clearDay}
              onClick={() => {
                clearDayLogs(clearDay);
                toast.success('لاگ روز پاک شد');
              }}
            >
              پاک کردن
            </Button>
          </div>
          <Button type="button" variant="destructive" onClick={() => setConfirmWipe(true)}>
            پاک‌سازی تمام اطلاعات
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>روزهای تمرین</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {weekdayOrder().map((wd) => {
            const active = userProfile.trainingDays.includes(wd as WeekDay);
            return (
              <Button
                key={wd}
                size="sm"
                variant={active ? 'default' : 'outline'}
                onClick={() => {
                  const days = active
                    ? userProfile.trainingDays.filter((d) => d !== wd)
                    : [...userProfile.trainingDays, wd as WeekDay];
                  saveProfile({ trainingDays: days });
                }}
              >
                {WEEKDAY_LABELS[wd as WeekDay]}
              </Button>
            );
          })}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmWipe}
        title="پاک‌سازی همه داده‌ها"
        description="مرحله ۱ از ۲: آیا مطمئن هستید؟"
        destructive
        onCancel={() => setConfirmWipe(false)}
        onConfirm={() => {
          setConfirmWipe(false);
          setConfirmWipe2(true);
        }}
      />
      <ConfirmDialog
        open={confirmWipe2}
        title="تأیید نهایی"
        description="تمام اطلاعات localStorage پاک می‌شود."
        destructive
        confirmLabel="بله، پاک کن"
        onCancel={() => setConfirmWipe2(false)}
        onConfirm={() => {
          wipeAll();
          setConfirmWipe2(false);
          toast.success('داده‌ها بازنشانی شد');
        }}
      />
    </div>
  );
}
