import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm, type Resolver } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/common/PageHeader';
import { generateId, useApp } from '@/context/AppContext';
import { toIsoDate } from '@/utils/dateUtils';
import { calculateCaloriesFromMacros } from '@/utils/macroUtils';
import type { Meal, MealCategory } from '@/types/meal';

const coerceNum = (min = 0) =>
  z.preprocess(
    (v) => (v === '' || v === undefined ? 0 : Number(v)),
    z.number().min(min),
  );

const schema = z.object({
  title: z.string().min(1, 'عنوان الزامی است'),
  date: z.string().min(1, 'تاریخ الزامی است'),
  scheduledTime: z.string().min(1, 'ساعت الزامی است'),
  category: z.string(),
  calories: coerceNum(0),
  protein: coerceNum(0),
  carbs: coerceNum(0),
  fat: coerceNum(0),
  notes: z.string().optional(),
  consumed: z.boolean(),
  ingredients: z.array(
    z.object({
      name: z.string().min(1, 'نام ماده الزامی است'),
      amount: coerceNum(0),
      unit: z.string(),
    }),
  ),
});

type FormValues = z.infer<typeof schema>;

export function AddMealPage() {
  const navigate = useNavigate();
  const { addCustomMeal, upsertMealLog } = useApp();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      title: '',
      date: toIsoDate(),
      scheduledTime: '12:00',
      category: 'custom',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      notes: '',
      consumed: true,
      ingredients: [{ name: '', amount: 100, unit: 'g' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'ingredients' });

  const onSubmit = (values: FormValues) => {
    let calories = values.calories;
    if (!calories) {
      calories = calculateCaloriesFromMacros(values.protein, values.carbs, values.fat);
    }
    const now = new Date().toISOString();
    const meal: Meal = {
      id: generateId('meal'),
      date: values.date,
      title: values.title,
      category: values.category as MealCategory,
      scheduledTime: values.scheduledTime,
      ingredients: values.ingredients.map((ing, i) => ({
        id: `ing-${i}`,
        ...ing,
      })),
      calories,
      protein: values.protein,
      carbs: values.carbs,
      fat: values.fat,
      notes: values.notes,
      isCustom: true,
      isRecurring: false,
      createdAt: now,
      updatedAt: now,
    };
    addCustomMeal(meal);
    if (values.consumed) {
      upsertMealLog({
        id: generateId('log'),
        mealId: meal.id,
        slotKey: `custom:${meal.id}`,
        date: values.date,
        servings: 1,
        consumed: true,
        consumedAt: now,
        actualCalories: calories,
        actualProtein: values.protein,
        actualCarbs: values.carbs,
        actualFat: values.fat,
        notes: values.notes,
      });
    }
    toast.success('وعده ذخیره شد');
    navigate('/today');
  };

  const autoCalories = () => {
    const p = form.getValues('protein');
    const c = form.getValues('carbs');
    const f = form.getValues('fat');
    form.setValue('calories', calculateCaloriesFromMacros(p, c, f));
  };

  return (
    <div>
      <PageHeader title="ثبت وعده غذایی" subtitle="وعده سفارشی یا خارج از برنامه" />
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات وعده</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>عنوان وعده</Label>
              <Input {...form.register('title')} />
              {form.formState.errors.title && (
                <p className="text-xs text-red-600">{form.formState.errors.title.message}</p>
              )}
            </div>
            <div>
              <Label>نوع وعده</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                {...form.register('category')}
              >
                <option value="preworkout">پیش از تمرین</option>
                <option value="breakfast">صبحانه</option>
                <option value="snack1">میان‌وعده</option>
                <option value="lunch">ناهار</option>
                <option value="snack2">میان‌وعده دوم</option>
                <option value="dinner">شام</option>
                <option value="bedtime">پیش از خواب</option>
                <option value="custom">سفارشی</option>
              </select>
            </div>
            <div>
              <Label>تاریخ</Label>
              <Input type="date" {...form.register('date')} />
            </div>
            <div>
              <Label>ساعت</Label>
              <Input type="time" {...form.register('scheduledTime')} />
            </div>
            <div>
              <Label>کالری</Label>
              <Input type="number" {...form.register('calories')} />
              <Button type="button" variant="ghost" size="sm" className="mt-1" onClick={autoCalories}>
                محاسبه از ماکرو
              </Button>
            </div>
            <div>
              <Label>پروتئین (g)</Label>
              <Input type="number" step="0.1" {...form.register('protein')} />
            </div>
            <div>
              <Label>کربوهیدرات (g)</Label>
              <Input type="number" step="0.1" {...form.register('carbs')} />
            </div>
            <div>
              <Label>چربی (g)</Label>
              <Input type="number" step="0.1" {...form.register('fat')} />
            </div>
            <div className="sm:col-span-2">
              <Label>توضیحات</Label>
              <Textarea {...form.register('notes')} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register('consumed')} />
              همین الان مصرف شده
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row justify-between">
            <CardTitle>مواد غذایی</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={() => append({ name: '', amount: 100, unit: 'g' })}>
              افزودن ماده
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="grid gap-2 sm:grid-cols-4">
                <Input placeholder="نام" {...form.register(`ingredients.${index}.name`)} />
                <Input type="number" placeholder="مقدار" {...form.register(`ingredients.${index}.amount`)} />
                <Input placeholder="واحد" {...form.register(`ingredients.${index}.unit`)} />
                <Button type="button" variant="ghost" onClick={() => remove(index)}>
                  حذف
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit">ذخیره</Button>
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            پاک کردن فرم
          </Button>
        </div>
      </form>
    </div>
  );
}
