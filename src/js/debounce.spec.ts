import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import debounce from './debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls the function once wait has elapsed', () => {
    const func = vi.fn();
    const debounced = debounce(func, 200);

    debounced();
    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(199);
    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('waits 100ms by default', () => {
    const func = vi.fn();
    const debounced = debounce(func);

    debounced();
    vi.advanceTimersByTime(99);
    expect(func).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('restarts the delay on each call, and calls once with the last arguments', () => {
    const func = vi.fn();
    const debounced = debounce(func, 100);

    debounced('a');
    vi.advanceTimersByTime(60);
    debounced('b');
    vi.advanceTimersByTime(60);
    debounced('c', 'd');
    vi.advanceTimersByTime(99);
    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith('c', 'd');
  });

  it('calls again for calls made after the previous call fired', () => {
    const func = vi.fn();
    const debounced = debounce(func, 100);

    debounced(1);
    vi.advanceTimersByTime(100);
    debounced(2);
    vi.advanceTimersByTime(100);

    expect(func.mock.calls).toEqual([[1], [2]]);
  });

  it('forwards `this`', () => {
    const func = vi.fn(function (this: unknown) {
      return this;
    });
    const obj = { method: debounce(func, 10) };

    obj.method();
    vi.advanceTimersByTime(10);
    expect(func.mock.contexts[0]).toBe(obj);
  });

  it('keeps separate timers for separately debounced functions', () => {
    const funcA = vi.fn();
    const funcB = vi.fn();
    const debouncedA = debounce(funcA, 100);
    const debouncedB = debounce(funcB, 100);

    debouncedA();
    vi.advanceTimersByTime(50);
    debouncedB();
    vi.advanceTimersByTime(50);

    expect(funcA).toHaveBeenCalledTimes(1);
    expect(funcB).not.toHaveBeenCalled();
  });

  it('calls on the next tick with wait = 0', () => {
    const func = vi.fn();
    debounce(func, 0)();
    expect(func).not.toHaveBeenCalled();
    vi.advanceTimersByTime(0);
    expect(func).toHaveBeenCalledTimes(1);
  });
});
