import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { MobileBottomNavigation } from '@/components/layout/MobileBottomNavigation';
import { Sidebar } from '@/components/layout/Sidebar';

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-6">
        <div className="mx-auto max-w-5xl p-4 md:p-6">
          <Outlet />
        </div>
      </main>
      <MobileBottomNavigation />
      <Toaster position="top-center" richColors dir="rtl" />
    </div>
  );
}
