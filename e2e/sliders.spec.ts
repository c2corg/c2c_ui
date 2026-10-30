import type { Locator } from '@playwright/test';

import { expect, test } from './fixtures.ts';

const value = (locator: Locator) => locator.getAttribute('aria-valuenow').then(Number);

test('the range sliders of the list filters have names, move with the keyboard and update the query', async ({
  page,
}) => {
  await page.goto('/routes?act=rock_climbing');
  await page.locator('.dropdown-trigger', { hasText: 'Cotations' }).first().click();

  const handles = page.locator('.dropdown.is-active').getByRole('slider');
  await expect(handles.first()).toBeVisible();
  for (const handle of await handles.all()) {
    await expect(handle).toHaveAccessibleName(/\S/);
  }

  const query = new URL(page.url()).search;
  await handles.first().focus();
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('ArrowRight');
  }
  await page.keyboard.press('Tab'); // the filters apply on change

  await expect.poll(() => new URL(page.url()).search).not.toBe(query);
});

test('the opacity slider of a map layer has a name and moves with the keyboard', async ({ page, data }) => {
  await page.goto(`/waypoints/${data.waypoint}`);
  await page.locator('.ol-control-layer-switcher-button button').first().click();

  // the first layer with settings
  const buttons = page.locator('.ol-control-layer-switcher .layer-button');
  await expect(buttons.first()).toBeVisible();
  for (const button of await buttons.all()) {
    await button.click();
    if (await page.locator('.layer-button-config').count()) {
      break;
    }
  }
  await page.locator('.layer-button-config').first().click();

  const handle = page.locator('.layer-button-slider').getByRole('slider').first();
  await expect(handle).toHaveAccessibleName(/\S/);
  const before = await value(handle);
  await handle.focus();
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  expect(await value(handle)).toBeLessThan(before);
});

test('the opacity slider of a Yeti layer gets the focus from its label, and moves with the keyboard', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('Yeti.preferences', JSON.stringify({ 'yeti-disclaimer': 'validated' }))
  );
  await page.goto('/yeti');
  await page.getByRole('tab').first().click(); // the layers (an icon)
  await page.locator('.layer-item', { hasText: 'IGN' }).first().click();
  await page.locator('.layer-controls [data-icon="gear"]').first().click();

  await page.locator('.layer-controls .label', { hasText: 'Opacité' }).first().click();

  const handle = page.locator(':focus');
  await expect(handle).toHaveRole('slider');
  await expect(handle).toHaveAccessibleName(/\S/);
  const before = await value(handle);
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  expect(await value(handle)).toBeLessThan(before);
});
