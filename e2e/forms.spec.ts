import type { E2eData } from './api.ts';
import { expect, test } from './fixtures.ts';

test.use({ loggedIn: true });

const pages = (data: E2eData) => [`/outings/edit/${data.editedOuting}/fr`, `/routes/edit/${data.route}/fr`, '/yeti'];

test('the form ids are unique, and every label points to one element', async ({ page, data }) => {
  await page.addInitScript(() =>
    localStorage.setItem('Yeti.preferences', JSON.stringify({ 'yeti-disclaimer': 'validated' }))
  );
  for (const path of pages(data)) {
    await page.goto(path);
    await expect(page.locator('[id^="c2c-"], [id^="layer-checkbox"]').first()).toBeAttached();

    const report = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
      const labels = [...document.querySelectorAll<HTMLLabelElement>('label[for]')];
      return {
        duplicates: ids.filter((id, i) => ids.indexOf(id) !== i),
        orphanLabels: labels
          .filter((label) => document.querySelectorAll(`[id="${CSS.escape(label.htmlFor)}"]`).length !== 1)
          .map((label) => label.htmlFor),
      };
    });
    expect(report, path).toEqual({ duplicates: [], orphanLabels: [] });
  }
});

test('clicking a checkbox label checks its input', async ({ page, data }) => {
  await page.goto(`/outings/edit/${data.editedOuting}/fr`);
  const label = page
    .locator('label[for^="c2c-"]:visible')
    .filter({ hasNot: page.locator('input') })
    .first();
  await expect(label).toBeVisible();
  const input = page.locator(`[id="${await label.getAttribute('for')}"]`);
  const before = await input.isChecked();

  await label.click();

  await expect(input).toBeChecked({ checked: !before });
});
