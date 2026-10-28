import { NavLink } from 'react-router-dom';
import { CalendarDays, ChartColumn, Home, Scale, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { to: '/', label: 'خانه', icon: Home },
  { to: '/today', label: 'امروز', icon: CalendarDays },
  { to: '/meal-plan', label: 'برنامه', icon: UtensilsCrossed },
  { to: '/reports', label: 'گزارش', icon: ChartColumn },
  { to: '/weight', label: 'وزن', icon: Scale },
];

export function MobileBottomNavigation() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 flex border-t border-slate-200 bg-white md:hidden no-print">
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs',
              isActive ? 'text-primary font-medium' : 'text-slate-500',
            )
          }
        >
          <Icon className="h-5 w-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
