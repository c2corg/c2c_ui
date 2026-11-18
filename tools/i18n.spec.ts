import { describe, expect, it } from 'vitest';

import { buildPo, type LocaleMessages, parsePo, setTranslation } from './i18n.ts';

describe('parsePo', () => {
  it('reads contexts, files, escapes and wrapped lines, without the header', () => {
    const entries = parsePo(
      [
        'msgid ""',
        'msgstr ""',
        '"Language: fr\\n"',
        '',
        '#: src/a.vue',
        '#: src/b.ts',
        'msgctxt "navigation"',
        'msgid "Search"',
        'msgstr "Recherche"',
        'msgid "Say \\"hi\\""',
        'msgstr ""',
        '"Dites \\"salut\\"\\n"',
        '"à tous"',
        '',
        'msgid "Untranslated"',
        'msgstr ""',
      ].join('\n')
    );

    expect(entries).toEqual([
      { msgctxt: 'navigation', msgid: 'Search', msgstr: 'Recherche', files: ['src/a.vue', 'src/b.ts'] },
      { msgctxt: null, msgid: 'Say "hi"', msgstr: 'Dites "salut"\nà tous', files: [] },
      { msgctxt: null, msgid: 'Untranslated', msgstr: '', files: [] },
    ]);
  });

  it('reads back what buildPo writes', () => {
    const entries = [
      { msgid: 'A "quote"', msgctxt: null, files: [], translation: 'Une « citation »\nsur deux lignes', origin: null },
      { msgid: 'Search', msgctxt: 'navigation', files: [], translation: 'Recherche', origin: null },
      { msgid: 'Skipped', msgctxt: null, files: [], translation: ' ', origin: null },
    ];
    const { content, count } = buildPo({ lang: 'fr', entries });

    expect(count).toBe(2);
    expect(parsePo(content).map(({ msgctxt, msgid, msgstr }) => [msgctxt, msgid, msgstr])).toEqual([
      [null, 'A "quote"', 'Une « citation »\nsur deux lignes'],
      ['navigation', 'Search', 'Recherche'],
    ]);
  });
});

describe('setTranslation', () => {
  it('nests contexts like the Transifex sync, and drops translations identical to the message', () => {
    const messages: LocaleMessages = { Search: 'Rechercher' };

    setTranslation(messages, 'Search', 'navigation', 'Recherche');
    setTranslation(messages, 'Back', null, 'Retour');
    setTranslation(messages, 'Auto', null, 'Auto');

    expect(messages).toEqual({ Search: { $$noContext: 'Rechercher', navigation: 'Recherche' }, Back: 'Retour' });
  });
});
