import { API } from './api.mjs';
import { expect, test } from './fixtures.mjs';

// 3 pages of 30 changes, then an empty one
const change = (page, i) => ({
  written_at: '2026-10-18T19:25:40+00:00',
  lang: 'fr',
  document: { version: 1, document_id: 1000 + page * 100 + i, title: `Doc ${page}-${i}`, type: 'w', quality: 'draft' },
  user: { user_id: 1, name: 'E2E Tester', username: 'e2etester', lang: 'fr' },
  version_id: page * 100 + i,
  comment: `change ${page}-${i}`,
});

test('the recent changes load the next page on scroll, until the end of the feed', async ({ page, baseURL }) => {
  const requested = [];
  await page.route(`${API}/documents/changes**`, (route) => {
    const token = Number(new URL(route.request().url()).searchParams.get('token') ?? 1);
    requested.push(token);
    const feed = token <= 3 ? Array.from({ length: 30 }, (_, i) => change(token, i)) : [];
    return route.fulfill({
      json: { pagination_token: String(token + 1), feed },
      headers: { 'access-control-allow-origin': new URL(baseURL).origin },
    });
  });
  const changes = page.locator('table tr').filter({ has: page.locator('td') });

  await page.goto('/whatsnew');
  await expect(changes).toHaveCount(30);
  expect(requested).toEqual([1]);

  for (const count of [60, 90]) {
    await page.mouse.wheel(0, 20000);
    await expect(changes).toHaveCount(count);
  }
  await page.mouse.wheel(0, 20000);
  await expect.poll(() => requested).toEqual([1, 2, 3, 4]);

  await page.mouse.wheel(0, 20000);
  await page.mouse.wheel(0, 20000);
  await expect(changes).toHaveCount(90);
  expect(requested).toEqual([1, 2, 3, 4]);
});
