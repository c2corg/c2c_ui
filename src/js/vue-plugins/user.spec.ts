import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/js/apis/c2c', () => ({
  default: {
    setAuthorizationToken: vi.fn(),
    onSessionRefused: vi.fn(),
    userProfile: {
      login: vi.fn(),
      logout: vi.fn(),
      renew: vi.fn(),
      update_preferred_language: vi.fn(),
      account: { post: vi.fn(() => Promise.resolve()) },
    },
  },
}));
vi.mock('@/js/apis/tracking-service', () => ({ default: { setAuthorizationToken: vi.fn() } }));

const NOW = new Date('2026-10-19T12:00:00Z').getTime();
const IN_A_DAY = NOW / 1000 + 24 * 3600;

const loginResponse = {
  data: {
    lang: 'de',
    token: 'jwt-token',
    roles: ['moderator'],
    id: 42,
    username: 'alice',
    name: 'Alice',
    forum_username: 'alice_forum',
    expire: IN_A_DAY,
  },
};

// fresh modules for each test, as for each page load: the local-storage plugin caches what it read
const installUser = async () => {
  vi.resetModules();
  const { default: user } = await import('./user');
  const { default: c2c } = await import('@/js/apis/c2c');
  const { default: trackingService } = await import('@/js/apis/tracking-service');
  const { default: config } = await import('@/js/config');
  const { mount } = await import('@vue/test-utils');
  const { createApp, h, nextTick } = await import('vue');

  const { createPinia } = await import('pinia');
  const { useLanguageStore } = await import('@/stores/language');

  const app = createApp({});
  const globals = app.config.globalProperties;
  app.use(createPinia());
  // the language store, as main.ts installs it before $user: French, its change spied on
  const language = app.runWithContext(() => useLanguageStore());
  language.setCurrent = vi.fn();
  globals.$language = language;
  app.use(user);

  const stored = () => JSON.parse(window.localStorage.getItem('User.preferences') ?? '{}')[config.urls.api];
  return { app, $user: globals.$user, globals, c2c, trackingService, config, h, mount, nextTick, stored };
};

const storeSession = async (session: Record<string, unknown>) => {
  const { default: config } = await import('@/js/config');
  window.localStorage.setItem('User.preferences', JSON.stringify({ [config.urls.api]: session }));
};

const session = {
  userName: 'alice',
  id: 42,
  lang: 'it',
  roles: [],
  name: 'Alice',
  forumUsername: 'alice_forum',
  token: 'stored-token',
  expire: IN_A_DAY,
};

