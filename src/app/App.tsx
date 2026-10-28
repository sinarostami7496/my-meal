import { RouterProvider } from 'react-router-dom';
import { router } from '@/app/routes';
import { AppProvider } from '@/context/AppContext';

export function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
}
