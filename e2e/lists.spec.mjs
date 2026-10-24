import { call } from './api.mjs';
import { expect, test } from './fixtures.mjs';

test('the routes list shows the same documents as cards and as a table', async ({ page }) => {
  // lists come from the API's search (Elasticsearch)
  const { total } = await call('/routes?limit=1');
  test.skip(!total, 'no route in the API search index');

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
