import { describe, expect, it } from 'vitest';

import {
  forgetReturnUrl,
  isAllowedReturnUrl,
  oauthStart,
  PRODUCTION_ORIGIN,
  relayTarget,
  rememberReturnUrl,
  usesRelay,
} from './trackers-oauth-relay';

const PREPROD = 'https://www.preprod.camptocamp.org';
const PREVIEW = 'https://c2corg.github.io';
const PREPROD_PAGE = `${PREPROD}/trackers/strava/exchange-token`;
const PREVIEW_PAGE = `${PREVIEW}/c2c_ui/my-branch/#/trackers/strava/exchange-token`;

describe('isAllowedReturnUrl', () => {
  it.each([PREPROD_PAGE, PREVIEW_PAGE, `${PREPROD}/`])('allows %s', (url) => {
    expect(isAllowedReturnUrl(url)).toBe(true);
  });

  it.each([
    'https://www.camptocamp.org/trackers/strava/exchange-token',
    'http://www.preprod.camptocamp.org/trackers/strava/exchange-token',
    'https://www.preprod.camptocamp.org.evil.com/trackers/strava/exchange-token',
    'https://evil.com/www.preprod.camptocamp.org',
    'https://user@www.preprod.camptocamp.org/trackers/strava/exchange-token',
    'https://c2corg.github.io/other-project/',
    'https://c2corg.github.io/c2c_ui',
    'https://evilc2corg.github.io/c2c_ui/branch/',
    'http://localhost:8080/trackers/strava/exchange-token',
    'javascript:alert(1)',
    'not an url',
    '',
  ])('refuses %s', (url) => {
    expect(isAllowedReturnUrl(url)).toBe(false);
  });
});

describe('usesRelay', () => {
  it('is for the pre-production and the previews only', () => {
    expect(usesRelay(PREPROD)).toBe(true);
    expect(usesRelay(PREVIEW)).toBe(true);
    expect(usesRelay(PRODUCTION_ORIGIN)).toBe(false);
    expect(usesRelay('https://www.demov6.camptocamp.org')).toBe(false);
    expect(usesRelay('http://localhost:8080')).toBe(false);
  });
});

describe('oauthStart', () => {
  it('does not change anything on the other sites', () => {
    expect(oauthStart(PRODUCTION_ORIGIN, `${PRODUCTION_ORIGIN}/trackers/strava/exchange-token`)).toEqual({
      origin: PRODUCTION_ORIGIN,
      state: undefined,
    });
    expect(oauthStart('http://localhost:8080', 'http://localhost:8080/x', 'c2c')).toEqual({
      origin: 'http://localhost:8080',
      state: 'c2c',
    });
  });

  it('goes through the production site, keeping the page to come back to in the state', () => {
    const { origin, state } = oauthStart(PREPROD, PREPROD_PAGE);
    expect(origin).toBe(PRODUCTION_ORIGIN);
    expect(state).toBe(`;return=${encodeURIComponent(PREPROD_PAGE)}`);
  });

  it('keeps the state the provider needs', () => {
    expect(oauthStart(PREPROD, PREPROD_PAGE, 'c2c').state).toMatch(/^c2c;return=/);
  });
});

