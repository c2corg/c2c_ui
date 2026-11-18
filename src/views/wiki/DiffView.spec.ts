import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import DiffView from './DiffView.vue';
import { alignLines, diffBlocks, hasChanged } from './utils/diff-rows';

import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';

const routes = c2c.route as DocumentService;

// the versions of route 12: version 3 then 4
const version = (id: number, description: string, extra = {}) => ({
  document: {
    document_id: 12,
    type: 'r',
    elevation_max: id * 100,
    // a new object on each read, as the API computes it
    license: { id: 'CC-BY-SA-3.0', url: 'https://creativecommons.org/licenses/by-sa/3.0/' },
    geometry: { geom: '{}', geom_detail: null },
    locales: [{ lang: 'fr', title: 'Arête', description }],
  },
  version: { version_id: id, written_at: '2026-10-29T10:00:00', name: 'alice', comment: `v${id}` },
  previous_version_id: id - 1,
  next_version_id: id + 1,
  ...extra,
});
const versions: Record<number, ReturnType<typeof version>> = {
  3: version(3, 'Line 1\nLine 2\nLine 3'),
  4: version(4, 'Line 1\nLine two\nLine 3'),
};

const mountDiff = async (versionFrom: string, versionTo: string) => {
  vi.spyOn(routes, 'getVersion').mockImplementation(
    (id, lang, versionId) => Promise.resolve({ data: versions[versionId as number] }) as never
  );
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/routes/diff/:id/:lang/:versionFrom/:versionTo', name: 'route-diff', component: DiffView },
      { path: '/routes/:id/:lang?', name: 'route', component: { render: () => h('div') } },
      { path: '/routes/history/:id/:lang', name: 'route-history', component: { render: () => h('div') } },
    ],
  });
  await router.push(`/routes/diff/12/fr/${versionFrom}/${versionTo}`);

  const wrapper = mount(DiffView, {
    global: {
      plugins: [router],
      directives: { translate: {} },
      stubs: { HtmlHeader: true, IconDocument: true, MapView: true, ContributorLink: true, DiffLink: true },
      config: {
        globalProperties: {
          $gettext: (text: string) => text,
          $filters: { uppercaseFirstLetter: (text: string) => text },
          $dateUtils: { toTechnicalString: (date: string) => date },
          $documentUtils: {
            hasSameGeolocation: () => true,
            getLocaleStupid: (document: { locales: object[] }) => document.locales[0],
          },
        } as never,
      },
    },
  });
  await flushPromises();
  return wrapper;
};

describe('DiffView', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows the changed properties and lines of two versions', async () => {
    const wrapper = await mountDiff('3', '4');

    expect(routes.getVersion).toHaveBeenCalledWith(12, 'fr', '3');
    expect(wrapper.text()).toContain('elevation_max');
    expect(wrapper.findAll('del').map((del) => del.text())).toContain('300');
    expect(wrapper.text()).toContain('two');
    expect(wrapper.text()).not.toContain('license');
  });

  it('finds the version before the new one, and the one after the old one', async () => {
    expect((await mountDiff('prev', '4')).text()).toContain('two');
    expect(routes.getVersion).toHaveBeenLastCalledWith(12, 'fr', 3);

    expect((await mountDiff('3', 'next')).text()).toContain('two');
    expect(routes.getVersion).toHaveBeenLastCalledWith(12, 'fr', 4);
  });
});

