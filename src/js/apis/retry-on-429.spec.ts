import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import retryOn429 from './retry-on-429';

// an axios instance whose requests get the given answers in turn: a status, with its headers and body
type Answer = { status: number; headers?: Record<string, string>; data?: unknown };

const instanceAnswering = (...answers: Answer[]) => {
  const adapter = vi.fn<AxiosAdapter>((config: InternalAxiosRequestConfig) => {
    const { status, headers = {}, data = '' } = answers.shift() ?? { status: 200 };
    const response = { status, statusText: '', headers, data, config };
    return status < 400
      ? Promise.resolve(response)
      : Promise.reject(new AxiosError('failed', String(status), config, null, response));
  });
  return { instance: retryOn429(axios.create({ adapter })), adapter };
};

describe('retryOn429', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('retries a GET once, after the delay of the Retry-After header', async () => {
    const { instance, adapter } = instanceAnswering({ status: 429, headers: { 'retry-after': '3' } }, { status: 200 });

    const request = instance.get('/routes');
    await vi.advanceTimersByTimeAsync(2900);
    expect(adapter).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(200);

    await expect(request).resolves.toMatchObject({ status: 200 });
    expect(adapter).toHaveBeenCalledTimes(2);
  });

  it('reads the delay from the body when the header is not exposed', async () => {
    const { instance, adapter } = instanceAnswering(
      { status: 429, data: 'Too many requests, retry after 2 seconds' },
      { status: 200 }
    );

    const request = instance.get('/routes');
    await vi.advanceTimersByTimeAsync(2000);

    await expect(request).resolves.toMatchObject({ status: 200 });
    expect(adapter).toHaveBeenCalledTimes(2);
  });

  it('does not retry a write, a second 429, or a delay over 30 seconds', async () => {
    const write = instanceAnswering({ status: 429, headers: { 'retry-after': '1' } });
    await expect(write.instance.post('/outings', {})).rejects.toThrow(AxiosError);
    expect(write.adapter).toHaveBeenCalledTimes(1);

    const twice = instanceAnswering(
      { status: 429, headers: { 'retry-after': '1' } },
      { status: 429, headers: { 'retry-after': '1' } }
    );
    const request = twice.instance.get('/routes');
    const rejected = expect(request).rejects.toThrow(AxiosError);
    await vi.advanceTimersByTimeAsync(1000);
    await rejected;
    expect(twice.adapter).toHaveBeenCalledTimes(2);

    const long = instanceAnswering({ status: 429, headers: { 'retry-after': '60' } });
    await expect(long.instance.get('/routes')).rejects.toThrow(AxiosError);
    expect(long.adapter).toHaveBeenCalledTimes(1);
  });
});
