import { call } from './api.mjs';
import { expect, test } from './fixtures.mjs';

test('the CSV export of the documents table downloads one file, also after coming back', async ({ page, data }) => {
  await expect
    .poll(async () => (await call('/routes?limit=1')).total, {
      message: 'routes in the API search: is the v6_api syncer running?',
      timeout: 30_000,
    })
    .toBeGreaterThan(0);

  const downloads = [];
  page.on('download', (download) => downloads.push(download.suggestedFilename()));
  const exportButton = page.getByRole('button', { name: 'Exporter en CSV' });

  await page.goto('/routes');
  if (!(await page.getByRole('grid').isVisible())) {
    await page.locator('[data-icon="table-list"]').first().click(); // table mode, remembered
  }
  await expect(page.getByRole('grid').getByRole('gridcell').first()).toBeVisible();
  await exportButton.click();
  await expect.poll(() => downloads).toHaveLength(1);
  expect(downloads[0]).toMatch(/\.csv$/);

  // the table is destroyed, then created again: its export listener must not be added twice
  await page.goto(`/waypoints/${data.waypoint}`);
  await page.goto('/routes');
  await expect(page.getByRole('grid').getByRole('gridcell').first()).toBeVisible();
  await exportButton.click();
  await expect.poll(() => downloads).toHaveLength(2);
  await page.waitForTimeout(1000); // a second listener would download a third file
  expect(downloads).toHaveLength(2);
});
