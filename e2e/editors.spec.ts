import { expandSections, expect, test } from './fixtures.ts';

test.use({ loggedIn: true });

test('the markdown editor: toolbar on the selection, and the preview cooked by the API', async ({ page, data }) => {
  await page.goto(`/routes/edit/${data.route}/fr`);
  const preview = page.getByRole('button', { name: 'Prévisualiser' }).first();
  await expect(preview).toBeVisible();
  await expandSections(page);

  const textarea = page.locator('textarea').first();
  await textarea.fill('Texte saisi E2E markdown');
  await textarea.evaluate((element: HTMLTextAreaElement) => {
    element.focus();
    element.setSelectionRange(element.value.indexOf('E2E'), element.value.indexOf('E2E') + 3);
  });
  await page.locator('.button:has([data-icon="bold"])').first().click();
  await expect(textarea).toHaveValue('Texte saisi **E2E** markdown');

  await Promise.all([
    page.waitForResponse((response) => response.url().includes('/cooker') && response.ok()),
    preview.click(),
  ]);
  await expect(page.locator('strong', { hasText: 'E2E' }).first()).toBeVisible();
  await expect(page.getByText('E2E voie').first()).toBeVisible(); // the document view of the draft
});

test('the cotometer gives a ski rating, set in the ski rating field', async ({ page, data }) => {
  await page.goto(`/outings/add/fr?r=${data.route}&act=skitouring`);
  await expect(page.getByRole('button', { name: 'Enregistrer' }).first()).toBeVisible();
  await expandSections(page);

  const prefix = page.locator('.button.prefix', { hasText: '?' }).first();
  await prefix.click();
  const cotometer = page.locator('.modal.is-active');
  await expect(cotometer).toBeVisible();

  await cotometer.locator('input[type=radio]').first().check();
  const numbers = cotometer.locator('input[type=number]');
  await numbers.nth(0).fill('35');
  await numbers.nth(1).fill('500');
  const rating = (await cotometer.locator('h1 .has-text-success').innerText()).trim();
  expect(rating).not.toBe('');
  await cotometer.getByRole('button', { name: 'Ok' }).click();

  await expect(cotometer).toBeHidden();
  await expect(prefix.locator('xpath=..').locator('select, input').first()).toHaveValue(rating);
});
