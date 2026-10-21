import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/js/apis/c2c', () => ({
  default: {
    setAuthorizationToken: vi.fn(),
    userProfile: {
      login: vi.fn(),
      logout: vi.fn(),
      expiredTokenLogout: vi.fn(),
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
  const { createLocalVue, mount } = await import('@vue/test-utils');
  const { nextTick } = await import('vue');

  const localVue = createLocalVue();
  // $language is installed before $user by main.js
  localVue.prototype.$language = { current: 'fr', setCurrent: vi.fn() };
  localVue.use(user);

  const stored = () => JSON.parse(window.localStorage.getItem('User.preferences') ?? '{}')[config.urls.api];
  return { $user: localVue.prototype.$user, localVue, c2c, trackingService, config, mount, nextTick, stored };
};

const storeSession = async (session) => {
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
    expect(c2c.userProfile.expiredTokenLogout).toHaveBeenCalledWith('stored-token');
    expect(stored()).toMatchObject({ token: null, lang: 'it' });
  });

  it('signs in: stores the session, sets the language and the API token', async () => {
    const { $user, c2c, localVue, stored } = await installUser();
    c2c.userProfile.login.mockResolvedValue(loginResponse);

    const response = await $user.signIn('alice', 'secret', true);

    expect(response).toBe(loginResponse);
    expect(c2c.userProfile.login).toHaveBeenCalledWith('alice', 'secret', true, undefined, undefined);
    expect($user).toMatchObject({ isLogged: true, isModerator: true, id: 42, userName: 'alice', lang: 'de' });
    expect(localVue.prototype.$language.setCurrent).toHaveBeenCalledWith('de');
    expect(stored()).toEqual({
      userName: 'alice',
      id: 42,
      lang: 'de',
      roles: ['moderator'],
      name: 'Alice',
      forumUsername: 'alice_forum',
      token: 'jwt-token',
      expire: IN_A_DAY,
    });
    await Promise.resolve();
    expect(c2c.setAuthorizationToken).toHaveBeenLastCalledWith('jwt-token');
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
    const { $user, c2c, localVue, mount, nextTick } = await installUser();
    c2c.userProfile.login.mockResolvedValue(loginResponse);
    const wrapper = mount({ render: (h) => h('p', $user.isLogged ? `hello ${$user.name}` : 'login') }, { localVue });
    expect(wrapper.text()).toBe('login');

    await $user.signIn('alice', 'secret', true);
    await nextTick();
    expect(wrapper.text()).toBe('hello Alice');

    $user.signout();
    await nextTick();
    expect(wrapper.text()).toBe('login');
  });
});
