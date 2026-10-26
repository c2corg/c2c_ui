import { expect, test } from './fixtures.mjs';

test.beforeEach(async ({ page }) => {
  // disclaimer accepted: until then, the Yeti content is hidden
  await page.addInitScript(() =>
    localStorage.setItem('Yeti.preferences', JSON.stringify({ 'yeti-disclaimer': 'validated' }))
  );
});

test('Yeti shows its map, and the down arrow on a tab moves the focus to its panel', async ({ page }) => {
  await page.goto('/yeti');
  await expect(page.locator('.ol-viewport canvas').first()).toBeVisible();

  const tab = page.locator('[role=tab][aria-selected=true]');
  await tab.focus();
  await page.keyboard.press('ArrowDown');

  await expect(
    page
      .locator('[role=tabpanel]')
      .filter({ has: page.locator(':focus') })
      .or(page.locator('[role=tabpanel]:focus'))
  ).toHaveCount(1);
});
