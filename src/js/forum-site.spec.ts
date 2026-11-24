import { describe, expect, it } from 'vitest';

import { isForumSite } from './forum-site';

describe('isForumSite', () => {
  it.each([
    ['https://forum.camptocamp.org', 'www.camptocamp.org'],
    ['https://forum.demov6.camptocamp.org', 'www.demov6.camptocamp.org'],
    ['https://forum.preprod.camptocamp.org', 'www.preprod.camptocamp.org'],
  ])('is true for %s seen from %s', (forum, host) => {
    expect(isForumSite(forum, host)).toBe(true);
  });

  it.each([
    ['https://forum.demov6.camptocamp.org', 'localhost'],
    ['https://forum.camptocamp.org', 'c2corg.github.io'],
    ['https://forum.camptocamp.org', 'www.demov6.camptocamp.org'],
    ['https://forum.camptocamp.org', 'camptocamp.org'],
  ])('is false for %s seen from %s', (forum, host) => {
    expect(isForumSite(forum, host)).toBe(false);
  });

  it('is false for a forum url that is not one', () => {
    expect(isForumSite('', 'www.camptocamp.org')).toBe(false);
  });
});
