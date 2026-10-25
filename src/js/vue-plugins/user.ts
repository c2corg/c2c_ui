import { type App, reactive, watch } from 'vue';

import { getPreferences } from './local-storage';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import trackingService from '@/js/apis/tracking-service';
import config from '@/js/config';

const STORED_FIELDS = ['userName', 'id', 'lang', 'roles', 'name', 'forumUsername', 'token', 'expire'] as const;

export type User = {
  // The unique name, used to login
  userName: string | null;
  // unique numerical ID
  id: number | null;
  lang: string;
  roles: string[];
  // public name, a simple label
  name: string | null;
  forumUsername: string | null;
  // private token used for API auth
  token: string | null;
  // token expiration date, in seconds
  expire: number | null;
  readonly isModerator: boolean;
  readonly isLogged: boolean;
  // ApiData: the request, thenable; its then() returns the request itself, not the callback's promise
  signIn(username: string, password: string, acceptTos: boolean, sso?: string, sig?: string): ApiData;
  signout(): void;
  updateAccount(
    currentpassword: string,
    name: string | null,
    forum_username: string | null,
    email: string | null,
    is_profile_public: boolean | null,
    newpassword: string | null
  ): ApiData;
  saveLangPreference(lang: string): void;
};

declare module 'vue' {
  interface ComponentCustomProperties {
    $user: User;
  }
}

const languageOf = (app: App) => app.config.globalProperties.$language;

function isExpired(expire: number | null, token: string | null): boolean {
  if (!expire) {
    return true;
  }

  const now = Date.now() / 1000; // in seconds

  if (now > expire) {
    c2c.userProfile.expiredTokenLogout(token ?? '');
    return true;
  }

  return false;
}

export default function install(app: App) {
  // stored under the name of the former User component, so that existing sessions are kept
  const preferences = getPreferences('User');
  const data = preferences.get<Partial<Pick<User, (typeof STORED_FIELDS)[number]>>>(config.urls.api, {});

  // user lang, read write property everywhere : this.$user.lang
  // ($language.current is null only while the page updates after the first load)
  const lang = data['lang'] ?? (languageOf(app).current as string);
  const expired = isExpired(data['expire'] ?? null, data['token'] ?? null);

  const user: User = reactive<User>({
    // The unique name, used to login
    userName: expired ? null : (data['userName'] ?? null),
    // unique numerical ID
    id: expired ? null : (data['id'] ?? null),
    lang,
    // list of roles
    roles: expired ? [] : (data['roles'] ?? []),
    // public name, a simple label
    name: expired ? null : (data['name'] ?? null),
    // forum name
    forumUsername: expired ? null : (data['forumUsername'] ?? null),
    // private token used for API auth
    token: expired ? null : (data['token'] ?? null),
    // token expiration date
    expire: expired ? null : (data['expire'] ?? null),

    get isModerator() {
      return this.roles.includes('moderator');
    },

    get isLogged() {
      return Boolean(this.token);
    },

    signIn(username, password, acceptTos, sso, sig) {
      return c2c.userProfile.login(username, password, acceptTos, sso, sig).then((response) => {
        const { data } = response;
        this.lang = data.lang;
        this.token = data.token;
        this.roles = data.roles;
        this.id = data.id;
        this.userName = data.username;
        this.name = data.name;
        this.forumUsername = data.forum_username;
        this.expire = data.expire;

        languageOf(app).setCurrent(this.lang);
        commitToLocalStorage();

        return response;
      });
    },

    signout() {
      c2c.userProfile.logout();

      this.token = null;
      this.roles = [];
      this.id = null;
      this.userName = null;
      this.name = null;
      this.forumUsername = null;
      this.expire = null;

      commitToLocalStorage();
    },

    updateAccount(currentpassword, name, forum_username, email, is_profile_public, newpassword) {
      return c2c.userProfile.account
        .post(currentpassword, name, forum_username, email, is_profile_public, newpassword)
        .then(() => {
          this.forumUsername = forum_username === null ? this.forumUsername : forum_username;
          this.name = name === null ? this.name : name;
          commitToLocalStorage();
        });
    },

    saveLangPreference(lang) {
      // keep in last, because it will fail in read only mode
      if (this.isLogged && lang !== this.lang) {
        this.lang = lang;
        commitToLocalStorage();
        c2c.userProfile.update_preferred_language(this.lang);
      }
    },
  });

  function commitToLocalStorage() {
    preferences.set(config.urls.api, Object.fromEntries(STORED_FIELDS.map((field) => [field, user[field]])));
  }

  watch(
    () => user.token,
    (token) => {
      c2c.setAuthorizationToken(token);
      trackingService.setAuthorizationToken(token);
    },
    { immediate: true }
  );

  commitToLocalStorage();

  app.config.globalProperties.$user = user;
}
