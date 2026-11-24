import { call } from './api.ts';
import { expect, test } from './fixtures.ts';

// The outings of the partner sites come from the local API in fixture mode (see README.md: partners_transport=fixtures
// and `make harvest-partners` run once). The fixtures are synthetic, dated so that the newest ones are those of the
// harvest day, and hold broken items on purpose: both sources are `degraded`, the expected demo status.

const VANOISE = 14409;

type Row = { source: string; activities: string[]; areas: { document_id: number }[] };

test.beforeAll(async () => {
  const { total } = await call('/partner-outings');
  expect(total, 'partner outings in the API: has `make harvest-partners` run?').toBeGreaterThan(0);
});

test('the menu entry opens the list, grouped by date, with a badge and an external link per partner row', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('a[href="/metaskirando"]').first().click();
  await expect(page).toHaveURL(/\/metaskirando$/);

  const days = page.locator('[data-test=day]');
  await expect(days.first()).toBeVisible();
  const rows = page.locator('.partner-outing-row');
  expect(await days.count()).toBeGreaterThan(1);
  expect(await rows.count()).toBeGreaterThan(await days.count());
  await expect(page.locator('[data-test=date]').first()).toBeVisible();

  for (const [source, label] of [
    ['skitour', 'Skitour'],
    ['gulliver', 'Gulliver'],
  ]) {
    const row = rows.filter({ has: page.locator(`.source-badge--${source}`) }).first();
    await expect(row.locator('.source-badge')).toHaveText(label);
    await expect(row).toHaveAttribute('target', '_blank');
    await expect(row).toHaveAttribute('href', new RegExp(`^https://(www\\.)?${source}\\.`));
    await expect(row).toHaveAttribute('rel', /noopener/);
  }
});

test('the area filter keeps the outings of the area, and the URL follows', async ({ page }) => {
  const all = (await call('/partner-outings?limit=100')) as { items: Row[] };
  const inArea = all.items.filter((item) => item.areas.some((area) => area.document_id === VANOISE));
  expect(inArea.length, `rows in the area ${VANOISE} of the demo data`).toBeGreaterThan(0);
  expect(inArea.length).toBeLessThan(all.items.length);

  await page.goto('/metaskirando');
  const rows = page.locator('.partner-outing-row');
  await expect(rows).toHaveCount(all.items.length);

  await page.locator('.filters').getByRole('textbox').fill('Vanoise');
  await page.locator('.dropdown-item-option').filter({ hasText: 'Vanoise' }).first().click();

  await expect(page).toHaveURL(new RegExp(`[?&]a=${VANOISE}\\b`));
  await expect(rows).toHaveCount(inArea.length);
  await expect(rows.first().locator('.outing-area')).toHaveText('Vanoise');

  // the query is a shareable link
  await page.goto(`/metaskirando?a=${VANOISE}`);
  await expect(rows).toHaveCount(inArea.length);
});

test('the activity filter keeps the outings of the activity', async ({ page }) => {
  const all = (await call('/partner-outings?limit=100')) as { items: Row[] };
  const snowshoeing = all.items.filter((item) => item.activities.includes('snowshoeing'));
  expect(snowshoeing.length).toBeGreaterThan(0);
  expect(snowshoeing.length).toBeLessThan(all.items.length);

  await page.goto('/metaskirando');
  const rows = page.locator('.partner-outing-row');
  await expect(rows).toHaveCount(all.items.length);

  await page.locator('.filters .input-item').and(page.locator('[title*="aquette" i], [title*="snowshoe" i]')).click();

  await expect(page).toHaveURL(/[?&]act=snowshoeing\b/);
  await expect(rows).toHaveCount(snowshoeing.length);
});

test('the sources footer shows the health of each source', async ({ page }) => {
  const { sources } = (await call('/partner-outings/sources')) as { sources: { source: string }[] };
  expect(sources.map((s) => s.source).sort()).toEqual(['gulliver', 'skitour']);

  await page.goto('/metaskirando');
  const footer = page.locator('[data-test=sources] li');
  await expect(footer).toHaveCount(sources.length);
  // (the list answer carries the id of the source only, which the footer then shows)
  for (const { source: name } of sources) {
    // `degraded` is still shown as updated: the source answered, only some items did not parse
    await expect(footer.filter({ hasText: name })).toContainText(/mis à jour|updated/i);
  }
  await expect(page.locator('[data-test=sources] .has-text-danger')).toHaveCount(0);
});

test('an outing of c2c links inside the site', async ({ page }) => {
  // the page has no date filter and the API shows the last 14 days, while the demo database stops in July 2026: its
  // c2c outings only show when the demo data is recent enough
  const { items } = (await call('/partner-outings?sources=c2c&limit=1')) as { items: Row[] };
  test.skip(items.length === 0, 'no recent c2c outing in this database');

  await page.goto('/metaskirando');
  const row = page
    .locator('.partner-outing-row')
    .filter({ has: page.locator('.source-badge--c2c') })
    .first();
  await expect(row).toHaveAttribute('href', /^\/outings\/\d+/);
  await expect(row).not.toHaveAttribute('target', '_blank');
});
