import { describe, expect, it } from 'vitest';

import account from './fixtures/account.json';
import changes from './fixtures/changes.json';
import feedPage from './fixtures/feed.json';
import outingCooked from './fixtures/outing-cooked.json';
import outingsList from './fixtures/outings-list.json';
import privateProfile from './fixtures/profile.json';
import routeCooked from './fixtures/route-cooked.json';
import routesList from './fixtures/routes-list.json';
import search from './fixtures/search.json';
import waypoint from './fixtures/waypoint.json';
import * as schemas from './schemas';

const errorsOf = (schema: { safeParse(data: unknown): { success: boolean; error?: unknown } }, data: unknown) =>
  schema.safeParse(data).error;

describe('the c2c API schemas', () => {
  it('accept the answers of the API', () => {
    for (const data of [routeCooked, outingCooked, waypoint, privateProfile]) {
      expect(errorsOf(schemas.document, data)).toBeUndefined();
    }
    for (const data of [routesList, outingsList]) {
      expect(errorsOf(schemas.documentsPage, data)).toBeUndefined();
    }
    expect(errorsOf(schemas.searchResults, search)).toBeUndefined();
    expect(errorsOf(schemas.feed, feedPage)).toBeUndefined();
    expect(errorsOf(schemas.documentChanges, changes)).toBeUndefined();
    expect(errorsOf(schemas.account, account)).toBeUndefined();
  });

  it('accept the full answers of a waypoint, a route and an outing', () => {
    expect(errorsOf(schemas.waypoint, waypoint)).toBeUndefined();
    // its public transportation rating is computed: unknown service without access waypoint
    expect(errorsOf(schemas.route, routeCooked)).toBeUndefined();
    expect(errorsOf(schemas.outing, outingCooked)).toBeUndefined();
  });

  it('reject a full answer with a value the UI does not know, or without the fields of its type', () => {
    expect(errorsOf(schemas.waypoint, { ...waypoint, waypoint_type: 'volcano' })).toBeDefined();
    expect(errorsOf(schemas.waypoint, { ...waypoint, waypoint_type: undefined })).toBeDefined();
    expect(errorsOf(schemas.route, { ...routeCooked, activities: ['skitouring', 'surfing'] })).toBeDefined();
    expect(errorsOf(schemas.route, { ...routeCooked, ski_rating: 6 })).toBeDefined();
    expect(errorsOf(schemas.outing, { ...outingCooked, date_start: undefined })).toBeDefined();
    expect(
      errorsOf(schemas.outing, { ...outingCooked, cooked: { ...outingCooked.cooked, lang: undefined } })
    ).toBeDefined();
  });

  it('accept the fields a type does not use left out, as the API does', () => {
    const summit = Object.fromEntries(
      Object.entries(waypoint).filter(([key]) => !['elevation', 'maps_info'].includes(key))
    );

    expect(errorsOf(schemas.waypoint, summit)).toBeUndefined();
  });

  describe('of the other document types', () => {
    // the fields every full document has
    const base = (type: string) => ({
      document_id: 1,
      version: 1,
      type,
      quality: 'medium',
      protected: false,
      locales: [{ lang: 'fr', version: 1, title: 'Titre' }],
    });

    it('accept their answers', () => {
      expect(errorsOf(schemas.area, { ...base('a'), area_type: 'range' })).toBeUndefined();
      expect(
        errorsOf(schemas.article, { ...base('c'), article_type: 'collab', author: { user_id: 2, name: 'A' } })
      ).toBeUndefined();
      expect(errorsOf(schemas.book, { ...base('b'), author: 'Gaston Rébuffat', book_types: ['topo'] })).toBeUndefined();
      expect(
        errorsOf(schemas.image, { ...base('i'), filename: '1.jpg', creator: { user_id: 2, name: 'A' } })
      ).toBeUndefined();
      expect(
        errorsOf(schemas.map, { ...base('m'), editor: 'Swisstopo', scale: '25000', code: '1344' })
      ).toBeUndefined();
      // the profiles have no locale title
      const locales = [{ lang: 'fr', version: 1, description: null }];
      expect(errorsOf(schemas.profile, { ...base('u'), locales, name: 'A', forum_username: 'a' })).toBeUndefined();
      expect(errorsOf(schemas.profile, privateProfile)).toBeUndefined();
      // a value the API still has, taken out of the UI
      const xreport = { ...base('x'), event_activity: 'skitouring', previous_injuries: 'previous_injuries_3' };
      expect(errorsOf(schemas.xreport, xreport)).toBeUndefined();
    });

    it('reject what the UI could not read', () => {
      expect(errorsOf(schemas.image, base('i'))).toBeDefined(); // no file
      expect(errorsOf(schemas.map, { ...base('m'), scale: '1:25000' })).toBeDefined();
      expect(errorsOf(schemas.article, { ...base('c'), author: 'A' })).toBeDefined();
      expect(errorsOf(schemas.xreport, base('x'))).toBeDefined(); // no activity
      expect(errorsOf(schemas.profile, { not_authorized: true, document_id: 1 })).toBeDefined();
    });
  });

  it('accept the last page of a feed, without its pagination token', () => {
    expect(errorsOf(schemas.feed, { feed: [] })).toBeUndefined();
    expect(errorsOf(schemas.documentChanges, { feed: [] })).toBeUndefined();
  });

  it('reject what the UI could not read', () => {
    const withoutId: Record<string, unknown> = { ...routeCooked };
    delete withoutId.document_id;
    expect(errorsOf(schemas.document, withoutId)).toBeDefined();
    expect(errorsOf(schemas.document, { ...routeCooked, locales: [{ title: 'no lang' }] })).toBeDefined();
    expect(errorsOf(schemas.documentsPage, { documents: [] })).toBeDefined();
    expect(errorsOf(schemas.feed, { feed: [{ ...feedPage.feed[0], time: undefined }] })).toBeDefined();
    expect(errorsOf(schemas.account, { ...account, is_profile_public: 'yes' })).toBeDefined();
  });
});
