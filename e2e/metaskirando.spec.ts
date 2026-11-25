import { call } from './api.ts';
import { expect, test } from './fixtures.ts';

// The outings of the partner sites come from the local API in fixture mode (see README.md: partners_transport=fixtures
// and `make harvest-partners` run once). The fixtures are synthetic, dated so that the newest ones are those of the
// harvest day, and hold broken items on purpose: some sources may be `degraded`, which is fine.

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
  // the selection stays visible next to the input
  await expect(page.locator('[data-test=areas] .tag')).toContainText('Vanoise');

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
  const { sources } = (await call('/partner-outings/sources')) as {
    sources: { source: string; site_name: string; site_url: string }[];
  };
  // the demo data has at least these two; other sources may be added without breaking the test
  expect(sources.map((s) => s.source)).toEqual(expect.arrayContaining(['gulliver', 'skitour']));

  await page.goto('/metaskirando');
  const footer = page.locator('[data-test=sources] li');
  await expect(footer).toHaveCount(sources.length);
  // the footer names the sources with `site_name`, linked to `site_url` (the list answer has the ids only)
  for (const { source, site_name, site_url } of sources) {
    const line = footer.filter({ hasText: site_name });
    // `degraded` is still shown as updated: the source answered, only some items did not parse
    await expect(line).toContainText(/mis à jour|updated/i);
    await expect(line.locator('a')).toHaveAttribute('href', site_url);
    expect(source).toBeTruthy();
  }
  await expect(page.locator('[data-test=sources] .has-text-danger')).toHaveCount(0);
});