describe('diff rows', () => {
  it('compares values, arrays by content', () => {
    expect(hasChanged(['a'], ['a'])).toBe(false);
    expect(hasChanged(null, null)).toBe(false);
    expect(hasChanged(null, 0)).toBe(true);
    expect(hasChanged('a', 'b')).toBe(true);
  });

  it('shows the changed lines with two lines of context, the others ellipsed', () => {
    const text = (changed: string) =>
      [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (i === 6 ? changed : `l${i}`)).join('\n') + '\n';
    const blocks = diffBlocks(text('l6'), text('L6'));

    expect(blocks.map((block) => [block.ellipsed, block.rows.length])).toEqual([
      [true, 3],
      [false, 5],
    ]);
    const changed = blocks[1].rows[2];
    expect(changed.isIdentical).toBe(false);
    expect(changed.oldPart.map((item) => item.text)).toEqual(['l6']);
    expect(changed.newPart.map((item) => item.text)).toEqual(['L6']);
  });

  // the old and new texts of each changed row, unchanged parts as is, changed parts in brackets
  const changedRows = (oldText: string, newText: string) =>
    diffBlocks(oldText, newText)
      .flatMap((block) => block.rows)
      .filter((row) => !row.isIdentical)
      .map((row) =>
        [row.oldPart, row.newPart].map((items) =>
          items.map((item) => (item.isIdentical ? item.text : `[${item.text}]`)).join('')
        )
      );

  it('shows the changed words of a line, not scattered letters', () => {
    expect(
      changedRows(
        'L1 | 40m | 4c | Traversée vers la gauche puis dièdre jusqu’au relais sur béquet.\n',
        'L1 | 45m | 5a | Traverser à gauche, puis remonter le dièdre jusqu’au relais sur deux spits.\n'
      )
    ).toEqual([
      [
        'L1 | [40m] | [4c] | [Traversée vers la] gauche puis dièdre jusqu’au relais sur [béquet].',
        'L1 | [45m] | [5a] | [Traverser à] gauche[,] puis [remonter le ]dièdre jusqu’au relais sur [deux spits].',
      ],
    ]);
  });

  it('pairs each changed line with its most similar new line, a new line among them with none', () => {
    expect(
      changedRows(
        'a\nL1 | 30m | 4b | dalle\nL2 | 35m | 5a | fissure\nz\n',
        'a\nL1 | 30m | 4c | dalle\nUne nouvelle ligne\nL2 | 35m | 5b | fissure\nz\n'
      )
    ).toEqual([
      ['L1 | 30m | [4b] | dalle', 'L1 | 30m | [4c] | dalle'],
      ['', '[Une nouvelle ligne]'],
      ['L2 | 35m | [5a] | fissure', 'L2 | 35m | [5b] | fissure'],
    ]);
  });

  it('pairs a line with the same line with a text appended', () => {
    expect(
      changedRows(
        'a\nL#2 | 6a/A0 5c | 30 m | 13 pts |\nL#3 | 4b | 35 m | 8 pts |\nz\n',
        'a\nL#2 | 6a/A0 5c | 30 m | 13 pts | Du relais main gauche, jusqu’à atteindre le pilier.\n' +
          'L#3 | 4b | 35 m | 8 pts | Le dièdre rampe incliné à gauche.\nz\n'
      )
    ).toEqual([
      [
        'L#2 | 6a/A0 5c | 30 m | 13 pts |',
        'L#2 | 6a/A0 5c | 30 m | 13 pts |[ Du relais main gauche, jusqu’à atteindre le pilier.]',
      ],
      ['L#3 | 4b | 35 m | 8 pts |', 'L#3 | 4b | 35 m | 8 pts |[ Le dièdre rampe incliné à gauche.]'],
    ]);
  });

  it('shows unrelated deleted and added lines whole, side by side', () => {
    expect(changedRows('a\nAccès par le parking du col.\nz\n', 'a\nDescente en rappel sur la face nord.\nz\n')).toEqual(
      [['[Accès par le parking du col.]', '[Descente en rappel sur la face nord.]']]
    );
  });
});

describe('alignLines', () => {
  it('keeps the order of the lines, and puts unpaired lines side by side between pairs', () => {
    expect(
      alignLines(
        ['un deux trois', 'autre chose', 'quatre cinq six'],
        ['un deux trois quatre', 'rien', 'à voir', 'quatre cinq six sept']
      )
    ).toEqual([
      ['un deux trois', 'un deux trois quatre', true],
      ['autre chose', 'rien', false],
      [undefined, 'à voir', false],
      ['quatre cinq six', 'quatre cinq six sept', true],
    ]);
  });

  it('pairs blank lines and lines without words only when equal', () => {
    expect(alignLines(['', '---'], ['', '***'])).toEqual([
      ['', '', true],
      ['---', '***', false],
    ]);
  });
});
