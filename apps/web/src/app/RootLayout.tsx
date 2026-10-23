import { useEffect, useRef } from 'react';
import { Outlet, ScrollRestoration, useLocation, useNavigate, useRouteError } from 'react-router';
import { useSessionStore } from '../features/session/session-store';
import { Toaster } from '../features/toast/Toaster';
import { type LoginNoticeState, sessionNotice } from '../features/session/session-notice';
import { sessionFailureReason, setUnauthorizedHandler } from '../lib/api-client';
import { loginPathWithReturn } from '../lib/home-path';
import { ErrorBoundary, ErrorFallback } from './ErrorBoundary';

/** A 401 from any API call: drop the session and go to A01 with returnTo and the reason's notice (no hard reload). */
function useUnauthorizedRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const current = useRef(location.pathname + location.search);
  useEffect(() => {
    current.current = location.pathname + location.search;
  }, [location]);
  useEffect(
    () =>
      setUnauthorizedHandler((error) => {
        const reason = sessionFailureReason(error);
        useSessionStore.getState().clear(reason);
        const state: LoginNoticeState = { notice: sessionNotice(reason) };
        void navigate(loginPathWithReturn(current.current), { replace: true, state });
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
