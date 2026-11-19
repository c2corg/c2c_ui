import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  actionableCount,
  CACHE_KEY,
  CACHE_TTL,
  clearModerationCount,
  refreshModerationCount,
} from './moderation-count';

import { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';

vi.mock('@/js/apis/c2c', () => ({ default: { moderator: { countAccountRemovals: vi.fn() } } }));

const count = vi.mocked(c2c.moderator.countAccountRemovals);
const answer = (data: unknown) => new ApiData(Promise.resolve({ data } as never)) as never;

describe('moderation count', () => {
  beforeEach(() => {
    sessionStorage.clear();
    clearModerationCount();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it('asks the API, then reuses the answer for 5 minutes', async () => {
    count.mockReturnValue(answer({ open: 3, actionable: 2, roles: { topoguide: true, forum: false } }));

    await refreshModerationCount(9);
    expect(actionableCount.value).toBe(2);
    await refreshModerationCount(9);
    expect(count).toHaveBeenCalledOnce();

    vi.advanceTimersByTime(CACHE_TTL);
    await refreshModerationCount(9);
    expect(count).toHaveBeenCalledTimes(2);
  });

  it('asks again at once when forced, and for another user', async () => {
    count.mockReturnValue(answer({ open: 1, actionable: 1, roles: { topoguide: true, forum: false } }));
    await refreshModerationCount(9);
    await refreshModerationCount(9, true);
    await refreshModerationCount(10);
    expect(count).toHaveBeenCalledTimes(3);
    expect(JSON.parse(sessionStorage.getItem(CACHE_KEY)!)).toMatchObject({ user: 10, actionable: 1 });
  });

  it('shows no pill for an older API, nor when the request fails', async () => {
    count.mockReturnValue(answer({ open: 4, roles: { topoguide: true, forum: false } }));
    await refreshModerationCount(9);
    expect(actionableCount.value).toBe(0);

    count.mockReturnValue(new ApiData(Promise.reject(new Error('down'))) as never);
    await refreshModerationCount(9, true);
    expect(actionableCount.value).toBe(0);
  });
});
