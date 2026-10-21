import { describe, expect, it } from 'vitest';
import { createApp } from 'vue';

import dateUtils from './date-utils';
import documentUtils from './document-utils';

const install = ({ userLang = 'fr' } = {}) => {
  const app = createApp({});
  app.use(dateUtils);
  app.use(documentUtils);
  const globals = app.config.globalProperties;
  // installed after $documentUtils by main.js: read when called
  globals.$gettext = (msgid) => `[${msgid}]`;
  globals.$language = { current: 'fr' };
  globals.$user = { lang: userLang };
  return globals.$documentUtils;
};

const route = {
  type: 'r',
  document_id: 4,
  locales: [
    { lang: 'en', title: 'North face', title_prefix: 'Mont Blanc' },
    { lang: 'fr', title: 'Face nord', title_prefix: 'Mont Blanc' },
  ],
  geometry: { geom: '{"type":"Point","coordinates":[765000,5772000]}' },
  global_rating: 'AD',
  elevation_max: 4808,
  height_diff_up: null,
};

describe('$documentUtils', () => {
  it('maps document letters to types', () => {
    const utils = install();
    expect(utils.getDocumentType('r')).toBe('route');
    expect(utils.getDocumentType('u')).toBe('profile');
    expect(utils.getDocumentType('x')).toBe('xreport');
  });

  it('builds the creation title of each type', () => {
    expect(install().getCreationTitle('outing')).toBe('[add an outing]');
    expect(install().getCreationTitle('xreport')).toBe('[add an incident/accident report]');
    expect(() => install().getCreationTitle('profile')).toThrow('Unexpected type : profile');
  });

  it('gives a document title in the asked language, then the user one, then by order', () => {
    expect(install().getDocumentTitle(route, 'en')).toBe('Mont Blanc : North face');
    expect(install({ userLang: 'fr' }).getDocumentTitle(route, 'it')).toBe('Mont Blanc : Face nord');
    expect(install({ userLang: 'de' }).getDocumentTitle(route)).toBe('Mont Blanc : Face nord');
    expect(install().getDocumentTitle({ type: 'u', name: 'Alice' })).toBe('Alice');
    expect(install().getDocumentTitle({ type: 'r', title: 'from whatsnew' })).toBe('from whatsnew');
  });

  it('keeps working when a method is passed as a callback (OutingsDownloader)', () => {
    const { getDocumentTitle } = install();
    expect([route].map((document) => getDocumentTitle(document, 'en'))).toEqual(['Mont Blanc : North face']);
  });

  it('gives the license of each document type', () => {
    const utils = install();
    expect(utils.getDocumentLicense(route)).toBe('by-sa');
    expect(utils.getDocumentLicense({ type: 'o' })).toBe('by-nc-nd');
    expect(utils.getDocumentLicense({ type: 'c', article_type: 'collab' })).toBe('by-sa');
    expect(utils.getDocumentLicense({ type: 'i', image_type: 'copyright' })).toBe('copyright');
    expect(() => utils.getDocumentLicense({ type: 'c', article_type: 'other' })).toThrow('Unexpected article_type');
  });

  it('tells whether a document has a rating', () => {
    expect(install().hasRating(route)).toBeTruthy();
    expect(install().hasRating({ type: 'r' })).toBeFalsy();
  });

  it('adds an association once, and fills the outing from its route', () => {
    const utils = install();
    const outing = utils.buildDocument('outing', 'fr');
    expect(outing.type).toBe('o');
    expect(outing.associations.routes).toEqual([]);
    expect(outing.geometry).toEqual({ geom: null, geom_detail: null });

    utils.addAssociation(outing, route);
    utils.addAssociation(outing, route);

    expect(outing.associations.routes).toEqual([route]);
    expect(outing.global_rating).toBe('AD');
    expect(outing.elevation_max).toBe(4808);
    expect(outing.geometry.geom).toBe(route.geometry.geom);
    expect(outing.locales[0].title).toBe('Mont Blanc : Face nord');

    utils.removeAssociation(outing, route);
    expect(outing.associations.routes).toEqual([]);
  });

  it('sorts areas: range, then administrative limits, then country', () => {
    const area = (area_type, title) => ({ type: 'a', area_type, locales: [{ lang: 'fr', title }] });
    const document = {
      areas: [area('country', 'France'), area('range', 'Mont Blanc'), area('admin_limits', 'Haute-Savoie')],
    };

    expect(install().getSortedAreaList(document)).toBe('Mont Blanc - Haute-Savoie - France');
  });

  it('localizes outing dates', () => {
    const utils = install();
    expect(utils.getOutingDatesLocalized({ date_start: '2026-07-14', date_end: '2026-07-16' })).toBe(
      '14 - 16 juil. 2026'
    );
    expect(utils.getOutingDatesLocalized({ date_start: '2026-07-30', date_end: '2026-08-02' })).toBe(
      '30 juillet - 2 août 2026'
    );
    expect(utils.getOutingDatesLocalized({ date_start: '2026-07-14' })).toBe('mardi 14 juillet 2026');
    expect(utils.getOutingDatesLocalized({})).toBe('[Invalid date]');
  });

  it('compares geolocations', () => {
    const utils = install();
    const at = (geom) => ({ geometry: { geom } });
    expect(
      utils.hasSameGeolocation(at('{"type":"Point","coordinates":[1,2]}'), at('{"coordinates":[1,2],"type":"Point"}'))
    ).toBe(true);
    expect(
      utils.hasSameGeolocation(at('{"type":"Point","coordinates":[1,2]}'), at('{"type":"Point","coordinates":[1,3]}'))
    ).toBe(false);
    expect(utils.hasSameGeolocation(at(null), at('{"type":"Point","coordinates":[1,2]}'))).toBe(false);
  });

  it('computes the bbox of documents', () => {
    const at = (x, y) => ({ geometry: { geom: JSON.stringify({ type: 'Point', coordinates: [x, y] }) } });
    expect(install().getDocumentsBbox([at(10.4, 20), at(30, 5.6), { geometry: { geom: null } }])).toEqual([
      10, 6, 30, 20,
    ]);
    expect(install().getDocumentsBbox([])).toBe(null);
    expect(install().getDocumentsBbox([at(0, 0), at(-10, -20)])).toEqual([-10, -20, 0, 0]);
    expect(install().getDocumentsBbox([at(-10, -20), at(0, 0)])).toEqual([-10, -20, 0, 0]);
  });

  it('formats lengths and height differences', () => {
    const utils = install();
    expect(utils.lengthWithUnit(800)).toBe('800&nbsp;[meters]');
    expect(utils.lengthWithUnit(12345)).toBe('12.3&nbsp;[kilometers]');
    expect(utils.heightDiffUpWithUnit(1200)).toBe('1200&nbsp;[meters]');
    expect(utils.heightDiffUpWithUnit(null)).toBe(undefined);
  });
});
