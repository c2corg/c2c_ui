import { describe, expect, it } from 'vitest';

import utils from './utils';

describe('stringDivider', () => {
  it.each([undefined, null, ''])('returns %j unchanged', (value) => {
    expect(utils.stringDivider(value, 5, '\n')).toBe(value);
  });

  it('returns strings shorter than or as long as width unchanged', () => {
    expect(utils.stringDivider('hello', 10, '\n')).toBe('hello');
    expect(utils.stringDivider('hello world', 11, '\n')).toBe('hello world');
  });

  it('breaks on the last space before width, dropping the space', () => {
    expect(utils.stringDivider('hello world', 8, '\n')).toBe('hello\nworld');
  });

  it('breaks on a space exactly at width', () => {
    expect(utils.stringDivider('hello world', 5, '\n')).toBe('hello\nworld');
  });

  it('breaks recursively into several lines', () => {
    expect(utils.stringDivider('hello world foo bar', 7, '\n')).toBe('hello\nworld\nfoo bar');
  });

  it('breaks after a dash, keeping the dash', () => {
    expect(utils.stringDivider('Saint-Gervais', 8, '<br>')).toBe('Saint-<br>Gervais');
  });

  it('uses the given replacer', () => {
    expect(utils.stringDivider('aa bb', 3, '<br>')).toBe('aa<br>bb');
  });

  it('does not break words without a space or dash', () => {
    expect(utils.stringDivider('Mississippi', 4, '\n')).toBe('Mississippi');
  });

  it('keeps an overlong last word unbroken', () => {
    expect(utils.stringDivider('a Mississippi', 4, '\n')).toBe('a\nMississippi');
  });

  it('does not break on a leading space', () => {
    expect(utils.stringDivider(' Mississippi', 4, '\n')).toBe(' Mississippi');
  });
});

describe('intersectionIsNotNull', () => {
  it('returns true when arrays share an item', () => {
    expect(utils.intersectionIsNotNull([1, 2, 3], [3, 4])).toBe(true);
    expect(utils.intersectionIsNotNull(['skitouring'], ['hiking', 'skitouring'])).toBe(true);
  });

  it('returns false when arrays share no item', () => {
    expect(utils.intersectionIsNotNull([1, 2], [3, 4])).toBe(false);
  });

  it('returns false when an array is empty', () => {
    expect(utils.intersectionIsNotNull([], [1])).toBe(false);
    expect(utils.intersectionIsNotNull([1], [])).toBe(false);
    expect(utils.intersectionIsNotNull([], [])).toBe(false);
  });

  it('uses strict equality', () => {
    expect(utils.intersectionIsNotNull([1], ['1'])).toBe(false);
    expect(utils.intersectionIsNotNull([{ a: 1 }], [{ a: 1 }])).toBe(false);
  });

  it('matches NaN (Array.prototype.includes semantics)', () => {
    expect(utils.intersectionIsNotNull([NaN], [NaN])).toBe(true);
  });
});

describe('decodeHtmlEntities', () => {
  it('decodes named, decimal and hexadecimal entities', () => {
    expect(utils.decodeHtmlEntities('a &amp; b &eacute; &#233; &#xE9; &lt;p&gt;')).toBe('a & b é é é <p>');
  });

  it('decodes only one level of entities', () => {
    expect(utils.decodeHtmlEntities('&amp;lt;')).toBe('&lt;');
  });

  it('removes html markup, keeping text content', () => {
    expect(utils.decodeHtmlEntities('<p>Zone <b>protégée</b></p><br>du 1<sup>er</sup> mai')).toBe(
      'Zone protégéedu 1er mai'
    );
  });

  it('returns plain text unchanged', () => {
    expect(utils.decodeHtmlEntities('plain text')).toBe('plain text');
  });

  it('returns an empty string for an empty string', () => {
    expect(utils.decodeHtmlEntities('')).toBe('');
  });

  it('does not execute scripts or event handlers', () => {
    window.__decodeHtmlEntitiesPwned = false;
    utils.decodeHtmlEntities('<img src="x" onerror="window.__decodeHtmlEntitiesPwned = true">');
    utils.decodeHtmlEntities('<script>window.__decodeHtmlEntitiesPwned = true</script>');
    expect(window.__decodeHtmlEntitiesPwned).toBe(false);
    delete window.__decodeHtmlEntitiesPwned;
  });
});

describe('stripMarkdown', () => {
  it('replaces external links with their text', () => {
    expect(utils.stripMarkdown('see [the forum](https://forum.camptocamp.org/t/1) now')).toBe('see the forum now');
  });

  it('replaces internal links with their text', () => {
    expect(utils.stripMarkdown('see [[routes/123/fr/my-route|my route]] now')).toBe('see my route now');
  });

  it('replaces several links of each kind', () => {
    expect(utils.stripMarkdown('[a](http://a) [[routes/1|b]] [c](http://c) [[waypoints/2|d]]')).toBe('a b c d');
  });

  it('removes emphasis, heading and code characters', () => {
    expect(utils.stripMarkdown('## Title\n**bold** _italic_ ~~strike~~ `code` \\escaped')).toBe(
      ' Title\nbold italic strike code escaped'
    );
  });

  it('removes underscores everywhere, not only around emphasis', () => {
    expect(utils.stripMarkdown('snake_case_word')).toBe('snakecaseword');
  });

  it('unwraps a <sup> or <sub> tag', () => {
    expect(utils.stripMarkdown('1<sup>er</sup> mai')).toBe('1er mai');
    expect(utils.stripMarkdown('H<sub>2</sub>O')).toBe('H2O');
  });

  it('unwraps <sup>/<sub> tags on different lines', () => {
    expect(utils.stripMarkdown('1<sup>er</sup>\nH<sub>2</sub>O')).toBe('1er\nH2O');
  });

  it('keeps dashes inside words', () => {
    expect(utils.stripMarkdown('Saint-Gervais')).toBe('Saint-Gervais');
  });

  it('returns an empty string unchanged', () => {
    expect(utils.stripMarkdown('')).toBe('');
  });

  it('throws on undefined', () => {
    expect(() => utils.stripMarkdown(undefined)).toThrow(TypeError);
  });

  it('removes list markers and their indentation', () => {
    expect(utils.stripMarkdown('list:\n- one\n  - two\n\t- three')).toBe('list:\none\ntwo\nthree');
  });

  it('removes a list marker at the start of the text', () => {
    expect(utils.stripMarkdown('- one\n- two')).toBe('one\ntwo');
  });

  it('does not join lines when a dash ends a line', () => {
    expect(utils.stripMarkdown('a\n-\nb')).toBe('a\n-\nb');
  });

  it.each(['1500 - 2000 m', '5c - 6a', 'Chamonix - Zermatt', '-5 °C', '-5 °C, 3 -4', 'a\n-5 °C'])(
    'keeps dashes that are not list markers in %j',
    (value) => {
      expect(utils.stripMarkdown(value)).toBe(value);
    }
  );

  it('keeps dashes inside a list item', () => {
    expect(utils.stripMarkdown('- 1500 - 2000 m\n- 5c - 6a')).toBe('1500 - 2000 m\n5c - 6a');
  });

  it('unwraps several <sup>/<sub> tags on the same line', () => {
    expect(utils.stripMarkdown('1<sup>er</sup> et 2<sup>e</sup>')).toBe('1er et 2e');
    expect(utils.stripMarkdown('1<sup>er</sup> mai, H<sub>2</sub>O')).toBe('1er mai, H2O');
  });
});
