// Shared e2e helpers. Sessions come from the dev-only POST /api/dev/session (NODE_ENV=test server),
// which signs in as a user seeded by tests/e2e/server.mjs.
import type { Page } from '@playwright/test';

export type Role = 'GV' | 'HV';

export interface SignedIn {
  user: { id: string; role: Role; displayName: string };
  workspace: { id: string; name: string };
}

const ORIGIN = `http://127.0.0.1:${process.env.PORT ?? '4173'}`;

/** Signs `page`'s browser context in (session cookie is stored in the context) and returns who it is. */
export async function loginAs(page: Page, role: Role): Promise<SignedIn> {
  const res = await page.request.post('/api/dev/session', {
    data: { role },
    headers: { Origin: ORIGIN },
  });
  if (res.status() !== 201) {
    throw new Error(`loginAs(${role}) failed: ${res.status()} ${await res.text()}`);
  }
  return (await res.json()) as SignedIn;
}
