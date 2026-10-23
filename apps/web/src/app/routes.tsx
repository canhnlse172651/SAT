import type { RouteObject } from 'react-router';
import { RedirectIfSignedIn } from '../features/auth/RedirectIfSignedIn';
import { HomeRedirect } from '../features/session/HomeRedirect';
import { RequireRole } from '../features/session/RequireRole';
import { AuthLayout } from '../layouts/AuthLayout';
import { RoleShell } from '../layouts/RoleShell';
import { StudentShell } from '../layouts/StudentShell';
import { TeacherShell } from '../layouts/TeacherShell';
import { homePath, NOT_FOUND_PATH } from '../lib/home-path';
import { NotFoundPage } from '../pages/NotFoundPage';
import { RootLayout, RouteError } from './RootLayout';
import { SCREEN_PAGES } from './screen-pages';
import { SCREENS, type Screen, type ScreenArea } from './screens';

/** Each module replaces its screen's loader with the real page; until then a placeholder shows. */
function screenRoute(screen: Screen): RouteObject {
  const page = SCREEN_PAGES[screen.id];
  return {
    path: screen.path,
    lazy: async () => {
      if (page) {
        const Page = await page();
        return { element: <Page /> };
      }
      const { PlaceholderPage } = await import('../pages/PlaceholderPage');
      return { element: <PlaceholderPage id={screen.id} name={screen.name} /> };
    },
  };
}

const inArea = (area: ScreenArea) => SCREENS.filter((s) => s.area === area).map(screenRoute);

export function createAppRoutes(): RouteObject[] {
  const devRoutes: RouteObject[] = import.meta.env.DEV
    ? [
        {
          path: '/dev/ui',
          lazy: async () => {
            const { UiCatalog } = await import('../pages/dev/UiCatalog');
            return { element: <UiCatalog /> };
          },
        },
        {
          path: '/dev/login',
          lazy: async () => {
            const { DevLoginPage } = await import('../pages/dev/DevLoginPage');
            return { element: <DevLoginPage /> };
          },
        },
      ]
    : [];

  return [
    {
      element: <RootLayout />,
      errorElement: <RouteError />,
      children: [
        { path: '/', element: <HomeRedirect /> },
        {
          // A01–A03: a signed-in user goes to the role home (001 AC-3.5).
          element: <RedirectIfSignedIn />,
          children: [{ element: <AuthLayout />, children: inArea('auth') }],
        },
        ...devRoutes,
        {
          // T01–T27: an HV is sent to S01 (001 AC-16.3, AC-20.10).
          element: <RequireRole role="GV" otherwise={homePath('HV')} />,
          children: [{ element: <TeacherShell />, children: inArea('gv') }],
        },
        {
          // S01–S12: a GV is sent to T01 (001 AC-16.4).
          element: <RequireRole role="HV" otherwise={homePath('GV')} />,
          children: [{ element: <StudentShell />, children: inArea('hv') }],
        },
        {
          // S13–S20: a GV gets A05 (001 AC-20.4).
          element: <RequireRole role="HV" otherwise={NOT_FOUND_PATH} />,
          children: [{ element: <StudentShell />, children: inArea('selfStudy') }],
        },
        {
          // A05 sits in the signed-in role's shell (prototype); bare for visitors.
          element: <RoleShell />,
          children: [
            { path: NOT_FOUND_PATH, element: <NotFoundPage /> },
            { path: '*', element: <NotFoundPage /> },
          ],
        },
      ],
    },
  ];
}
