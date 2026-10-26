import { describe, expect, it } from 'vitest';

import { canAdd, canRemove } from './association-rights';

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

  it('keeps the last route of an outing, and the user in it', () => {
    const outing = { type: 'o', document_id: 10, associations: { routes: [{}] } };
    expect(canRemove(outing, { type: 'r', document_id: 20 }, moderator)).toBe(false);
    expect(canRemove({ ...outing, associations: { routes: [{}, {}] } }, { type: 'r', document_id: 20 }, user)).toBe(
      true
    );
    expect(canRemove(outing, { type: 'u', document_id: 7 }, user)).toBe(false);
    // the outing list of routes missing: not blocked, as before
    expect(canRemove({ type: 'o', document_id: 10 }, { type: 'r', document_id: 20 }, user)).toBe(true);
  });

  it('lets a user remove from their own profile, and their own outings', () => {
    expect(canRemove({ type: 'u', document_id: 7 }, { type: 'a', document_id: 30 }, user)).toBe(true);
    const profile = { type: 'u', document_id: 8 };
    expect(canRemove(profile, { type: 'o', document_id: 50, author: { user_id: 7 } }, user)).toBe(true);
    expect(canRemove(profile, { type: 'o', document_id: 51, author: { user_id: 9 } }, user)).toBe(false);
    expect(canRemove(profile, { type: 'i', document_id: 60 }, user)).toBe(false);
  });
});
