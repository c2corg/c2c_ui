import { expect, test } from './fixtures.mjs';

const switchTo = async (page, label) => {
  await page.locator('.navigation-item .dropdown-trigger button.button').first().click();
  await page.locator('.dropdown.is-active .dropdown-content a', { hasText: label }).first().click();
};

test('switches the language from the navbar, and keeps it after a reload', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');

  await switchTo(page, 'Deutsch');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.getByText('Einloggen').first()).toBeVisible();

  await page.reload();
  await expect(page.getByText('Einloggen').first()).toBeVisible();
});
