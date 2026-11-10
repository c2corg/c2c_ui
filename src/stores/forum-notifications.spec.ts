import { AxiosError, AxiosHeaders } from 'axios';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useForumNotificationsStore } from './forum-notifications';

import forum from '@/js/apis/forum';

vi.mock('@/js/apis/forum', () => ({ default: { getCurrentUser: vi.fn(), pollMessageBus: vi.fn() } }));

const getCurrentUser = vi.mocked(forum.getCurrentUser);
const pollMessageBus = vi.mocked(forum.pollMessageBus);

const forumUser = (unread: number, unreadHighPriority: number, username = 'alice_forum') => ({
  id: 7,
  username,
  unread_notifications: unread,
  unread_high_priority_notifications: unreadHighPriority,
  notification_channel_position: 100,
});

const notFound = () =>
  new AxiosError('Not Found', 'ERR_BAD_REQUEST', undefined, undefined, {
    status: 404,
    statusText: 'Not Found',
    data: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

// what the browser gives when the forum's answer lacks Access-Control-Allow-Credentials
const corsRejected = () => new AxiosError('Network Error', 'ERR_NETWORK');

const message = (id: number, unread: number, unreadHighPriority: number) => ({
  channel: '/notification/7',
  message_id: id,
  data: { unread_notifications: unread, unread_high_priority_notifications: unreadHighPriority },
});

// a long poll that stays open until the test answers it, or until it is aborted
const openLongPolls: { resolve: (messages: unknown[]) => void; reject: (error: unknown) => void }[] = [];
const holdLongPolls = () =>
  pollMessageBus.mockImplementation(
    (_clientId, _positions, long, signal) =>
      new Promise((resolve, reject) => {
        if (!long) {
          resolve([]);
          return;
        }
        signal?.addEventListener('abort', () => reject(new AxiosError('canceled', 'ERR_CANCELED')));
        openLongPolls.push({ resolve: resolve as (messages: unknown[]) => void, reject });
      })
  );

const setHidden = (hidden: boolean) => {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event('visibilitychange'));
};

describe('forum notifications store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
    openLongPolls.length = 0;
    setHidden(false);
  });

  afterEach(() => {
    useForumNotificationsStore().stop();
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it('stays off without a forum session', async () => {
    getCurrentUser.mockRejectedValue(notFound());
    const store = useForumNotificationsStore();

    await store.start('alice_forum');

    expect(store).toMatchObject({ mode: 'off', unread: 0, unreadHighPriority: 0 });
    expect(pollMessageBus).not.toHaveBeenCalled();
  });

  // a shared browser: the forum session is someone else's
  it('stays off when the forum session is of another user', async () => {
    getCurrentUser.mockResolvedValue(forumUser(3, 1, 'bob'));
    const store = useForumNotificationsStore();

    await store.start('alice_forum');

    expect(store).toMatchObject({ mode: 'off', unread: 0, unreadHighPriority: 0 });
  });

  it('polls the session when the forum refuses MessageBus with credentials', async () => {
    getCurrentUser.mockResolvedValue(forumUser(3, 1));
    pollMessageBus.mockRejectedValue(corsRejected());
    const store = useForumNotificationsStore();

    await store.start('alice_forum');

    expect(store).toMatchObject({ mode: 'polling', unread: 3, unreadHighPriority: 1 });
    expect(pollMessageBus).toHaveBeenCalledWith(expect.any(String), { '/notification/7': 100 }, false);

    getCurrentUser.mockResolvedValue(forumUser(5, 2));
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);

    expect(store).toMatchObject({ unread: 5, unreadHighPriority: 2 });
  });

  it('follows the notification channel live', async () => {
    getCurrentUser.mockResolvedValue(forumUser(3, 1));
    holdLongPolls();
    const store = useForumNotificationsStore();

    await store.start('alice_forum');
    await vi.advanceTimersByTimeAsync(0);

    expect(store.mode).toBe('messagebus');
    expect(openLongPolls).toHaveLength(1);

    openLongPolls[0].resolve([message(101, 4, 2)]);
    await vi.advanceTimersByTimeAsync(0);

    expect(store).toMatchObject({ unread: 4, unreadHighPriority: 2 });
    // the next long poll asks for what comes after that message
    expect(pollMessageBus).toHaveBeenLastCalledWith(
      expect.any(String),
      { '/notification/7': 101 },
      true,
      expect.any(AbortSignal)
    );
  });

  it('falls back to polling after three MessageBus failures in a row', async () => {
    getCurrentUser.mockResolvedValue(forumUser(3, 1));
    pollMessageBus.mockResolvedValueOnce([]).mockRejectedValue(new AxiosError('Bad Gateway', 'ERR_BAD_RESPONSE'));
    const store = useForumNotificationsStore();

    await store.start('alice_forum');
    await vi.advanceTimersByTimeAsync(60 * 1000);

    expect(store.mode).toBe('polling');
    // the probe, then three long polls
    expect(pollMessageBus).toHaveBeenCalledTimes(4);
  });

  it('stops the long poll while the page is hidden, and catches up when it is back', async () => {
    getCurrentUser.mockResolvedValue(forumUser(3, 1));
    holdLongPolls();
    const store = useForumNotificationsStore();
    await store.start('alice_forum');
    await vi.advanceTimersByTimeAsync(0);

    setHidden(true);
    await vi.advanceTimersByTimeAsync(10 * 60 * 1000);

    expect(openLongPolls).toHaveLength(1);
    expect(getCurrentUser).toHaveBeenCalledOnce();

    getCurrentUser.mockResolvedValue(forumUser(6, 0));
    setHidden(false);
    await vi.advanceTimersByTimeAsync(0);

    expect(store).toMatchObject({ mode: 'messagebus', unread: 6, unreadHighPriority: 0 });
    expect(openLongPolls).toHaveLength(2);
  });

  it('refreshes at most every 30 s when the page gets the focus back', async () => {
    getCurrentUser.mockResolvedValue(forumUser(3, 1));
    pollMessageBus.mockRejectedValue(corsRejected());
    const store = useForumNotificationsStore();
    await store.start('alice_forum');

    window.dispatchEvent(new Event('focus'));
    await vi.advanceTimersByTimeAsync(0);
    expect(getCurrentUser).toHaveBeenCalledOnce();

    await vi.advanceTimersByTimeAsync(30 * 1000);
    window.dispatchEvent(new Event('focus'));
    await vi.advanceTimersByTimeAsync(0);
    expect(getCurrentUser).toHaveBeenCalledTimes(2);
  });

  it('clears the counts and ignores late answers once stopped', async () => {
    getCurrentUser.mockResolvedValue(forumUser(3, 1));
    holdLongPolls();
    const store = useForumNotificationsStore();
    await store.start('alice_forum');
    await vi.advanceTimersByTimeAsync(0);

    store.stop();
    openLongPolls[0].resolve([message(101, 4, 2)]);
    await vi.advanceTimersByTimeAsync(10 * 60 * 1000);

    expect(store).toMatchObject({ mode: 'off', unread: 0, unreadHighPriority: 0 });
    expect(pollMessageBus).toHaveBeenCalledTimes(2);
  });
});
