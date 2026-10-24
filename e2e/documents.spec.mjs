import { expect, test } from './fixtures.mjs';

const canonical = (page) => page.locator('link[rel=canonical]').getAttribute('href');

test('a waypoint page shows the document and its map, with tiles', async ({ page, data }) => {
  const tiles = [];
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (response.request().resourceType() === 'image' && url.hostname !== 'localhost' && response.ok()) {
      tiles.push(url.hostname);
    }
  });

  await page.goto(`/waypoints/${data.waypoint}`);

  await expect(page.locator('h1')).toContainText('E2E sommet');
  await expect(page.getByText('2500', { exact: false }).first()).toBeVisible();
  await expect(page.locator('.ol-viewport canvas').first()).toBeVisible();
  await expect.poll(() => tiles.length, { message: 'map tiles loaded' }).toBeGreaterThan(0);
});

test('a route page shows the document, its waypoint and its outing', async ({ page, data }) => {
  await page.goto(`/routes/${data.route}`);

  await expect(page.locator('h1')).toContainText('E2E voie');
  await expect(page.locator(`a[href^="/waypoints/${data.waypoint}"]`).first()).toBeVisible();
  await expect(page.locator(`a[href^="/outings/${data.outing}"]`).first()).toBeVisible();
});

test('an outing page shows the document and its route', async ({ page, data }) => {
  await page.goto(`/outings/${data.outing}`);

  await expect(page.locator('h1')).toContainText('E2E sortie');
  await expect(page.locator(`a[href^="/routes/${data.route}"]`).first()).toBeVisible();
});

test('the head tags follow an in-app navigation', async ({ page, data }) => {
  await page.goto(`/routes/${data.route}`);
  await expect(page.locator('h1')).toContainText('E2E voie');
  expect(await canonical(page)).toContain(`/routes/${data.route}`);
  await expect(page).toHaveTitle(/E2E voie/);

  await page.locator(`a[href^="/waypoints/${data.waypoint}"]`).first().click();

  await expect(page.locator('h1')).toContainText('E2E sommet');
  await expect.poll(() => canonical(page)).toContain(`/waypoints/${data.waypoint}`);
  await expect(page).toHaveTitle(/E2E sommet/);
  expect(await page.locator('meta[property="og:title"]').getAttribute('content')).toContain('E2E sommet');
});
