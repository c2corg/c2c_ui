import { credentials } from './api.mjs';
import { expect, logIn, test } from './fixtures.mjs';

const userMenu = (page) =>
  page.locator('.navigation .dropdown-trigger').filter({ has: page.locator('img[alt=Avatar]') });

test('logs in, keeps the session after a reload, and logs out', async ({ page, data }) => {
  await page.goto('/auth');
  await logIn(page, credentials);
  await expect(userMenu(page)).toBeVisible();

  await page.reload();
  await expect(userMenu(page)).toBeVisible();

  // the API requests carry the token
  const [request] = await Promise.all([
    page.waitForRequest((request) => request.url().includes(`/outings/${data.outing}`) && request.method() === 'GET'),
    page.goto(`/outings/edit/${data.outing}/fr`),
  ]);
  expect(request.headers()['authorization']).toMatch(/^JWT token=/);

  await page.goto('/');
  await userMenu(page).click();
  await page.locator('.navigation .dropdown.is-active .dropdown-content a').last().click(); // logout is the last item
  await expect(page.getByRole('link', { name: 'Se connecter' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('link', { name: 'Se connecter' })).toBeVisible();
  await expect(userMenu(page)).toBeHidden();
});

test('a page for logged users goes to the login, then back to that page', async ({ page }) => {
  await page.goto('/account');
  await expect(page).toHaveURL(/\/auth\?redirect=/);

  await logIn(page, credentials);

  await expect(page).toHaveURL(/\/account$/);
});
