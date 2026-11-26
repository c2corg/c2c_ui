import { describe, expect, it } from 'vitest';

import { associatedCount, canAdd, canRemove, removalBlock } from './association-rights';

const user = { isModerator: false, id: 7 };
const moderator = { isModerator: true, id: 1 };

describe('association rights', () => {
  it('adds a document, but not itself, a forbidden child, or an indoor climbing site to a route', () => {
    const route = { type: 'r', document_id: 10 };
    expect(canAdd(route, { type: 'w', document_id: 20, waypoint_type: 'summit' }, user)).toBe(true);
    expect(canAdd(route, { type: 'r', document_id: 10 }, moderator)).toBe(false);
    expect(canAdd(route, { type: 'w', document_id: 20 }, moderator, [{ document_id: 20 }])).toBe(false);
    expect(canAdd(route, { type: 'w', document_id: 21, waypoint_type: 'climbing_indoor' }, moderator)).toBe(false);
  });

  it('leaves the waypoint links, personal articles and reports to the moderators', () => {
    const waypoint = { type: 'w', document_id: 10 };
    expect(canAdd(waypoint, { type: 'w', document_id: 20 }, user)).toBe(false);
    expect(canAdd(waypoint, { type: 'w', document_id: 20 }, moderator)).toBe(true);
    expect(canAdd(waypoint, { type: 'a', document_id: 30, article_type: 'personal' }, user)).toBe(false);
    expect(canAdd(waypoint, { type: 'x', document_id: 40 }, user)).toBe(false);
  });

  it('lets a user remove anything from their outing but themselves', () => {
    const outing = { type: 'o', document_id: 10, associations: { routes: [{}] } };
    expect(canRemove(outing, { type: 'r', document_id: 20 }, user)).toBe(true);
    expect(canRemove(outing, { type: 'u', document_id: 7 }, user)).toBe(false);
    expect(canRemove(outing, { type: 'u', document_id: 8 }, user)).toBe(true);
  });

  it('blocks, for everyone, removing the last route or user of an outing', () => {
    const outing = { type: 'o', document_id: 10, associations: { routes: [{}], users: [{}] } };
    expect(removalBlock(outing, { type: 'r', document_id: 20 })).toBe('last_route');
    expect(removalBlock(outing, { type: 'u', document_id: 7 })).toBe('last_user');
    const shared = { ...outing, associations: { routes: [{}, {}], users: [{}, {}] } };
    expect(removalBlock(shared, { type: 'r', document_id: 20 })).toBeNull();
    expect(removalBlock(shared, { type: 'u', document_id: 7 })).toBeNull();
    // the lists missing: not blocked, the API decides
    expect(removalBlock({ type: 'o', document_id: 10 }, { type: 'r', document_id: 20 })).toBeNull();
  });

  it('blocks removing the last document of an image', () => {
    // on the page of the image: its lists
    const image = { type: 'i', document_id: 60, associations: { outings: [{}], routes: [] } };
    expect(removalBlock(image, { type: 'o', document_id: 10 })).toBe('last_document_of_image');
    const shared = { ...image, associations: { outings: [{}], routes: [{}] } };
    expect(removalBlock(shared, { type: 'o', document_id: 10 })).toBeNull();
    // listed on another page: the counts read when the editor opens
    const outing = { type: 'o', document_id: 10 };
    expect(removalBlock(outing, { type: 'i', document_id: 60 }, { 60: 1 })).toBe('last_document_of_image');
    expect(removalBlock(outing, { type: 'i', document_id: 60 }, { 60: 2 })).toBeNull();
    expect(removalBlock(outing, { type: 'i', document_id: 60 })).toBeNull();
  });

  it('counts the documents of the association lists, not the pages of recent outings', () => {
    expect(
      associatedCount({ associations: { routes: [{}, {}], users: [{}], recent_outings: { documents: [{}] } } })
    ).toBe(3);
  });

  it('lets a user remove from their own profile, and their own outings', () => {
    expect(canRemove({ type: 'u', document_id: 7 }, { type: 'a', document_id: 30 }, user)).toBe(true);
    const profile = { type: 'u', document_id: 8 };
    expect(canRemove(profile, { type: 'o', document_id: 50, author: { user_id: 7 } }, user)).toBe(true);
    expect(canRemove(profile, { type: 'o', document_id: 51, author: { user_id: 9 } }, user)).toBe(false);
    expect(canRemove(profile, { type: 'i', document_id: 60 }, user)).toBe(false);
  });
});
