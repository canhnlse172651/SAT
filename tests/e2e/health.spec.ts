// Walking-skeleton e2e: proves browser → SPA → API → MongoDB. Infrastructure only, so it cites no AC.
import { expect, test } from '@playwright/test';

test('the app loads and the API reports healthy', async ({ page, request }) => {
  // `/` is HomeRedirect now: an anonymous visitor lands on A01 (the old "SAT / API is healthy" page is gone).
  await page.goto('/');
  await expect(page).toHaveURL(/\/dang-nhap/);
  expect((await request.get('/api/health')).status()).toBe(200);
});

test('readiness reports MongoDB as up', async ({ request }) => {
  const res = await request.get('/api/ready');
  expect(res.status()).toBe(200);
  expect(await res.json()).toMatchObject({ checks: { mongo: 'up' } });
});
