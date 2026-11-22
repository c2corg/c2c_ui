import type { Page } from '@playwright/test';

import { expect, test } from './fixtures.ts';

const canonical = (page: Page) => page.locator('link[rel=canonical]').getAttribute('href');

test('a waypoint page shows the document and its map, with tiles', async ({ page, data }) => {
  const tiles: string[] = [];
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

// ad blockers hide the elements named as ads (.ad, .ad-slot...): the room under the top bar must not depend on them
const AD_BLOCKER_CSS = '.ad, .ad-slot, .ams-ad, #camptocamp_htd { display: none !important; }';

for (const [layout, viewport, bar] of [
  ['phone', { width: 390, height: 844 }, '.mobile-top-bar'],
  ['computer', { width: 1100, height: 900 }, '.navigation'],
] as const) {
  test.describe(`on a ${layout}, with an ad blocker`, () => {
    test.use({ viewport });

    test('the top bar does not hide the buttons of a document', async ({ page, data }) => {
      await page.goto(`/routes/${data.route}`);
      await page.addStyleTag({ content: AD_BLOCKER_CSS });
      await expect(page.locator('.view-container h1')).toContainText('E2E voie');

      const barBottom = (await page.locator(bar).first().boundingBox())!;
      const buttons = (await page.locator('.view-container .box .button-bar').first().boundingBox())!;
      expect(buttons.y).toBeGreaterThanOrEqual(barBottom.y + barBottom.height);
    });
  });
}
