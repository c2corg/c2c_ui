import { mount } from '@vue/test-utils';
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
