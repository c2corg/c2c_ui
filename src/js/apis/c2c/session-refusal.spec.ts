import type { AxiosAdapter } from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { sessionRefusal } from './session-refusal';

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
