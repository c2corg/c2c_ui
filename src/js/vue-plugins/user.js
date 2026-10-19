import { reactive, watch } from 'vue';

import { getPreferences } from './local-storage';

import c2c from '@/js/apis/c2c';
import trackingService from '@/js/apis/tracking-service';
import config from '@/js/config';

const STORED_FIELDS = ['userName', 'id', 'lang', 'roles', 'name', 'forumUsername', 'token', 'expire'];

function isExpired(expire, token) {
  if (!expire) {
    return true;
  }

  const now = Date.now() / 1000; // in seconds

  if (now > expire) {
    c2c.userProfile.expiredTokenLogout(token);
    return true;
  }

  return false;
}

export default function install(Vue) {
  // stored under the name of the former User component, so that existing sessions are kept
  const preferences = getPreferences('User');
  const data = preferences.get(config.urls.api, {});

  // user lang, read write property everywhere : this.$user.lang
  const lang = data['lang'] ?? Vue.prototype.$language.current;
  const expired = isExpired(data['expire'] ?? null, data['token'] ?? null);

  const user = reactive({
    // The unique name, used to login
    userName: expired ? null : data['userName'] ?? null,
    // unique numerical ID
    id: expired ? null : data['id'] ?? null,
    lang,
    // list of roles
    roles: expired ? [] : data['roles'] ?? [],
    // public name, a simple label
    name: expired ? null : data['name'] ?? null,
    // forum name
    forumUsername: expired ? null : data['forumUsername'] ?? null,
    // private token used for API auth
    token: expired ? null : data['token'] ?? null,
    // token expiration date
    expire: expired ? null : data['expire'] ?? null,

    get isModerator() {
      return this.roles.includes('moderator');
    },

    get isLogged() {
      return Boolean(this.token);
    },

    signIn(username, password, acceptTos, sso, sig) {
      return c2c.userProfile.login(username, password, acceptTos, sso, sig).then((response) => {
        this.lang = response.data.lang;
        this.token = response.data.token;
        this.roles = response.data.roles;
        this.id = response.data.id;
        this.userName = response.data.username;
        this.name = response.data.name;
        this.forumUsername = response.data.forum_username;
        this.expire = response.data.expire;

        Vue.prototype.$language.setCurrent(this.lang);
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

  Vue.prototype.$user = user;
}