describe('$user', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('is logged out without a stored session, in the current language', async () => {
    const { $user, c2c, trackingService } = await installUser();

    expect($user.isLogged).toBe(false);
    expect($user.isModerator).toBe(false);
    expect($user.id).toBe(null);
    expect($user.lang).toBe('fr');
    expect(c2c.setAuthorizationToken).toHaveBeenCalledWith(null);
    expect(trackingService.setAuthorizationToken).toHaveBeenCalledWith(null);
  });

  it('restores a valid session, from the key existing users already have', async () => {
    await storeSession(session);
    const { $user, c2c, trackingService } = await installUser();

    expect($user.isLogged).toBe(true);
    expect($user).toMatchObject({ id: 42, userName: 'alice', name: 'Alice', lang: 'it', forumUsername: 'alice_forum' });
    expect(c2c.setAuthorizationToken).toHaveBeenCalledWith('stored-token');
    expect(trackingService.setAuthorizationToken).toHaveBeenCalledWith('stored-token');
  });

  it('logs out an expired session, and keeps its language', async () => {
    await storeSession({ ...session, expire: NOW / 1000 - 60 });
    const { $user, c2c, stored } = await installUser();

    expect($user.isLogged).toBe(false);
    expect($user.id).toBe(null);
    expect($user.lang).toBe('it');
    // the API refuses an expired token (401): it cannot be logged out
    expect(c2c.userProfile.logout).not.toHaveBeenCalled();
    expect(stored()).toMatchObject({ token: null, lang: 'it' });
  });

  it('signs in: stores the session, sets the language and the API token', async () => {
    const { $user, c2c, globals, stored } = await installUser();
    vi.mocked(c2c.userProfile.login).mockResolvedValue(loginResponse as never);

    const response = await $user.signIn('alice', 'secret', true);

    expect(response).toBe(loginResponse);
    expect(c2c.userProfile.login).toHaveBeenCalledWith('alice', 'secret', true, undefined, undefined, true);
    expect($user).toMatchObject({ isLogged: true, isModerator: true, id: 42, userName: 'alice', lang: 'de' });
    expect(globals.$language.setCurrent).toHaveBeenCalledWith('de');
    expect(stored()).toEqual({
      userName: 'alice',
      id: 42,
      lang: 'de',
      roles: ['moderator'],
      name: 'Alice',
      forumUsername: 'alice_forum',
      token: 'jwt-token',
      expire: IN_A_DAY,
      remember: true,
    });
    await Promise.resolve();
    expect(c2c.setAuthorizationToken).toHaveBeenLastCalledWith('jwt-token');
  });

  it('signs in without "remember me"', async () => {
    const { $user, c2c, stored } = await installUser();
    vi.mocked(c2c.userProfile.login).mockResolvedValue(loginResponse as never);

    await $user.signIn('alice', 'secret', true, undefined, undefined, false);

    expect(c2c.userProfile.login).toHaveBeenCalledWith('alice', 'secret', true, undefined, undefined, false);
    expect($user.remember).toBe(false);
    expect(stored().remember).toBe(false);
  });

  it('remembers a session stored before "remember me" was asked', async () => {
    await storeSession(session);
    const { $user } = await installUser();

    expect($user.remember).toBe(true);
  });

  it('signs out: clears the session but keeps the language', async () => {
    await storeSession(session);
    const { $user, c2c, stored } = await installUser();

    $user.signout();

    expect(c2c.userProfile.logout).toHaveBeenCalled();
    expect($user.isLogged).toBe(false);
    expect($user.id).toBe(null);
    expect(stored()).toEqual({
      userName: null,
      id: null,
      lang: 'it',
      roles: [],
      name: null,
      forumUsername: null,
      token: null,
      expire: null,
      remember: true,
    });
    await Promise.resolve();
    expect(c2c.setAuthorizationToken).toHaveBeenLastCalledWith(null);
  });

  it('updates the account names, keeping those not given', async () => {
    await storeSession(session);
    const { $user, stored } = await installUser();

    await $user.updateAccount('pwd', 'Alice B', null, 'a@b.c', true, null);

    expect($user.name).toBe('Alice B');
    expect($user.forumUsername).toBe('alice_forum');
    expect(stored()).toMatchObject({ name: 'Alice B', forumUsername: 'alice_forum' });
  });

  it('saves a new language preference, for a logged user only', async () => {
    const loggedOut = await installUser();
    loggedOut.$user.saveLangPreference('es');
    expect(loggedOut.c2c.userProfile.update_preferred_language).not.toHaveBeenCalled();

    await storeSession(session);
    const { $user, c2c, stored } = await installUser();
    $user.saveLangPreference('it');
    expect(c2c.userProfile.update_preferred_language).not.toHaveBeenCalled();

    $user.saveLangPreference('es');
    expect($user.lang).toBe('es');
    expect(stored().lang).toBe('es');
    expect(c2c.userProfile.update_preferred_language).toHaveBeenCalledWith('es');
  });

  it('accepts writes from components (AccountView sets forumUsername)', async () => {
    await storeSession(session);
    const { $user } = await installUser();

    $user.forumUsername = 'new_forum_name';

    expect($user.forumUsername).toBe('new_forum_name');
  });

  it('updates the components showing it', async () => {
    const { $user, c2c, h, mount, nextTick } = await installUser();
    vi.mocked(c2c.userProfile.login).mockResolvedValue(loginResponse as never);
    const wrapper = mount({
      render() {
        return h('p', $user.isLogged ? `hello ${$user.name}` : 'login');
      },
    });
    expect(wrapper.text()).toBe('login');

    await $user.signIn('alice', 'secret', true);
    await nextTick();
    expect(wrapper.text()).toBe('hello Alice');

    $user.signout();
    await nextTick();
    expect(wrapper.text()).toBe('login');
  });

  it('is the Pinia store of the user, for the components that use it', async () => {
    const { app, $user } = await installUser();
    const { useUserStore } = await import('@/stores/user');

    const store = app.runWithContext(() => useUserStore());
    $user.name = 'Alice';

    expect(store).toBe($user);
    expect(store.name).toBe('Alice');
  });

  describe('in another tab', () => {
    // the other tab stores the session, then the browser tells this tab
    const otherTab = async (other: Record<string, unknown>) => {
      const { default: config } = await import('@/js/config');
      const newValue = JSON.stringify({ [config.urls.api]: other });
      window.localStorage.setItem('User.preferences', newValue);
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'User.preferences', newValue, storageArea: window.localStorage })
      );
    };
    const signedOut = {
      ...session,
      userName: null,
      id: null,
      name: null,
      forumUsername: null,
      token: null,
      expire: null,
    };

    it('follows a sign out', async () => {
      await storeSession(session);
      const { $user, c2c, nextTick } = await installUser();

      await otherTab(signedOut);
      await nextTick();

      expect($user.isLogged).toBe(false);
      expect($user.userName).toBe(null);
      expect(c2c.setAuthorizationToken).toHaveBeenLastCalledWith(null);
    });

    it('keeps what the other tab stored when it stores the session', async () => {
      await storeSession(session);
      const { $user, c2c, config } = await installUser();
      vi.mocked(c2c.userProfile.login).mockResolvedValue(loginResponse as never);

      // the other tab stored the session of another API too
      const newValue = JSON.stringify({ [config.urls.api]: signedOut, 'https://other.api': { lang: 'en' } });
      window.localStorage.setItem('User.preferences', newValue);
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'User.preferences', newValue, storageArea: window.localStorage })
      );
      await $user.signIn('alice', 'secret', true);

      const all = JSON.parse(window.localStorage.getItem('User.preferences') ?? '{}');
      expect(all['https://other.api']).toEqual({ lang: 'en' });
    });

    it('follows a sign in', async () => {
      const { $user, c2c, nextTick } = await installUser();

      await otherTab({ ...session, token: 'other-token' });
      await nextTick();

      expect($user).toMatchObject({ isLogged: true, userName: 'alice', id: 42 });
      expect(c2c.setAuthorizationToken).toHaveBeenLastCalledWith('other-token');
    });

    it('follows the language of a sign in, without sending it back', async () => {
      const { $user, c2c, globals, stored } = await installUser();

      await otherTab({ ...session, lang: 'de', token: 'other-token' });

      expect($user.lang).toBe('de');
      expect(globals.$language.setCurrent).toHaveBeenCalledWith('de');
      expect(c2c.userProfile.update_preferred_language).not.toHaveBeenCalled();
      expect(stored().lang).toBe('de');
    });

    it('ignores an expired session', async () => {
      const { $user } = await installUser();

      await otherTab({ ...session, expire: NOW / 1000 - 60 });

      expect($user.isLogged).toBe(false);
    });

    it('ignores the other keys', async () => {
      await storeSession(session);
      const { $user } = await installUser();

      window.dispatchEvent(new StorageEvent('storage', { key: 'other', storageArea: window.localStorage }));

      expect($user.isLogged).toBe(true);
    });
  });

  describe('when the API refuses the session', () => {
    const refuse = (c2c: { onSessionRefused: unknown }, reason: string) => {
      const [callback] = vi.mocked(c2c.onSessionRefused as (cb: (reason: string) => void) => void).mock.lastCall!;
      callback(reason);
    };

    it.each(['invalid', 'blocked'])('forgets the session (%s), without a logout', async (reason) => {
      await storeSession(session);
      const { $user, c2c, stored } = await installUser();

      refuse(c2c, reason);

      expect($user.isLogged).toBe(false);
      expect($user.sessionEnded).toBe(reason);
      expect(c2c.userProfile.logout).not.toHaveBeenCalled();
      expect(stored()).toMatchObject({ token: null, lang: 'it' });
    });

    it('ignores it when signed out', async () => {
      const { $user, c2c } = await installUser();

      refuse(c2c, 'invalid');

      expect($user.sessionEnded).toBe(null);
    });

    it('forgets the reason at the next sign in', async () => {
      await storeSession(session);
      const { $user, c2c } = await installUser();
      vi.mocked(c2c.userProfile.login).mockResolvedValue(loginResponse as never);
      refuse(c2c, 'invalid');

      await $user.signIn('alice', 'secret', true);

      expect($user.sessionEnded).toBe(null);
    });
  });

  describe('renewal', () => {
    const IN_TEN_DAYS = NOW / 1000 + 10 * 24 * 3600;
    const IN_14_DAYS = NOW / 1000 + 14 * 24 * 3600;
    const renewed = { ...loginResponse.data, token: 'renewed-token', expire: IN_14_DAYS, name: 'Alice R.' };

    // the mocked API is the same object for every test: its renewal answers nothing until a test says otherwise
    beforeEach(async () => {
      const { default: c2c } = await import('@/js/apis/c2c');
      vi.mocked(c2c.userProfile.renew).mockReset();
    });

    const renewWith = async (c2c: { userProfile: { renew: unknown } }) => {
      vi.mocked(c2c.userProfile.renew as () => unknown).mockResolvedValue({ data: renewed });
    };

    it('renews a remembered session with less than 7 days left, at load', async () => {
      const { default: c2cMock } = await import('@/js/apis/c2c');
      await renewWith(c2cMock);
      await storeSession(session);
      const { $user, c2c, stored } = await installUser();
      await flushPromises();

      expect(c2c.userProfile.renew).toHaveBeenCalledTimes(1);
      expect($user).toMatchObject({ token: 'renewed-token', expire: IN_14_DAYS, name: 'Alice R.' });
      expect(stored()).toMatchObject({ token: 'renewed-token', expire: IN_14_DAYS });
      expect(c2c.setAuthorizationToken).toHaveBeenLastCalledWith('renewed-token');
    });

    it('does not renew a session with more than 7 days left', async () => {
      await storeSession({ ...session, expire: IN_TEN_DAYS });
      const { $user, c2c } = await installUser();

      await $user.renewIfNeeded();

      expect(c2c.userProfile.renew).not.toHaveBeenCalled();
    });

    it('does not renew a session not remembered', async () => {
      await storeSession({ ...session, remember: false });
      const { $user, c2c } = await installUser();

      await $user.renewIfNeeded();

      expect(c2c.userProfile.renew).not.toHaveBeenCalled();
    });

    it('takes the session another tab renewed meanwhile', async () => {
      await storeSession({ ...session, expire: IN_TEN_DAYS });
      const { $user, c2c } = await installUser();
      // this tab still has the former token, which expires soon; the other tab renewed it (no event received yet)
      $user.expire = IN_A_DAY;
      await storeSession({ ...session, token: 'other-tab-token', expire: IN_14_DAYS });

      await $user.renewIfNeeded();

      expect(c2c.userProfile.renew).not.toHaveBeenCalled();
      expect($user).toMatchObject({ token: 'other-tab-token', expire: IN_14_DAYS });
    });

    it('renews in one tab at a time', async () => {
      const request = vi.fn((_: string, callback: () => Promise<void>) => callback());
      vi.stubGlobal('navigator', { ...navigator, locks: { request } });
      try {
        await storeSession(session);
        const { $user, c2c } = await installUser();
        // the renewal started at load (its answer mocked as none)
        await flushPromises();
        request.mockClear();
        await renewWith(c2c);

        await $user.renewIfNeeded();

        expect(request).toHaveBeenCalledWith('c2c-session-renewal', expect.any(Function));
        expect($user.token).toBe('renewed-token');
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('keeps the session when the renewal fails', async () => {
      await storeSession(session);
      const { $user, c2c } = await installUser();
      await flushPromises();
      vi.mocked(c2c.userProfile.renew).mockRejectedValue(new Error('network'));

      await $user.renewIfNeeded();

      expect({ isLogged: $user.isLogged, token: $user.token, sessionEnded: $user.sessionEnded }).toEqual({
        isLogged: true,
        token: 'stored-token',
        sessionEnded: null,
      });
    });

    it('checks when the tab is shown again, and every hour', async () => {
      await storeSession({ ...session, expire: IN_TEN_DAYS });
      const { $user, c2c } = await installUser();
      await renewWith(c2c);
      const check = vi.spyOn($user, 'renewIfNeeded');

      document.dispatchEvent(new Event('visibilitychange'));
      expect(check).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(3600 * 1000);
      expect(check).toHaveBeenCalledTimes(2);
    });
  });
});
