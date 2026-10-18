import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import throttle from './throttle';

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls the function immediately on the first call', () => {
    const func = vi.fn();
    throttle(func, 100)('a', 'b');
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith('a', 'b');
  });

  it('ignores calls made within timeFrame after the last call', () => {
    const func = vi.fn();
    const throttled = throttle(func, 100);

    throttled(1);
    vi.advanceTimersByTime(50);
    throttled(2);
    vi.advanceTimersByTime(49);
    throttled(3);

    expect(func.mock.calls).toEqual([[1]]);
  });

  it('calls again once timeFrame has elapsed', () => {
    const func = vi.fn();
    const throttled = throttle(func, 100);

    throttled(1);
    vi.advanceTimersByTime(100);
    throttled(2);

    expect(func.mock.calls).toEqual([[1], [2]]);
  });

  it('measures timeFrame from the last accepted call, not the last attempt', () => {
    const func = vi.fn();
    const throttled = throttle(func, 100);

    throttled(1); // t = 0, accepted
    vi.advanceTimersByTime(90);
    throttled(2); // t = 90, ignored
    vi.advanceTimersByTime(10);
    throttled(3); // t = 100, accepted
    vi.advanceTimersByTime(99);
    throttled(4); // t = 199, ignored

    expect(func.mock.calls).toEqual([[1], [3]]);
  });

  it('does not call ignored calls later (no trailing call)', () => {
    const func = vi.fn();
    const throttled = throttle(func, 100);

    throttled(1);
    throttled(2);
    vi.advanceTimersByTime(1000);

    expect(func.mock.calls).toEqual([[1]]);
  });

  it('calls every time with timeFrame = 0', () => {
    const func = vi.fn();
    const throttled = throttle(func, 0);

    throttled();
    throttled();
    throttled();

    expect(func).toHaveBeenCalledTimes(3);
  });

  it('keeps separate state for separately throttled functions', () => {
    const funcA = vi.fn();
    const funcB = vi.fn();
    const throttledA = throttle(funcA, 100);
    const throttledB = throttle(funcB, 100);

    throttledA();
    throttledB();
    throttledA();

    expect(funcA).toHaveBeenCalledTimes(1);
    expect(funcB).toHaveBeenCalledTimes(1);
  });

  it('does not forward `this` (callers pass bound methods)', () => {
    const func = vi.fn();
    const obj = { method: throttle(func, 100) };
    obj.method();
    expect(func.mock.contexts[0]).toBeUndefined();
  });
});
