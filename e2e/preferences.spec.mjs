import { expect, test } from './fixtures.mjs';

// what existing users have in localStorage, under the keys of the former versions
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-preferences')) {
      return;
    }
    sessionStorage.setItem('e2e-preferences', '1');
    localStorage.setItem('DocumentsView.preferences', JSON.stringify({ 'route.listMode': true }));
    localStorage.setItem('Yeti.preferences', JSON.stringify({ 'yeti-disclaimer': 'validated' }));
  });
});

test('the stored list mode applies, and a change is saved under the same key', async ({ page }) => {
  await page.goto('/routes');
  await expect(page.getByRole('grid')).toBeVisible();

  await page.locator('[data-icon="table-list"]').first().click();

  await expect(page.getByRole('grid')).toBeHidden();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('DocumentsView.preferences')));
  expect(stored).toMatchObject({ 'route.listMode': false });
});

test('the stored Yeti disclaimer choice applies', async ({ page }) => {
  await page.goto('/yeti');
  await expect(page.locator('.ol-viewport canvas').first()).toBeVisible();
  await expect(page.locator('.yeti-overlay form')).toHaveCount(0);
});