describe('relayTarget', () => {
  const stateOf = (page: string, defaultState?: string): string => oauthStart(PREPROD, page, defaultState).state!;

  it('sends the browser back to the pre-production, with the answer of the provider', () => {
    const target = relayTarget(
      'strava',
      { code: 'abc123', scope: 'read', state: stateOf(PREPROD_PAGE) },
      '',
      PRODUCTION_ORIGIN
    );
    expect(target).toBe(`${PREPROD_PAGE}?code=abc123&scope=read`);
  });

  it('gives the tracking service the state it needed, not our own part', () => {
    const target = relayTarget(
      'decathlon',
      { code: 'abc', state: stateOf(PREPROD_PAGE.replace('strava', 'decathlon'), 'c2c') },
      '',
      PRODUCTION_ORIGIN
    );
    expect(target).toBe(`${PREPROD}/trackers/decathlon/exchange-token?code=abc&state=c2c`);
  });

  it('puts the answer in the route when the preview uses the hash router', () => {
    const target = relayTarget('strava', { code: 'abc', state: stateOf(PREVIEW_PAGE) }, '', PRODUCTION_ORIGIN);
    expect(target).toBe(`${PREVIEW}/c2c_ui/my-branch/#/trackers/strava/exchange-token?code=abc`);
  });

  it('forwards the errors of the provider', () => {
    const target = relayTarget(
      'strava',
      { error: 'access_denied', state: stateOf(PREPROD_PAGE) },
      '',
      PRODUCTION_ORIGIN
    );
    expect(target).toBe(`${PREPROD_PAGE}?error=access_denied`);
  });

  it('falls back to the cookie when the provider does not return the state', () => {
    const cookie = `a=1; c2c_trackers_return=${encodeURIComponent(PREPROD_PAGE)}; b=2`;
    expect(relayTarget('strava', { code: 'abc' }, cookie, PRODUCTION_ORIGIN)).toBe(`${PREPROD_PAGE}?code=abc`);
    // a state without ours is kept
    expect(relayTarget('strava', { code: 'abc', state: 'c2c' }, cookie, PRODUCTION_ORIGIN)).toBe(
      `${PREPROD_PAGE}?code=abc&state=c2c`
    );
  });

  it('prefers the state to the cookie', () => {
    const cookie = `c2c_trackers_return=${encodeURIComponent(PREVIEW_PAGE)}`;
    expect(relayTarget('strava', { code: 'abc', state: stateOf(PREPROD_PAGE) }, cookie, PRODUCTION_ORIGIN)).toBe(
      `${PREPROD_PAGE}?code=abc`
    );
  });

  it('handles the answer here when nothing says otherwise', () => {
    expect(relayTarget('strava', { code: 'abc' }, '', PRODUCTION_ORIGIN)).toBeUndefined();
    expect(relayTarget('decathlon', { code: 'abc', state: 'c2c' }, '', PRODUCTION_ORIGIN)).toBeUndefined();
  });

  it('never sends the browser to a page that is not allowed', () => {
    const evil = 'https://evil.com/trackers/strava/exchange-token';
    expect(
      relayTarget('strava', { code: 'abc', state: `;return=${encodeURIComponent(evil)}` }, '', PRODUCTION_ORIGIN)
    ).toBeUndefined();
    expect(
      relayTarget('strava', { code: 'abc' }, `c2c_trackers_return=${encodeURIComponent(evil)}`, PRODUCTION_ORIGIN)
    ).toBeUndefined();
  });

  it('refuses a page that is not the exchange-token page of the vendor', () => {
    expect(relayTarget('polar', { code: 'abc', state: stateOf(PREPROD_PAGE) }, '', PRODUCTION_ORIGIN)).toBeUndefined();
    expect(
      relayTarget('strava', { code: 'abc', state: stateOf(`${PREPROD}/account`) }, '', PRODUCTION_ORIGIN)
    ).toBeUndefined();
  });

  it('does not loop on the page it already is on', () => {
    expect(relayTarget('strava', { code: 'abc', state: stateOf(PREPROD_PAGE) }, '', PREPROD)).toBeUndefined();
  });

  it('ignores a broken state or cookie', () => {
    expect(relayTarget('strava', { code: 'abc', state: ';return=%E0%A4%A' }, '', PRODUCTION_ORIGIN)).toBeUndefined();
    expect(relayTarget('strava', { code: 'abc' }, 'c2c_trackers_return=%E0%A4%A', PRODUCTION_ORIGIN)).toBeUndefined();
  });
});

describe('return cookie', () => {
  it('is shared with the production site, for the sites of the same domain only', () => {
    const doc = { cookie: '' };
    rememberReturnUrl('www.preprod.camptocamp.org', PREPROD_PAGE, doc);
    expect(doc.cookie).toBe(
      `c2c_trackers_return=${encodeURIComponent(PREPROD_PAGE)}; Domain=camptocamp.org; Path=/; Max-Age=900; Secure; SameSite=Lax`
    );

    const other = { cookie: '' };
    rememberReturnUrl('c2corg.github.io', PREVIEW_PAGE, other);
    expect(other.cookie).toBe('');
  });

  it('is removed', () => {
    const doc = { cookie: '' };
    forgetReturnUrl(doc);
    expect(doc.cookie).toContain('Max-Age=0');
    expect(doc.cookie).toContain('Domain=camptocamp.org');
  });
});
