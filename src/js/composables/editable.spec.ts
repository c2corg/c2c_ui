import { describe, expect, it } from 'vitest';

import { deletion, isDeletable, isEditable } from './editable';

const user = { isModerator: false, id: 7 };
const moderator = { isModerator: true, id: 1 };

describe('isEditable', () => {
  it('lets nobody edit a version, a draft or a printed document', () => {
    expect(isEditable({}, 'route', moderator, false)).toBe(false);
  });

  it('lets the moderators edit everything, the others not the protected documents', () => {
    expect(isEditable({ protected: true }, 'route', moderator, true)).toBe(true);
    expect(isEditable({ protected: true }, 'route', user, true)).toBe(false);
    expect(isEditable({}, 'waypoint', user, true)).toBe(true);
  });

  it('lets the users edit their profile, their personal articles and images, and their outings', () => {
    expect(isEditable({ document_id: 7 }, 'profile', user, true)).toBe(true);
    expect(isEditable({ document_id: 8 }, 'profile', user, true)).toBe(false);
    expect(isEditable({ article_type: 'collab', author: { user_id: 8 } }, 'article', user, true)).toBe(true);
    expect(isEditable({ article_type: 'personal', author: { user_id: 8 } }, 'article', user, true)).toBe(false);
    expect(isEditable({ image_type: 'personal', creator: { user_id: 7 } }, 'image', user, true)).toBe(true);
    expect(isEditable({ image_type: 'copyright', creator: { user_id: 8 } }, 'image', user, true)).toBe(false);
    expect(isEditable({ associations: { users: [{ document_id: 7 }] } }, 'outing', user, true)).toBe(true);
    expect(isEditable({ associations: { users: [{ document_id: 8 }] } }, 'outing', user, true)).toBe(false);
  });

  it('lets the author and the users of a report edit it', () => {
    const xreport = { author: { user_id: 8 }, associations: { users: [{ document_id: 9 }] } };
    expect(isEditable(xreport, 'xreport', { ...user, id: 8 }, true)).toBe(true);
    expect(isEditable(xreport, 'xreport', { ...user, id: 9 }, true)).toBe(true);
    expect(isEditable(xreport, 'xreport', user, true)).toBe(false);
  });

  it('fails on an unknown image type', () => {
    expect(() => isEditable({ image_type: 'other' }, 'image', user, true)).toThrow('Unexpected image_type : other');
  });
});

describe('isDeletable', () => {
  it('lets the users delete their outings, personal images, reports and personal articles', () => {
    expect(isDeletable({ associations: { users: [{ document_id: 7 }] } }, 'outing', user, true)).toBe(true);
    expect(isDeletable({ image_type: 'personal', creator: { user_id: 7 } }, 'image', user, true)).toBe(true);
    expect(isDeletable({ image_type: 'collaborative', creator: { user_id: 7 } }, 'image', user, true)).toBe(false);
    expect(isDeletable({ author: { user_id: 7 } }, 'xreport', user, true)).toBe(true);
    expect(isDeletable({ article_type: 'personal', author: { user_id: 7 } }, 'article', user, true)).toBe(true);
    expect(isDeletable({ article_type: 'collab', author: { user_id: 7 } }, 'article', user, true)).toBe(false);
    expect(isDeletable({}, 'route', user, true)).toBe(false);
  });

  it('lets the moderators delete everything but profiles and areas', () => {
    expect(isDeletable({}, 'route', moderator, true)).toBe(true);
    expect(isDeletable({}, 'profile', moderator, true)).toBe(false);
    expect(isDeletable({}, 'area', moderator, true)).toBe(false);
    expect(isDeletable({}, 'route', moderator, false)).toBe(false);
  });
});

describe('deletion', () => {
  const now = new Date('2026-11-25T12:00:00Z');
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 3600 * 1000).toISOString();
  const outing = (createdDaysAgo: number, users = [{ document_id: 7 }]) => ({
    author: { user_id: 7, created_at: daysAgo(createdDaysAgo) },
    associations: { users },
  });

  it('shows the button to the author of an outing only, until 30 days after its creation', () => {
    expect(deletion(outing(29), 'outing', user, true, now)).toEqual({
      blocked: null,
      until: new Date(daysAgo(-1)),
    });
    expect(deletion(outing(31), 'outing', user, true, now)?.blocked).toBe('too_old');
    // another user of the outing: no button
    expect(deletion(outing(1, [{ document_id: 7 }, { document_id: 8 }]), 'outing', { ...user, id: 8 }, true, now)).toBe(
      null
    );
  });

  it('disables it while other users are linked to the outing', () => {
    expect(deletion(outing(1, [{ document_id: 7 }, { document_id: 8 }]), 'outing', user, true, now)?.blocked).toBe(
      'other_participants'
    );
  });

  it('reads the creation of an image from its creator', () => {
    const image = { image_type: 'personal', creator: { user_id: 7, created_at: daysAgo(40) } };
    expect(deletion(image, 'image', user, true, now)?.blocked).toBe('too_old');
  });

  it('knows no period without the date (older API), and no rule for the moderators', () => {
    expect(deletion({ associations: { users: [{ document_id: 7 }] } }, 'outing', user, true, now)).toEqual({
      blocked: null,
      until: null,
    });
    expect(deletion(outing(100, [{ document_id: 7 }, { document_id: 8 }]), 'outing', moderator, true, now)).toEqual({
      blocked: null,
      until: null,
    });
    expect(deletion({}, 'route', user, true, now)).toBe(null);
  });
});
