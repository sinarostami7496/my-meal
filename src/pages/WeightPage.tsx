import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { PersianNumber } from '@/components/common/PersianNumber';
import { WeightChart } from '@/components/reports/WeightChart';
import { generateId, useApp } from '@/context/AppContext';
import { toIsoDate } from '@/utils/dateUtils';
import { formatPersianDate } from '@/utils/formatUtils';
import { weightWarning } from '@/utils/validationUtils';
import {
  getLatestWeight,
  getWeightChange,
  getWeeklyWeightChange,
  weeklyAverageWeight,
} from '@/utils/weightUtils';
import type { WeightEntry } from '@/types/weight';

export function WeightPage() {
  const { userProfile, weightEntries, addWeightEntry, updateWeightEntry, deleteWeightEntry, settings } =
    useApp();
  const [weightKg, setWeightKg] = useState('');
  const [date, setDate] = useState(toIsoDate());
  const [waistCm, setWaistCm] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [notes, setNotes] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...weightEntries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [weightEntries],
  );

  const latest = getLatestWeight(weightEntries);
  const totalChange = getWeightChange(weightEntries);
  const weekChange = getWeeklyWeightChange(weightEntries);
  const weekAvg = weeklyAverageWeight(weightEntries, toIsoDate());

  const chartData = [...sorted]
    .reverse()
    .slice(-30)
    .map((e) => ({ label: formatPersianDate(e.date, 'MM/dd'), weight: e.weightKg }));

  const submit = () => {
    const kg = parseFloat(weightKg);
    if (!Number.isFinite(kg)) {
      toast.error('وزن معتبر وارد کنید');
      return;
    }
    const warn = weightWarning(kg, userProfile.heightCm);
    if (warn) toast.warning(warn);

    if (!settings.allowMultipleWeightLogsPerDay && !editId) {
      const exists = weightEntries.some((e) => e.date === date);
      if (exists) {
        toast.error('برای این تاریخ قبلاً وزن ثبت شده. از تنظیمات چند ثبت در روز را فعال کنید.');
        return;
      }
    }

    const entry: WeightEntry = {
      id: editId ?? generateId('weight'),
      date,
      weightKg: kg,
      waistCm: waistCm ? parseFloat(waistCm) : undefined,
      bodyFatPercent: bodyFat ? parseFloat(bodyFat) : undefined,
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
    };

    if (editId) updateWeightEntry(entry);
    else addWeightEntry(entry);

    toast.success('وزن ثبت شد');
    setWeightKg('');
    setWaistCm('');
    setBodyFat('');
    setNotes('');
    setEditId(null);
  };

  const startEdit = (e: WeightEntry) => {
    setEditId(e.id);
    setDate(e.date);
    setWeightKg(String(e.weightKg));
    setWaistCm(e.waistCm ? String(e.waistCm) : '');
    setBodyFat(e.bodyFatPercent ? String(e.bodyFatPercent) : '');
    setNotes(e.notes ?? '');
  };

  return (
    <div>
      <PageHeader title="پایش وزن" />
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-500">وزن فعلی</p>
            <p className="text-2xl font-bold">
              {latest ? <PersianNumber value={latest.weightKg} decimals={1} /> : '—'} kg
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-500">از اولین ثبت</p>
            <p className="text-xl font-semibold">
              {totalChange.from != null ? (
                <>
                  {totalChange.delta > 0 ? '+' : ''}
                  <PersianNumber value={totalChange.delta} decimals={1} /> kg
                </>
              ) : (
                '—'
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-500">هفته قبل / میانگین هفتگی</p>
            <p className="text-xl font-semibold">
              <PersianNumber value={weekChange} decimals={1} /> kg
              {weekAvg != null && (
                <span className="block text-sm font-normal text-slate-500">
                  میانگین: <PersianNumber value={weekAvg} decimals={1} />
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editId ? 'ویرایش وزن' : 'ثبت وزن جدید'}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>تاریخ</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>وزن (kg)</Label>
            <Input type="number" step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
          </div>
          <div>
            <Label>دور کمر (cm) — اختیاری</Label>
            <Input type="number" value={waistCm} onChange={(e) => setWaistCm(e.target.value)} />
          </div>
          <div>
            <Label>درصد چربی — اختیاری</Label>
            <Input type="number" step="0.1" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>توضیحات</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button onClick={submit}>{editId ? 'به‌روزرسانی' : 'ذخیره'}</Button>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>روند وزن</CardTitle>
        </CardHeader>
        <CardContent>
          <WeightChart data={chartData} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>سوابق</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="py-2 text-right">تاریخ</th>
                <th className="py-2 text-right">وزن</th>
                <th className="py-2 text-right">کمر</th>
                <th className="py-2 text-right">چربی</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((e) => (
                <tr key={e.id} className="border-b border-slate-100">
                  <td className="py-2">{formatPersianDate(e.date)}</td>
                  <td className="py-2">
                    <PersianNumber value={e.weightKg} decimals={1} />
                  </td>
                  <td className="py-2">{e.waistCm ?? '—'}</td>
                  <td className="py-2">{e.bodyFatPercent ?? '—'}</td>
                  <td className="py-2 flex gap-1 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(e)}>
                      ویرایش
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(e.id)}>
                      حذف
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        title="حذف رکورد وزن"
        description="این رکورد حذف شود؟"
        destructive
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteWeightEntry(deleteId);
          setDeleteId(null);
          toast.success('حذف شد');
        }}
      />
    </div>
  );
}
