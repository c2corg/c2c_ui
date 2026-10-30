import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import concurrencyLimit from './concurrency-limit';

const delay = <T>(ms: number, value?: T) =>
  new Promise<T | undefined>((resolve) => setTimeout(() => resolve(value), ms));
const fail = (ms: number, error: Error) => new Promise((resolve, reject) => setTimeout(() => reject(error), ms));

describe('concurrencyLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Wraps tasks to record how many run at the same time
  const tracker = () => {
    const state = {
      active: 0,
      maxActive: 0,
      started: [] as (string | number)[],
      wrap:
        <T>(name: string | number, task: () => Promise<T>) =>
        async () => {
          state.started.push(name);
          state.active++;
          state.maxActive = Math.max(state.maxActive, state.active);
          try {
            return await task();
          } finally {
            state.active--;
          }
        },
    };
    return state;
  };

  it('resolves with the task result', async () => {
    const limit = concurrencyLimit(2);
    const promise = limit(() => delay(100, 'result'));
    await vi.advanceTimersByTimeAsync(100);
    await expect(promise).resolves.toBe('result');
  });

  it('accepts synchronous tasks', async () => {
    const limit = concurrencyLimit(1);
    await expect(limit(() => 'sync')).resolves.toBe('sync');
  });

  it('never runs more than max tasks at once', async () => {
    const limit = concurrencyLimit(2);
    const t = tracker();
    const promises = [100, 50, 80, 10, 30].map((ms, i) => limit(t.wrap(i, () => delay(ms, i))));

    await vi.advanceTimersByTimeAsync(0);
    expect(t.started).toEqual([0, 1]);

    await vi.runAllTimersAsync();
    await expect(Promise.all(promises)).resolves.toEqual([0, 1, 2, 3, 4]);
    expect(t.maxActive).toBe(2);
  });

  it('starts queued tasks in FIFO order as slots free up', async () => {
    const limit = concurrencyLimit(2);
    const t = tracker();
    ['a', 'b', 'c', 'd'].forEach((name, i) => limit(t.wrap(name, () => delay([100, 50, 10, 10][i]))));

    await vi.advanceTimersByTimeAsync(0);
    expect(t.started).toEqual(['a', 'b']);

    await vi.advanceTimersByTimeAsync(50); // b done
    expect(t.started).toEqual(['a', 'b', 'c']);

    await vi.advanceTimersByTimeAsync(10); // c done
    expect(t.started).toEqual(['a', 'b', 'c', 'd']);
  });

  it('runs tasks one by one with max = 1', async () => {
    const limit = concurrencyLimit(1);
    const t = tracker();
    const promises = [30, 10, 20].map((ms, i) => limit(t.wrap(i, () => delay(ms, i))));

    await vi.advanceTimersByTimeAsync(29);
    expect(t.started).toEqual([0]);
    await vi.advanceTimersByTimeAsync(1);
    expect(t.started).toEqual([0, 1]);

    await vi.runAllTimersAsync();
    await expect(Promise.all(promises)).resolves.toEqual([0, 1, 2]);
    expect(t.maxActive).toBe(1);
  });

  it('runs all tasks at once when max is greater than the number of tasks', async () => {
    const limit = concurrencyLimit(10);
    const t = tracker();
    [1, 2, 3].forEach((i) => limit(t.wrap(i, () => delay(10))));
    await vi.advanceTimersByTimeAsync(0);
    expect(t.started).toEqual([1, 2, 3]);
  });

  it('rejects with the task error and frees the slot', async () => {
    const limit = concurrencyLimit(1);
    const error = new Error('boom');
    const failing = limit(() => fail(10, error));
    const next = limit(() => delay(10, 'next'));
    const failingResult = expect(failing).rejects.toBe(error);

    await vi.runAllTimersAsync();
    await failingResult;
    await expect(next).resolves.toBe('next');
  });

  it('rejects when a task throws synchronously, and frees the slot', async () => {
    const limit = concurrencyLimit(1);
    const error = new Error('sync boom');
    const failing = limit(() => {
      throw error;
    });
    const next = limit(() => 'next');

    await expect(failing).rejects.toBe(error);
    await expect(next).resolves.toBe('next');
  });

  it('does not call the task synchronously', () => {
    const limit = concurrencyLimit(1);
    const task = vi.fn();
    limit(task);
    expect(task).not.toHaveBeenCalled();
  });

  it('keeps separate limits for separate limiters', async () => {
    const limitA = concurrencyLimit(1);
    const limitB = concurrencyLimit(1);
    const t = tracker();
    limitA(t.wrap('a1', () => delay(100)));
    limitA(t.wrap('a2', () => delay(100)));
    limitB(t.wrap('b1', () => delay(100)));

    await vi.advanceTimersByTimeAsync(0);
    expect(t.started).toEqual(['a1', 'b1']);
  });

  it('can be reused after the queue has drained', async () => {
    const limit = concurrencyLimit(1);
    const first = limit(() => delay(10, 1));
    await vi.runAllTimersAsync();
    await expect(first).resolves.toBe(1);

    const second = limit(() => delay(10, 2));
    await vi.runAllTimersAsync();
    await expect(second).resolves.toBe(2);
  });
});
