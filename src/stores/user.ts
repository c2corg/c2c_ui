// The user: their session (token, roles...) and their language, kept in the local storage of the browser
import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

import c2c from '@/js/apis/c2c';
import type { SessionRefusal } from '@/js/apis/c2c/session-refusal';
import trackingService from '@/js/apis/tracking-service';
import config from '@/js/config';
import { getPreferences } from '@/js/vue-plugins/local-storage';
import { useLanguageStore } from '@/stores/language';

const STORED_FIELDS = ['userName', 'id', 'lang', 'roles', 'name', 'forumUsername', 'token', 'expire'] as const;

type StoredUser = {
  userName: string | null;
  id: number | null;
  lang: string;
  roles: string[];
  name: string | null;
  forumUsername: string | null;
  token: string | null;
  expire: number | null;
};

// An expired session is forgotten: the API refuses its token (401), so it cannot even be logged out. The API closes the
// forum session of the users whose token expired.
function isExpired(expire: number | null): boolean {
  return !expire || Date.now() / 1000 > expire;
}

export const useUserStore = defineStore('user', () => {
  const language = useLanguageStore();

  // stored under the name of the former User component, so that existing sessions are kept
  const preferences = getPreferences('User');
  const data = preferences.get<Partial<StoredUser>>(config.urls.api, {});
  const expired = isExpired(data.expire ?? null);

  // The unique name, used to login
  const userName = ref(expired ? null : (data.userName ?? null));
  // unique numerical ID
  const id = ref(expired ? null : (data.id ?? null));
  // user lang, read write property everywhere : $user.lang
  // ($language.current is null only while the page updates after the first load)
  const lang = ref(data.lang ?? (language.current as string));
  // list of roles
  const roles = ref<string[]>(expired ? [] : (data.roles ?? []));
  // public name, a simple label
  const name = ref(expired ? null : (data.name ?? null));
  // forum name
  const forumUsername = ref(expired ? null : (data.forumUsername ?? null));
  // private token used for API auth
  const token = ref(expired ? null : (data.token ?? null));
  // token expiration date, in seconds
  const expire = ref(expired ? null : (data.expire ?? null));

  // why the API refused the session, until the next sign in: the navigation tells the user
  const sessionEnded = ref<SessionRefusal | null>(null);

  const isModerator = computed(() => roles.value.includes('moderator'));
  const isLogged = computed(() => Boolean(token.value));

  const stored = { userName, id, lang, roles, name, forumUsername, token, expire };

  // Another tab signed in or out: follow it, and read the storage again, so that what this tab stores next does not
  // bring back the former session
  function onStorage(event: StorageEvent) {
    if (event.storageArea !== window.localStorage || event.key !== preferences.key) {
      return;
    }
    preferences.reload();
    const other = preferences.get<Partial<StoredUser>>(config.urls.api, {});
    const otherExpired = isExpired(other.expire ?? null);
    token.value = otherExpired ? null : (other.token ?? null);
    expire.value = otherExpired ? null : (other.expire ?? null);
    roles.value = otherExpired ? [] : (other.roles ?? []);
    id.value = otherExpired ? null : (other.id ?? null);
    userName.value = otherExpired ? null : (other.userName ?? null);
    name.value = otherExpired ? null : (other.name ?? null);
    forumUsername.value = otherExpired ? null : (other.forumUsername ?? null);
    // the language of a session signed in there, as signIn() applies it: set first, so that no preference is sent
    if (!otherExpired && other.token && other.lang && other.lang !== lang.value) {
      lang.value = other.lang;
      language.setCurrent(other.lang);
    }
  }
  window.addEventListener('storage', onStorage);

  function commitToLocalStorage() {
    preferences.set(config.urls.api, Object.fromEntries(STORED_FIELDS.map((field) => [field, stored[field].value])));
  }

  // ApiData: the request, thenable; its then() returns the request itself, not the callback's promise
  function signIn(username: string, password: string, acceptTos: boolean, sso?: string, sig?: string) {
    return c2c.userProfile.login(username, password, acceptTos, sso, sig).then((response) => {
      const { data } = response;
      lang.value = data.lang;
      token.value = data.token;
      roles.value = data.roles;
      id.value = data.id;
      userName.value = data.username;
      name.value = data.name;
      forumUsername.value = data.forum_username;
      expire.value = data.expire;
      sessionEnded.value = null;

      language.setCurrent(lang.value);
      commitToLocalStorage();

      return response;
    });
  }

  function signout() {
    c2c.userProfile.logout();
    forget();
  }

  // forget the session here, and in the other tabs through the storage
  function forget() {
    token.value = null;
    roles.value = [];
    id.value = null;
    userName.value = null;
    name.value = null;
    forumUsername.value = null;
    expire.value = null;

    commitToLocalStorage();
  }

  function updateAccount(
    currentpassword: string,
    newName: string | null,
    forum_username: string | null,
    email: string | null,
    is_profile_public: boolean | null,
    newpassword: string | null
  ) {
    return c2c.userProfile.account
      .post(currentpassword, newName, forum_username, email, is_profile_public, newpassword)
      .then(() => {
        forumUsername.value = forum_username === null ? forumUsername.value : forum_username;
        name.value = newName === null ? name.value : newName;
        commitToLocalStorage();
      });
  }

  function saveLangPreference(newLang: string) {
    // keep in last, because it will fail in read only mode
    if (isLogged.value && newLang !== lang.value) {
      lang.value = newLang;
      commitToLocalStorage();
      c2c.userProfile.update_preferred_language(lang.value);
    }
  }

  // the API refused the token, or the account is blocked: the session is over, no logout to send
  c2c.onSessionRefused((reason) => {
    if (!isLogged.value) {
      return;
    }
    forget();
    sessionEnded.value = reason;
  });

  watch(
    token,
    (value) => {
      c2c.setAuthorizationToken(value);
      trackingService.setAuthorizationToken(value);
    },
    { immediate: true }
  );

  commitToLocalStorage();

  return {
    userName,
    id,
    lang,
    roles,
    name,
    forumUsername,
    token,
    expire,
    isModerator,
    isLogged,
    sessionEnded,
    signIn,
    signout,
    updateAccount,
    saveLangPreference,
  };
});

export type User = ReturnType<typeof useUserStore>;