test('the activity icon of a non-ski row follows its activity', async ({ page }) => {
  const all = (await call('/partner-outings?limit=100')) as { items: (Row & { title: string; author: unknown })[] };
  await page.goto('/metaskirando');
  const rows = page.locator('.partner-outing-row');
  await expect(rows).toHaveCount(all.items.length);

  // the activity icon of a non-ski row is the one of its activity, not the ski one
  for (const activity of ['snowshoeing', 'hiking', 'rock_climbing']) {
    const item = all.items.find((i) => i.source === 'gulliver' && i.activities.includes(activity));
    expect(item, `a gulliver row of ${activity} in the demo data`).toBeTruthy();
    const row = rows.filter({ hasText: item!.title }).first();
    await expect(row.locator('.activity-icons svg')).toHaveAttribute('data-icon', activity);
  }
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

// the map beside the list: one marker per outing that has a geometry, coloured by source
type Located = Row & { id: string; title: string; geometry: { geom: string; quality: string } | null };
const APPROXIMATE = ['summit', 'area_centroid'];

test('the map has a marker per located outing, coloured by source, the approximate ones apart', async ({ page }) => {
  const all = (await call('/partner-outings?limit=100')) as { items: Located[] };
  const located = all.items.filter((item) => item.geometry);
  const approximate = located.filter((item) => APPROXIMATE.includes(item.geometry!.quality));
  expect(located.length, 'located outings in the demo data').toBeGreaterThan(0);
  expect(approximate.length, 'approximate outings (summit) in the demo data').toBeGreaterThan(0);
  expect(approximate.length).toBeLessThan(located.length);

  await page.goto('/metaskirando');
  const markers = page.locator('.outing-marker');
  await expect(markers).toHaveCount(located.length);
  await expect(markers.and(page.locator('.is-approximate'))).toHaveCount(approximate.length);

  // the colours of the badges, per source
  const colorOf = (marker: ReturnType<typeof page.locator>) =>
    marker.locator('.outing-marker-dot').evaluate((el) => el.style.getPropertyValue('--marker-color'));
  expect(await colorOf(page.locator('.outing-marker[data-source=skitour]').first())).toBe('#1c5a8c');
  expect(await colorOf(page.locator('.outing-marker[data-source=gulliver]').first())).toBe('#1f6a35');

  // the tooltip says the location is approximate, and the legend explains it
  const rough = page.locator(`.outing-marker[data-outing-id="${approximate[0].id}"]`);
  await expect(rough).toHaveAttribute('title', /approximate|approximative/i);
  await expect(page.locator('[data-test=legend-approximate]')).toBeVisible();

  // the rows without a location stay in the list, and are counted
  const without = all.items.length - located.length;
  await expect(page.locator('.partner-outing-row')).toHaveCount(all.items.length);
  if (without > 0) {
    await expect(page.locator('[data-test=without-location]')).toContainText(String(without));
  }
});

test('hovering a row highlights its marker and the other way round, a click on a marker scrolls to its row', async ({
  page,
}) => {
  const all = (await call('/partner-outings?limit=100')) as { items: Located[] };
  const located = all.items.filter((item) => item.geometry);
  const target = located[located.length - 1];

  await page.goto('/metaskirando');
  await expect(page.locator('.outing-marker')).toHaveCount(located.length);
  const row = page.locator(`.partner-outing-row[data-outing-id="${target.id}"]`);
  const marker = page.locator(`.outing-marker[data-outing-id="${target.id}"]`);

  await row.hover();
  await expect(marker).toHaveClass(/is-highlighted/);
  await page.locator('.metaskirando .subtitle').hover();
  await expect(marker).not.toHaveClass(/is-highlighted/);

  // a marker may be under another one: the event is what the page listens to
  await marker.dispatchEvent('mouseenter');
  await expect(row).toHaveClass(/is-highlighted/);
  await marker.dispatchEvent('mouseleave');
  await expect(row).not.toHaveClass(/is-highlighted/);

  await marker.dispatchEvent('click');
  await expect(row).toBeInViewport();
  await expect(row).toHaveClass(/is-selected/);
});

test('the extent of the map filters the outings, and the URL follows', async ({ page }) => {
  const all = (await call('/partner-outings?limit=100')) as { items: Located[]; total: number };
  // a small extent in the Alps (EPSG:3857): some outings of the demo data, not all
  const bbox = '650000,5600000,800000,5700000';
  const inside = (await call(`/partner-outings?limit=100&bbox=${bbox}`)) as { items: Located[] };
  expect(inside.items.length).toBeGreaterThan(0);
  expect(inside.items.length).toBeLessThan(all.items.length);

  await page.goto(`/metaskirando?bbox=${bbox}`);
  await expect(page.locator('[data-test=filter-extent]')).toBeChecked();
  await expect(page.locator('.partner-outing-row')).toHaveCount(inside.items.length);
  await expect(page.locator('.outing-marker')).toHaveCount(inside.items.length);

  // off: all the outings, and no bbox in the URL
  await page.locator('label[for=partner-outings-filter-extent]').click();
  await expect(page).not.toHaveURL(/bbox=/);
  await expect(page.locator('.partner-outing-row')).toHaveCount(all.items.length);

  // on: the extent of the map as it is
  await page.locator('label[for=partner-outings-filter-extent]').click();
  await expect(page).toHaveURL(/[?&]bbox=-?\d+,-?\d+,-?\d+,-?\d+/);
});

// the filters of the page: steep, sources, text, default areas, new since last visit
type Item = Located & { steep: boolean | null; author: { name: string | null } | null };

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

test('the steep toggle keeps the steep outings, and the URL follows', async ({ page }) => {
  const all = (await call('/partner-outings?limit=100')) as { items: Item[] };
  const { items: steep } = (await call('/partner-outings?limit=100&steep=true')) as { items: Item[] };
  expect(steep.length, 'steep outings in the demo data').toBeGreaterThan(0);
  expect(steep.length).toBeLessThan(all.items.length);

  await page.goto('/metaskirando');
  const rows = page.locator('.partner-outing-row');
  await expect(rows).toHaveCount(all.items.length);

  await page.locator('label[for=partner-outings-steep]').click();
  await expect(page).toHaveURL(/[?&]steep=1\b/);
  await expect(rows).toHaveCount(steep.length);

  // a link keeps it, and the map follows
  await page.goto('/metaskirando?steep=1');
  await expect(page.locator('[data-test=steep]')).toBeChecked();
  await expect(rows).toHaveCount(steep.length);
  await expect(page.locator('.outing-marker')).toHaveCount(steep.filter((item) => item.geometry).length);

  await page.locator('label[for=partner-outings-steep]').click();
  await expect(page).not.toHaveURL(/steep=/);
  await expect(rows).toHaveCount(all.items.length);
});

test('the source chips list the sources of the API, and filter on them', async ({ page }) => {
  const { sources } = (await call('/partner-outings/sources')) as { sources: { source: string }[] };
  const kept = ['c2c', ...sources.map((s) => s.source).filter((source) => source !== 'skitour')];
  expect(kept, 'the sources of the demo data include skitour').toHaveLength(sources.length);
  const gulliver = (await call(`/partner-outings?limit=100&sources=${kept.join(',')}`)) as { items: Item[] };
  const all = (await call('/partner-outings?limit=100')) as { items: Item[] };
  expect(gulliver.items.length).toBeLessThan(all.items.length);

  await page.goto('/metaskirando');
  const chips = page.locator('[data-test=source-chips] .source-chip');
  await expect(chips).toHaveCount(sources.length + 1);
  await expect(chips.first()).toHaveAttribute('data-source', 'c2c');
  await expect(chips.and(page.locator('[aria-pressed=true]'))).toHaveCount(sources.length + 1);
  const rows = page.locator('.partner-outing-row');
  await expect(rows).toHaveCount(all.items.length);

  await page.locator('.source-chip[data-source=skitour]').click();
  // the URL lists every source but skitour (in the order of the API)
  await expect.poll(() => new URL(page.url()).searchParams.get('sources')?.split(',').sort()).toEqual([...kept].sort());
  await expect(rows).toHaveCount(gulliver.items.length);
  await expect(page.locator('.partner-outing-row .source-badge--skitour')).toHaveCount(0);
  await expect(page.locator('.source-chip[data-source=skitour]')).toHaveAttribute('aria-pressed', 'false');

  // all of them on again is no filter
  await page.locator('.source-chip[data-source=skitour]').click();
  await expect(page).not.toHaveURL(/sources=/);
  await expect(rows).toHaveCount(all.items.length);
});

test('the text filter works on the loaded outings, without a request, and the URL follows', async ({ page }) => {
  const all = (await call('/partner-outings?limit=100')) as { items: Item[] };
  const word = 'cima';
  const matching = all.items.filter((item) => normalize(item.title).includes(word));
  expect(matching.length, `titles with "${word}" in the demo data`).toBeGreaterThan(0);
  expect(matching.length).toBeLessThan(all.items.length);

  await page.goto('/metaskirando');
  const rows = page.locator('.partner-outing-row');
  await expect(rows).toHaveCount(all.items.length);

  const requests: string[] = [];
  page.on('request', (request) => request.url().includes('/partner-outings') && requests.push(request.url()));
  await page.locator('[data-test=text-filter]').fill(word.toUpperCase());
  await expect(rows).toHaveCount(matching.length);
  await expect(page).toHaveURL(new RegExp(`[?&]q=${word}`, 'i'));
  expect(requests).toEqual([]);
  await expect(page.locator('.outing-marker')).toHaveCount(matching.filter((item) => item.geometry).length);

  await page.locator('[data-test=text-filter]').fill('zzzz no such outing');
  await expect(page.locator('[data-test=empty]')).toBeVisible();

  // together with another filter, from a link
  await page.goto(`/metaskirando?q=${word}&steep=1`);
  await expect(page.locator('[data-test=text-filter]')).toHaveValue(word);
  const { items: steep } = (await call('/partner-outings?limit=100&steep=true')) as { items: Item[] };
  await expect(rows).toHaveCount(steep.filter((item) => normalize(item.title).includes(word)).length);
});

test('the default view covers every activity, not only skiing', async ({ page }) => {
  const all = (await call('/partner-outings?limit=100')) as { items: Row[] };
  const others = all.items.filter((item) => !item.activities.includes('skitouring'));
  expect(others.length, 'outings of another activity in the demo data').toBeGreaterThan(0);

  await page.goto('/metaskirando');
  await expect(page.locator('.partner-outing-row')).toHaveCount(all.items.length);
  await expect(page).not.toHaveURL(/act=/);
  await expect(page.locator('.partner-outing-row .activity-icons svg[data-icon=snowshoeing]').first()).toBeVisible();
});

test('an anonymous visitor remembers default areas in the browser', async ({ page }) => {
  const all = (await call('/partner-outings?limit=100')) as { items: Row[] };
  const inArea = all.items.filter((item) => item.areas.some((area) => area.document_id === VANOISE));
  expect(inArea.length).toBeGreaterThan(0);
  expect(inArea.length).toBeLessThan(all.items.length);
  const rows = page.locator('.partner-outing-row');

  await page.goto(`/metaskirando?a=${VANOISE}`);
  await expect(rows).toHaveCount(inArea.length);
  await page.locator('[data-test=remember-areas]').click();
  expect(await page.evaluate(() => localStorage.getItem('metaskirando.areas'))).toBe(`[${VANOISE}]`);

  // a visit without areas opens on them, and the link says so
  await page.goto('/metaskirando');
  await expect(page).toHaveURL(new RegExp(`[?&]a=${VANOISE}\\b`));
  await expect(rows).toHaveCount(inArea.length);
  await expect(page.locator('[data-test=areas] .tag')).toContainText('Vanoise');

  // the defaults come with the other filters of the link, and can be forgotten
  await page.goto('/metaskirando?act=hiking');
  await expect(page).toHaveURL(new RegExp(`[?&]a=${VANOISE}\\b`));
  await page.locator('[data-test=remember-areas]').click();
  expect(await page.evaluate(() => localStorage.getItem('metaskirando.areas'))).toBeNull();
  await page.goto('/metaskirando');
  await expect(rows).toHaveCount(all.items.length);
  await expect(page).not.toHaveURL(/[?&]a=/);
});

test('a blocked local storage does not break the page', async ({ page }) => {
  await page.addInitScript(() => {
    const blocked = () => {
      throw new Error('blocked');
    };
    for (const method of ['getItem', 'setItem', 'removeItem'] as const) {
      const original = Storage.prototype[method];
      // the other keys (the session, GDPR) keep working: the e2e fixtures need them
      Storage.prototype[method] = function (this: Storage, key: string, ...rest: string[]) {
        if (String(key).startsWith('metaskirando.')) {
          return blocked();
        }
        return (original as (...args: string[]) => string | null).call(this, key, ...rest);
      } as never;
    }
  });
  const all = (await call('/partner-outings?limit=100')) as { items: Row[] };
  await page.goto('/metaskirando');
  await expect(page.locator('.partner-outing-row')).toHaveCount(all.items.length);
});

test.describe('logged in', () => {
  test.use({ loggedIn: true });

  test('opens on the preferred areas of the account', async ({ page, data }) => {
    const all = (await call('/partner-outings?limit=100')) as { items: Row[] };
    const inArea = all.items.filter((item) => item.areas.some((area) => area.document_id === VANOISE));
    expect(inArea.length).toBeGreaterThan(0);
    expect(inArea.length).toBeLessThan(all.items.length);

    const { token } = data.user;
    const before = await call('/users/preferences', { token });
    const area = await call(`/areas/${VANOISE}`);
    // the preferred activity is skiing: the list still covers every activity
    await call('/users/preferences', {
      token,
      method: 'POST',
      body: { ...before, activities: ['skitouring'], areas: [area] },
    });
    try {
      await page.goto('/metaskirando');
      await expect(page).toHaveURL(new RegExp(`[?&]a=${VANOISE}\\b`));
      await expect(page).not.toHaveURL(/act=/);
      await expect(page.locator('.partner-outing-row')).toHaveCount(inArea.length);
      await expect(page.locator('[data-test=areas] .tag')).toContainText('Vanoise');
      await expect(page.locator('[data-test=remember-areas]')).toHaveCount(0);
      await expect(page.locator('[data-test=preferred-areas] a')).toHaveAttribute('href', /\/settings#account/);

      // a link with areas wins over the preferences
      await page.goto('/metaskirando?a=14295');
      await expect(page).toHaveURL(/[?&]a=14295\b/);
    } finally {
      await call('/users/preferences', { token, method: 'POST', body: before });
    }
  });
});

test('"new since last visit": nothing at the first visit, then what the source did not show before', async ({
  page,
}) => {
  const all = (await call('/partner-outings?limit=100')) as { items: Item[] };
  const { sources } = (await call('/partner-outings/sources')) as { sources: { source: string }[] };
  const rows = page.locator('.partner-outing-row');

  // the first visit: nothing is new, and each source is remembered
  await page.goto('/metaskirando');
  await expect(rows).toHaveCount(all.items.length);
  await expect(page.locator('[data-test=new]')).toHaveCount(0);
  await expect(page.locator('[data-test=only-new]')).toHaveCount(0);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('metaskirando.visits')!));
  expect(Object.keys(stored).sort()).toEqual(sources.map((s) => s.source).sort());

  // a visit long after one that saw all the skitour outings but the first
  const skitour = all.items.filter((item) => item.source === 'skitour').map((item) => item.id);
  const fresh = skitour[0];
  await page.evaluate(
    ({ seen }) =>
      localStorage.setItem(
        'metaskirando.visits',
        JSON.stringify({ skitour: { seen, baseline: null, at: Date.now() - 3600_000 } })
      ),
    { seen: skitour.slice(1) }
  );
  await page.reload();
  await expect(rows).toHaveCount(all.items.length);
  const tagged = page.locator('.partner-outing-row:has([data-test=new])');
  await expect(tagged).toHaveCount(1);
  await expect(tagged).toHaveAttribute('data-outing-id', fresh);

  await page.locator('[data-test=only-new]').click();
  await expect(rows).toHaveCount(1);
  await expect(page).not.toHaveURL(/new/);
});
