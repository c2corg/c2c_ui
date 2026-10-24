import { expect, test } from './fixtures.mjs';

test.use({ gdprChosen: false });

test('the GDPR banner shows after the first interaction, and not again once the user chose', async ({ page }) => {
  const banner = page.locator('.gdpr-content');
  await page.goto('/');
  await expect(banner).not.toHaveClass(/active/);

  await page.mouse.wheel(0, 200);
  await expect(banner).toHaveClass(/active/);

  await page.getByRole('button', { name: 'Tout refuser' }).click();
  await expect(banner).not.toHaveClass(/active/);
  const choice = await page.evaluate(() => JSON.parse(localStorage.getItem('Gdpr.preferences')).choice);
  expect(choice).toMatchObject({ statistics: false });

  await page.reload();
  await page.mouse.wheel(0, 200);
  await expect(banner).not.toHaveClass(/active/);
});
