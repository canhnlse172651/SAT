// Walking-skeleton e2e: proves browser → SPA → API → MongoDB. Infrastructure only, so it cites no AC.
import { expect, test } from '@playwright/test';

test('the app loads and reports a healthy API', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'SAT' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('API is healthy');
});

test('readiness reports MongoDB as up', async ({ request }) => {
  const res = await request.get('/api/ready');
  expect(res.status()).toBe(200);
  expect(await res.json()).toMatchObject({ checks: { mongo: 'up' } });
});
