import { useEffect, useRef } from 'react';
import { Outlet, ScrollRestoration, useLocation, useNavigate, useRouteError } from 'react-router';
import { useSessionStore } from '../features/session/session-store';
import { Toaster } from '../features/toast/Toaster';
import { setUnauthorizedHandler } from '../lib/api-client';
import { loginPathWithReturn } from '../lib/home-path';
import { ErrorBoundary, ErrorFallback } from './ErrorBoundary';

/** A 401 from any API call: drop the session and go to A01 with returnTo (no hard reload). */
function useUnauthorizedRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const current = useRef(location.pathname + location.search);
  useEffect(() => {
    current.current = location.pathname + location.search;
  }, [location]);
  useEffect(
    () =>
      setUnauthorizedHandler(() => {
        useSessionStore.getState().clear();
        void navigate(loginPathWithReturn(current.current), { replace: true });
      }),
    [navigate],
  );
}

export function RootLayout() {
  useUnauthorizedRedirect();
  return (
    <ErrorBoundary>
      <Outlet />
      <Toaster />
      <ScrollRestoration />
    </ErrorBoundary>
  );
}

/** Router-level errors (e.g. a lazy chunk that fails to load). */
export function RouteError() {
  return <ErrorFallback error={useRouteError()} />;
}
