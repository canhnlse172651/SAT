import { createBrowserRouter, RouterProvider } from 'react-router';
import { createAppRoutes } from './routes';

const router = createBrowserRouter(createAppRoutes());

export function AppRouter() {
  return <RouterProvider router={router} />;
}
