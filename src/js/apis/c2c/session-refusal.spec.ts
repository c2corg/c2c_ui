import type { AxiosAdapter } from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { sentWithFormerToken, sessionRefusal } from './session-refusal';

import { CamptocampApi } from '@/js/apis/c2c';

const TOKEN = 'JWT token="the.token"';

const refused = (status: number, description: string, sent: unknown = TOKEN) => ({
  response: { status, data: { status: 'error', errors: [{ location: 'body', name: 'x', description }] } },
  config: { headers: { Authorization: sent } },
});

describe('sessionRefusal', () => {
  it('reads an invalid token', () => {
    expect(sessionRefusal(refused(401, 'Invalid token'), TOKEN)).toBe('invalid');
  });

  it('reads a blocked account', () => {
    expect(sessionRefusal(refused(403, 'account blocked'), TOKEN)).toBe('blocked');
  });

  it.each([
    ['another 401', refused(401, 'Unauthorized')],
    ['another 403', refused(403, 'Forbidden')],
    ['another status', refused(400, 'Invalid token')],
    ['a request without a token', refused(401, 'Invalid token', null)],
    ['a request of a former session', refused(401, 'Invalid token', 'JWT token="former"')],
    ['no answer', { config: { headers: { Authorization: TOKEN } } }],
    ['an answer that is not JSON', { response: { status: 401, data: '<html>' }, config: { headers: {} } }],
  ])('ignores %s', (_, error) => {
    expect(sessionRefusal(error, TOKEN)).toBeNull();
  });
});

describe('onSessionRefused', () => {
  const api = (status: number, data: unknown) => {
    const c2c = new CamptocampApi();
    c2c.axios.defaults.adapter = ((config) => Promise.reject({ response: { status, data }, config })) as AxiosAdapter;
    return c2c;
  };

  it('calls back with the reason, and still fails the request', async () => {
    const c2c = api(401, { status: 'error', errors: [{ description: 'Invalid token' }] });
    c2c.setAuthorizationToken('the.token');
    const callback = vi.fn();
    c2c.onSessionRefused(callback);

    await expect(c2c.axios.get('/users/account')).rejects.toMatchObject({ response: { status: 401 } });
    expect(callback).toHaveBeenCalledWith('invalid');
  });

  it('does not call back for an anonymous request', async () => {
    const c2c = api(401, { status: 'error', errors: [{ description: 'Invalid token' }] });
    const callback = vi.fn();
    c2c.onSessionRefused(callback);

    await expect(c2c.axios.get('/users/account')).rejects.toBeTruthy();
    expect(callback).not.toHaveBeenCalled();
  });
});

describe('sentWithFormerToken', () => {
  const FORMER = 'JWT token="former"';

  it('reads a request refused with a token replaced meanwhile', () => {
    expect(sentWithFormerToken(refused(401, 'Invalid token', FORMER), TOKEN)).toBe(true);
  });

  it.each([
    ['the current token', refused(401, 'Invalid token', TOKEN), TOKEN],
    ['no current token (signed out)', refused(401, 'Invalid token', FORMER), undefined],
    ['a request without a token', refused(401, 'Invalid token', null), TOKEN],
    ['a blocked account', refused(403, 'account blocked', FORMER), TOKEN],
    ['another 401', refused(401, 'Unauthorized', FORMER), TOKEN],
  ])('ignores %s', (_, error, current) => {
    expect(sentWithFormerToken(error, current)).toBe(false);
  });
});

describe('a request sent with a token renewed meanwhile', () => {
  it('is sent again with the current token', async () => {
    const c2c = new CamptocampApi();
    const sent: unknown[] = [];
    c2c.axios.defaults.adapter = ((config) => {
      sent.push(config.headers.Authorization);
      if (config.headers.Authorization === 'JWT token="new"') {
        return Promise.resolve({ data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config });
      }
      // the token is renewed while this request is on its way
      c2c.setAuthorizationToken('new');
      return Promise.reject({
        response: { status: 401, data: { status: 'error', errors: [{ description: 'Invalid token' }] } },
        config,
      });
    }) as AxiosAdapter;
    c2c.setAuthorizationToken('old');
    const refusedSession = vi.fn();
    c2c.onSessionRefused(refusedSession);

    const response = await c2c.axios.get('/users/account');

    expect(response.data).toEqual({ ok: true });
    expect(sent).toEqual(['JWT token="old"', 'JWT token="new"']);
    expect(refusedSession).not.toHaveBeenCalled();
  });

  it('is sent again once only', async () => {
    const c2c = new CamptocampApi();
    let calls = 0;
    c2c.axios.defaults.adapter = ((config) => {
      calls += 1;
      // a new token each time: still refused
      c2c.setAuthorizationToken(`token-${calls}`);
      return Promise.reject({
        response: { status: 401, data: { status: 'error', errors: [{ description: 'Invalid token' }] } },
        config,
      });
    }) as AxiosAdapter;
    c2c.setAuthorizationToken('token-0');

    await expect(c2c.axios.get('/users/account')).rejects.toBeTruthy();
    expect(calls).toBe(2);
  });
});
