import { Badge } from '@/components/ui/badge';
import type { MealDisplayStatus } from '@/types/meal';

const labels: Record<MealDisplayStatus, string> = {
  pending: 'در انتظار',
  upcoming: 'پیش‌رو',
  current: 'اکنون',
  consumed: 'مصرف شده',
  skipped: 'رد شده',
  missed: 'از دست رفته',
};

const variants: Record<MealDisplayStatus, 'default' | 'info' | 'success' | 'warning' | 'danger' | 'secondary'> = {
  pending: 'secondary',
  upcoming: 'info',
  current: 'default',
  consumed: 'success',
  skipped: 'secondary',
  missed: 'danger',
};

export function MealStatusBadge({ status }: { status: MealDisplayStatus }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}
