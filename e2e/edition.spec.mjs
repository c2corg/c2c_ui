import { call } from './api.mjs';
import { expect, test } from './fixtures.mjs';

test.use({ loggedIn: true });

test('an edit form asks before leaving with unsaved changes', async ({ page, data }) => {
  await page.goto(`/routes/edit/${data.route}/fr`);
  await expect(page.getByRole('button', { name: 'Enregistrer' }).first()).toBeVisible();
  await page.locator('textarea').first().fill('changed');

  const answers = ['dismiss', 'accept'];
  const asked = [];
  page.on('dialog', (dialog) => {
    asked.push(dialog.message());
    return dialog[answers.shift()]();
  });

  await page.locator('a[href="/"]').first().click();
  await expect.poll(() => asked.length).toBe(1);
  await expect(page).toHaveURL(new RegExp(`/routes/edit/${data.route}/fr`));

  await page.locator('a[href="/"]').first().click();
  await expect.poll(() => asked.length).toBe(2);
  await expect(page).toHaveURL(/\/$/);
});

test('the outing form limits the dates, and saves them', async ({ page, data }) => {
  await page.goto(`/outings/edit/${data.editedOuting}/fr`);
  const save = page.getByRole('button', { name: 'Enregistrer' }).first();
  await expect(save).toBeVisible();

  const dates = page.locator('input[type=date]');
  // no date in the future: the form sets the max on click (today, or the end date if before)
  const today = new Date().toISOString().slice(0, 10);
  await dates.first().click();
  expect(await dates.first().getAttribute('max')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect((await dates.first().getAttribute('max')) <= today).toBe(true);

  const start = `2026-0${1 + Math.floor(Math.random() * 8)}-05`;
  const end = start.replace(/05$/, '07');
  await dates.first().fill(start);
  if (!(await dates.nth(1).isVisible())) {
    await page.getByText('Plusieurs jours ?').click();
  }
  await dates.nth(1).click();
  await expect(dates.nth(1)).toHaveAttribute('min', start);
  await dates.nth(1).fill(end);

  await Promise.all([
    page.waitForResponse(
      (response) => response.url().endsWith(`/outings/${data.editedOuting}`) && response.request().method() === 'PUT'
    ),
    save.click(),
  ]);

  const outing = await call(`/outings/${data.editedOuting}`);
  expect([outing.date_start, outing.date_end]).toEqual([start, end]);

  await page.goto(`/outings/edit/${data.editedOuting}/fr`);
  await expect(dates.first()).toHaveValue(start);
});
