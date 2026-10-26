import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { z } from 'zod';

import BaseApi from './BaseApi';
import { loginResponse } from './c2c/schemas';
import { checkResponse } from './check-response';

const schema = z.object({ id: z.number(), name: z.string() });

// let pending promises settle
const flush = () => new Promise((resolve) => setTimeout(resolve));

describe('checkResponse', () => {
  afterEach(() => vi.restoreAllMocks());

  it('gives the data as the API gave it, with the properties the schema does not list', () => {
    const data = { id: 1, name: 'Mont Blanc', extra: true };

    expect(checkResponse(schema, data, 'GET /x', true)).toBe(data);
  });

  it("types the data as the schema's input, as it is the API's and not zod's parsed copy", () => {
    const transformed = z.object({ id: z.string().transform(Number) });

    expectTypeOf(checkResponse(transformed, { id: '7' }, 'GET /x', true)).toEqualTypeOf<{ id: string }>();
    expect(checkResponse(transformed, { id: '7' }, 'GET /x', true)).toEqual({ id: '7' });
  });

  it('fails loudly in development and tests, and only reports in production', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const data = { id: '1' };

    expect(() => checkResponse(schema, data, 'GET /x', true)).toThrow(/Unexpected response to GET \/x:[\s\S]*id/);
    expect(checkResponse(schema, data, 'GET /x', false)).toBe(data);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('Unexpected response to GET /x'));
  });

  it('checks the requests of the API clients: a wrong answer is the error of the request', async () => {
    const api = new BaseApi('http://api.test');
    vi.spyOn(api.axios, 'get')
      .mockResolvedValueOnce({ data: { id: 1, name: 'ok' } })
      .mockResolvedValueOnce({ data: {} });

    const ok = api.getValidated('/ok', schema);
    const wrong = api.getValidated('/wrong', schema);
    await flush();

    expect(ok.data).toEqual({ id: 1, name: 'ok' });
    expect(wrong.data).toBeNull();
    expect(String(wrong.error)).toContain('Unexpected response to GET /wrong');
  });
});

describe('the c2c API schemas', () => {
  it('accepts a login answer of the API (token_to_response in v6_api)', () => {
    const answer = {
      token: 'eyJhbGciOiJIUzI1NiJ9.e30.x',
      username: 'e2etester',
      name: 'E2E Tester',
      forum_username: 'e2etester',
      expire: 1794046564,
      roles: [],
      id: 1,
      lang: 'fr',
    };

    expect(loginResponse.safeParse(answer).success).toBe(true);
    expect(loginResponse.safeParse({ ...answer, token: null }).success).toBe(false);
  });
});
