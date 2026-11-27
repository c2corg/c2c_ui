import { expect, test } from './fixtures.ts';

test.use({ loggedIn: true });

test('the navbar menus close when one of their links is clicked', async ({ page }) => {
  const openMenus = page.locator('.navigation .dropdown.is-active');
  await page.goto('/');

  await page.locator('.add-button .dropdown-trigger').first().click();
  await expect(openMenus).toHaveCount(1);
  await page
    .locator('.add-button .dropdown-item')
    .filter({ hasText: /sortie/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/outings\/add\//);
  await expect(openMenus).toHaveCount(0);

  await page.goto('/');
  await page
    .locator('.navigation .dropdown-trigger')
    .filter({ has: page.locator('img[alt=Avatar]') })
    .click();
  await expect(openMenus).toHaveCount(1);
  await page.locator('.navigation .dropdown.is-active .dropdown-item[href*="account"]').first().click();
  await expect(page).toHaveURL(/\/account/);
  await expect(openMenus).toHaveCount(0);
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the user menu is as wide as its longest item', async ({ page }) => {
    await page.goto('/');
    await page
      .locator('.navigation .dropdown-trigger')
      .filter({ has: page.locator('img[alt=Avatar]') })
      .click();
    const items = page.locator('.navigation .dropdown.is-active .dropdown-item');
    await expect(items.filter({ hasText: /traqueurs/i })).toBeVisible();
    for (const item of await items.all()) {
      expect(await item.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
  });
});
