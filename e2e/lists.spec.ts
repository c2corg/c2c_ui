import { call } from './api.ts';
import { expect, test } from './fixtures.ts';

test('the routes list shows the same documents as cards and as a table', async ({ page }) => {
  // lists come from the API's search (Elasticsearch), which the v6_api syncer fills
  let total = 0;
  await expect
    .poll(async () => (total = (await call('/routes?limit=1')).total), {
      message: 'routes in the API search: is the v6_api syncer running?',
      timeout: 30_000,
    })
    .toBeGreaterThan(0);

  await page.goto('/routes');
  const cards = page.locator('.document-card');
  await expect(cards.first()).toBeVisible();
  const count = await cards.count();
  expect(count).toBe(Math.min(total, 30));

  await page.locator('[data-icon="table-list"]').first().click();

  const rows = page
    .getByRole('grid')
    .getByRole('row')
    .filter({ has: page.getByRole('gridcell') });
  await expect(rows.first()).toBeVisible();
  await expect(rows).toHaveCount(count);
  await expect(rows.first().getByRole('link')).toBeVisible();
});
