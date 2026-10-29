import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AddMealPage } from '@/pages/AddMealPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { MealPlanPage } from '@/pages/MealPlanPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { TodayPage } from '@/pages/TodayPage';
import { WeightPage } from '@/pages/WeightPage';

const basename =
  import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '');

export const router = createBrowserRouter(
  [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'today', element: <TodayPage /> },
      { path: 'meal-plan', element: <MealPlanPage /> },
      { path: 'meals/new', element: <AddMealPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'weight', element: <WeightPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  ],
  { basename },
);
