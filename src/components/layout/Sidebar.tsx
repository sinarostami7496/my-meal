import { NavLink } from 'react-router-dom';
import {
  CalendarDays,
  ChartColumn,
  Home,
  PlusCircle,
  Scale,
  Settings,
  UtensilsCrossed,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { to: '/', label: 'داشبورد', icon: Home },
  { to: '/today', label: 'امروز', icon: CalendarDays },
  { to: '/meal-plan', label: 'برنامه غذایی', icon: UtensilsCrossed },
  { to: '/meals/new', label: 'ثبت وعده', icon: PlusCircle },
  { to: '/reports', label: 'گزارش‌ها', icon: ChartColumn },
  { to: '/weight', label: 'وزن', icon: Scale },
  { to: '/settings', label: 'تنظیمات', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-56 flex-col border-l border-slate-200 bg-white p-4 gap-1 shrink-0">
      <p className="mb-4 text-lg font-bold text-primary">حجم پاک من</p>
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive ? 'bg-teal-50 text-primary' : 'text-slate-600 hover:bg-slate-50',
            )
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </aside>
  );
}
