import { expect, test } from '@playwright/test';
test('home clearly labels the bootstrap and proxies API health', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('跟上变化');
  await expect(page.getByText('DEMO · 无需付费凭证')).toBeVisible();
  const live = await request.get('/api/v1/health/live');
  expect(live.ok()).toBe(true);
  expect(await live.json()).toEqual({ status: 'ok', service: 'api' });
});
test('API errors carry a request id and reject unregistered origins', async ({ request }) => {
  const missing = await request.get('http://127.0.0.1:4000/api/v1/missing');
  expect(missing.status()).toBe(404);
  const body = await missing.json();
  expect(body.error.requestId).toBe(missing.headers()['x-request-id']);
  const forbidden = await request.get('http://127.0.0.1:4000/api/v1/health/live', { headers: { Origin: 'https://example.invalid' } });
  expect(forbidden.status()).toBe(403);
});
