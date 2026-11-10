// The unread notifications of the signed in user on the forum, read from the browser with the forum cookie.
// Live through Discourse's MessageBus when the forum allows it (credentials on /message-bus/), else polled.
import { isAxiosError } from 'axios';
import { defineStore } from 'pinia';
import { ref } from 'vue';

import forum, { type CurrentForumUser, type MessageBusMessage, type NotificationCounts } from '@/js/apis/forum';

const POLL_INTERVAL = 5 * 60 * 1000;
// at most one refresh per 30 s when the user comes back to the page
const REFRESH_THROTTLE = 30 * 1000;
// MessageBus failures in a row before falling back to polling, and the wait after each one
const MAX_MESSAGE_BUS_FAILURES = 3;
const MESSAGE_BUS_RETRY_DELAY = 5 * 1000;

// off: no forum session, or not started
export type ForumNotificationsMode = 'off' | 'messagebus' | 'polling';

export const useForumNotificationsStore = defineStore('forum-notifications', () => {
  const unread = ref(0);
  const unreadHighPriority = ref(0);
  const mode = ref<ForumNotificationsMode>('off');

  // one MessageBus client per page load
  const clientId = crypto.randomUUID().replace(/-/g, '');

  // bumped by stop(): the requests and loops of an earlier start() drop what they get
  let run = 0;
  let username: string | null = null;
  let channel = '';
  let position = -1;
  let lastRefresh = 0;
  let listening = false;
  let pollTimer: ReturnType<typeof setInterval> | undefined;
  let longPoll: AbortController | null = null;

  function setCounts(counts: NotificationCounts) {
    unread.value = counts.unread_notifications;
    unreadHighPriority.value = counts.unread_high_priority_notifications;
  }

  function clear() {
    mode.value = 'off';
    unread.value = 0;
    unreadHighPriority.value = 0;
  }

  // Reads the counts and the channel position from the forum session. False when there is no usable session: none
  // (404), or one of another forum user than the signed in one (a shared browser). Other errors keep the counts.
  async function refresh(current: number): Promise<boolean> {
    lastRefresh = Date.now();
    let user: CurrentForumUser;
    try {
      user = await forum.getCurrentUser();
    } catch (error) {
      if (current === run && isAxiosError(error) && error.response?.status === 404) {
        stop();
      }
      return false;
    }
    if (current !== run) {
      return false;
    }
    if (user.username !== username) {
      stop();
      return false;
    }
    setCounts(user);
    channel = `/notification/${user.id}`;
    position = user.notification_channel_position ?? -1;
    return true;
  }

  function onMessages(messages: MessageBusMessage[]) {
    for (const message of messages) {
      if (message.channel === channel) {
        position = message.message_id;
        setCounts(message.data as NotificationCounts);
      } else if (message.channel === '/__status') {
        // the channel's current position, when the one sent was unknown to Discourse
        const status = message.data as Record<string, number>;
        if (channel in status) {
          position = status[channel];
        }
      }
    }
  }

  async function listen(current: number) {
    if (listening) {
      return;
    }
    listening = true;
    let failures = 0;
    while (current === run && mode.value === 'messagebus' && !document.hidden) {
      longPoll = new AbortController();
      try {
        onMessages(await forum.pollMessageBus(clientId, { [channel]: position }, true, longPoll.signal));
        failures = 0;
      } catch {
        if (current !== run || longPoll.signal.aborted) {
          break;
        }
        failures += 1;
        if (failures >= MAX_MESSAGE_BUS_FAILURES) {
          startPolling(current);
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, failures * MESSAGE_BUS_RETRY_DELAY));
      }
    }
    listening = false;
  }

  function startPolling(current: number) {
    mode.value = 'polling';
    clearInterval(pollTimer);
    pollTimer = setInterval(() => {
      if (!document.hidden) {
        refresh(current);
      }
    }, POLL_INTERVAL);
  }

  // back on the page: the counts may have changed meanwhile, and the long poll stopped while the page was hidden
  async function onBack() {
    if (document.hidden || mode.value === 'off') {
      return;
    }
    const current = run;
    if (Date.now() - lastRefresh >= REFRESH_THROTTLE && !(await refresh(current))) {
      return;
    }
    if (current === run && mode.value === 'messagebus') {
      listen(current);
    }
  }

  function onVisibilityChange() {
    if (document.hidden) {
      longPoll?.abort();
    } else {
      onBack();
    }
  }

  async function start(forumUsername: string) {
    stop();
    username = forumUsername;
    const current = run;
    if (!(await refresh(current))) {
      return;
    }

    // a short poll tells whether the forum lets the browser use MessageBus with its cookie
    try {
      onMessages(await forum.pollMessageBus(clientId, { [channel]: position }, false));
    } catch {
      if (current === run) {
        startPolling(current);
        addListeners();
      }
      return;
    }
    if (current !== run) {
      return;
    }
    mode.value = 'messagebus';
    addListeners();
    listen(current);
  }

  function addListeners() {
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onBack);
  }

  function stop() {
    run += 1;
    username = null;
    longPoll?.abort();
    clearInterval(pollTimer);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('focus', onBack);
    clear();
  }

  return { unread, unreadHighPriority, mode, start, stop };
});
