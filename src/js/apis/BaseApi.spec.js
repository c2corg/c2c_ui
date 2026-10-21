import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toRaw } from 'vue';

import BaseApi from './BaseApi';
import forum from './forum';

// let pending promises settle, and node report unhandled rejections
const flush = () => new Promise((resolve) => setTimeout(resolve));

describe('ApiData', () => {
  const onUnhandledRejection = vi.fn();
  const api = new BaseApi('http://api.test');

  beforeEach(() => {
    onUnhandledRejection.mockClear();
    process.on('unhandledRejection', onUnhandledRejection);
  });

  afterEach(() => {
    process.off('unhandledRejection', onUnhandledRejection);
    vi.restoreAllMocks();
  });

  it('exposes the response of a successful request', async () => {
    vi.spyOn(api.axios, 'get').mockResolvedValue({ data: { id: 1 } });
    const success = vi.fn();

    const result = api.get('/doc').then(success);
    await flush();

    expect(success).toHaveBeenCalledWith({ data: { id: 1 } });
    expect(result.loading).toBe(false);
    expect(result.data).toEqual({ id: 1 });
  });

  it('keeps the error of a failed request, without an unhandled rejection when then() has no error callback', async () => {
    const error = new Error('Network Error');
    vi.spyOn(api.axios, 'get').mockRejectedValue(error);
    const success = vi.fn();
    const onCatch = vi.fn();

    const result = api.get('/doc').then(success).catch(onCatch);
    await flush();

    expect(success).not.toHaveBeenCalled();
    expect(onCatch).toHaveBeenCalledWith(error);
    expect(result.loading).toBe(false);
    expect(result.error).toBe(error);
    expect(onUnhandledRejection).not.toHaveBeenCalled();
  });

  it('passes the error to the error callback of then()', async () => {
    const error = new Error('Network Error');
    vi.spyOn(api.axios, 'get').mockRejectedValue(error);
    const failure = vi.fn();

    api.get('/doc').then(() => {}, failure);
    await flush();

    expect(failure).toHaveBeenCalledWith(error);
    expect(onUnhandledRejection).not.toHaveBeenCalled();
  });

  it('still reports an error thrown by a success callback', async () => {
    vi.spyOn(api.axios, 'get').mockResolvedValue({ data: {} });
    const bug = new TypeError("Cannot read properties of undefined (reading 'users')");

    api.get('/doc').then(() => {
      throw bug;
    });
    await flush();

    expect(onUnhandledRejection).toHaveBeenCalledWith(bug, expect.anything());
  });
});

describe('forum.getLatest', () => {
  const onUnhandledRejection = vi.fn();

  beforeEach(() => {
    onUnhandledRejection.mockClear();
    process.on('unhandledRejection', onUnhandledRejection);
  });

  afterEach(() => {
    process.off('unhandledRejection', onUnhandledRejection);
    vi.restoreAllMocks();
  });

  it('links each topic to its last poster', async () => {
    const user = { username: 'alice', avatar_template: '/a/{size}.png' };
    vi.spyOn(forum.axios, 'get').mockResolvedValue({
      data: { users: [user], topic_list: { topics: [{ id: 1, last_poster_username: 'alice' }] } },
    });

    const result = forum.getLatest([29, 40]);
    await flush();

    expect(forum.axios.get).toHaveBeenCalledWith(
      '/latest.json?exclude_category_ids[]=29&exclude_category_ids[]=40',
      undefined
    );
    // result is reactive: what it holds is read through reactive proxies of the response objects
    expect(toRaw(result.data.topic_list.topics[0].last_poster_user)).toBe(user);
  });

  it('keeps the error, without an unhandled rejection, when the forum is unreachable', async () => {
    const error = new Error('Network Error');
    vi.spyOn(forum.axios, 'get').mockRejectedValue(error);

    const result = forum.getLatest([29]);
    await flush();

    expect(result.error).toBe(error);
    expect(onUnhandledRejection).not.toHaveBeenCalled();
  });
});
