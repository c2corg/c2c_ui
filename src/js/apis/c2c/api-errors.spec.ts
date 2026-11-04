import { mount } from '@vue/test-utils';
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, reactive } from 'vue';

import { apiErrors, errorStatus } from './api-errors';

import ModalConfirmation from '@/components/generics/modals/ModalConfirmation.vue';

// a failed request of axios: with the answer of the server, or without (network error)
const failed = (response?: { status: number; data: unknown }) =>
  new AxiosError(
    'Request failed',
    response ? 'ERR_BAD_REQUEST' : 'ERR_NETWORK',
    { method: 'post', url: '/routes', headers: new AxiosHeaders() },
    null,
    response && ({ ...response, statusText: '', headers: {}, config: {} } as AxiosResponse)
  );

const UNEXPECTED = { location: 'body', name: '', description: 'An unexpected error occurred, please try again' };

describe('apiErrors', () => {
  it('gives the errors of the API', () => {
    const errors = [{ location: 'body', name: 'locales.0.title', description: 'Required' }];

    expect(apiErrors(failed({ status: 400, data: { status: 'error', errors } }))).toEqual(errors);
  });

  it.each([
    ['without answer', failed()],
    ['with the error page of a proxy', failed({ status: 502, data: '<html>Bad Gateway</html>' })],
    ['with an empty error list', failed({ status: 400, data: { status: 'error', errors: [] } })],
    ['for an error of the code', new TypeError('x is undefined')],
  ])('gives one unexpected error %s', (_, error) => {
    expect(apiErrors(error)).toEqual([UNEXPECTED]);
  });

  it('fails loudly on an error answer of another shape, in development and in the tests', () => {
    const error = failed({ status: 400, data: { status: 'error', errors: [{ message: 'Required' }] } });

    expect(() => apiErrors(error)).toThrow('Unexpected response to POST /routes');
  });

  it('checks every JSON answer: a change of its status fails too', () => {
    const errors = [{ location: 'body', name: 'title', description: 'Required' }];

    expect(() => apiErrors(failed({ status: 400, data: { status: 'failed', errors } }))).toThrow(
      'Unexpected response to POST /routes'
    );
  });

  describe('in production', () => {
    beforeEach(() => {
      vi.stubEnv('DEV', false);
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
      vi.unstubAllEnvs();
      vi.restoreAllMocks();
    });

    it('reports an answer of another shape, and keeps its valid errors', () => {
      const valid = { location: 'body', name: 'title', description: 'Required' };
      const data = { status: 'error', errors: [null, { description: 'no name' }, valid] };

      expect(apiErrors(failed({ status: 400, data }))).toEqual([valid]);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Unexpected response to POST /routes'));
    });

    it('gives the unexpected error when no error is valid', () => {
      expect(apiErrors(failed({ status: 400, data: { status: 'error', errors: [null] } }))).toEqual([UNEXPECTED]);
      expect(apiErrors(failed({ status: 400, data: { status: 'failed' } }))).toEqual([UNEXPECTED]);
    });

    it('keeps the valid validation errors of FastAPI, or gives the unexpected error', () => {
      const valid = { loc: ['body', 'title'], msg: 'Field required', type: 'missing' };

      expect(apiErrors(failed({ status: 422, data: { detail: [null, valid] } }))).toEqual([
        { location: 'body', name: 'title', description: 'Required' },
      ]);
      expect(apiErrors(failed({ status: 422, data: { detail: 'Unprocessable' } }))).toEqual([UNEXPECTED]);
    });
  });

  describe('with the validation errors of FastAPI (422)', () => {
    const invalid = (...detail: unknown[]) => failed({ status: 422, data: { detail } });

    it('gives them as errors of the API: their field as a dotted path, their text as the API gives it', () => {
      const errors = apiErrors(
        invalid(
          { loc: ['body', 'locales', 0, 'title'], msg: 'Field required', type: 'missing' },
          {
            loc: ['body', 'name'],
            msg: 'String should have at most 25 characters',
            type: 'string_too_long',
            ctx: { max_length: 25 },
          },
          {
            loc: ['body', 'username'],
            msg: 'String should have at least 3 characters',
            type: 'string_too_short',
            ctx: { min_length: 3 },
          },
          {
            loc: ['body', 'associations', 'routes'],
            msg: 'List should have at least 1 item',
            type: 'too_short',
            ctx: { min_length: 1 },
          }
        )
      );

      expect(errors).toEqual([
        { location: 'body', name: 'locales.0.title', description: 'Required' },
        { location: 'body', name: 'name', description: 'Longer than maximum length 25' },
        { location: 'body', name: 'username', description: 'Shorter than minimum length 3' },
        { location: 'body', name: 'associations.routes', description: 'Shorter than minimum length 1' },
      ]);
    });

    it('keeps the text of FastAPI for the other errors, and names the query string as the API does', () => {
      const detail = {
        loc: ['query', 'limit'],
        msg: 'Input should be a valid integer, unable to parse string as an integer',
        type: 'int_parsing',
      };

      expect(apiErrors(invalid(detail))).toEqual([{ location: 'querystring', name: 'limit', description: detail.msg }]);
    });

    it('keeps the text of FastAPI for a length error without its limit, and for a type of Object.prototype', () => {
      const errors = apiErrors(
        invalid(
          { loc: ['body', 'name'], msg: 'String should have at most 25 characters', type: 'string_too_long' },
          { loc: ['body', 'title'], msg: 'String too short', type: 'string_too_short', ctx: { min_length: 'x' } },
          { loc: ['body', 'title'], msg: 'Odd', type: '__proto__' },
          { loc: ['body', 'title'], msg: 'Odder', type: 'toString' }
        )
      );

      expect(errors.map(({ description }) => description)).toEqual([
        'String should have at most 25 characters',
        'String too short',
        'Odd',
        'Odder',
      ]);
    });

    it('gives an error of the whole body without a name', () => {
      const detail = { loc: ['body'], msg: 'Field required', type: 'missing' };

      expect(apiErrors(invalid(detail))).toEqual([{ location: 'body', name: '', description: 'Required' }]);
    });

    it('fails loudly on a detail of another shape', () => {
      expect(() => apiErrors(failed({ status: 422, data: { detail: 'Unprocessable' } }))).toThrow(
        'Unexpected response to POST /routes'
      );
    });
  });

  it('gives the status of the answer', () => {
    expect(errorStatus(failed({ status: 403, data: {} }))).toBe(403);
    expect(errorStatus(failed())).toBeUndefined();
  });
});

describe('ModalConfirmation', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows the error of the API in the language of the user', async () => {
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const promise = reactive<{ error: unknown }>({ error: null });
    mount(ModalConfirmation, {
      props: { promise },
      global: {
        stubs: { ModalCard: true },
        directives: { translate: {} },
        config: {
          globalProperties: {
            // the API messages are translated in their own context
            $gettext: (msgid: string, msgctxt?: string) => (msgctxt === 'API message' ? `[fr] ${msgid}` : msgid),
          } as never,
        },
      },
    });

    const description = 'Only document less than 24h old can be deleted';
    promise.error = failed({
      status: 400,
      data: { status: 'error', errors: [{ location: 'body', name: 'document', description }] },
    });
    await nextTick();

    expect(alert).toHaveBeenCalledWith(`[fr] ${description}`);
  });
});
