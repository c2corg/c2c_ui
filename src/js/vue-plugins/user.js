import { computed, reactive, watch } from 'vue';

import c2c from '@/js/apis/c2c';
import trackingService from '@/js/apis/tracking-service';
import config from '@/js/config';
import { getNamedLocalStorageItem } from '@/js/vue-plugins/local-storage';

export default function install(app) {
  // cross-plugin globals are looked up lazily (not captured at install time),
  // because plugin install order matters (this plugin is installed after gettext-plugin).
  const globals = app.config.globalProperties;
  const storage = getNamedLocalStorageItem('User');

  const checkExpiration = function (expire, token) {
    if (!expire) {
      return true;
    }

    const now = Date.now() / 1000; // in seconds

    if (now > expire) {
      user.expiredTokenLogout(token);
      return true;
    }

    return false;
  };

  const storedData = storage.get(config.urls.api, {});

  // token expiration date
  const expire = storedData['expire'] ?? null;
  // The unique name, used to login
  const userName = storedData['userName'] ?? null;
  // unique numerical ID
  const id = storedData['id'] ?? null;
  // user lang, read write property everywhere : this.$user.lang
  const lang = storedData['lang'] ?? globals.$language.current;
  // list of roles
  const roles = storedData['roles'] ?? [];
  // public name, a simple label
  const name = storedData['name'] ?? null;
  // forum name
  const forumUsername = storedData['forumUsername'] ?? null;
  // private token used for API auth
  const token = storedData['token'] ?? null;

  const expired = checkExpiration(expire, token);

  const user = reactive(
    expired
      ? {
          userName: null,
          id: null,
          lang,
          roles: [],
          name: null,
          forumUsername: null,
          token: null,
          expire: null,
        }
      : {
          userName,
          id,
          lang,
          roles,
          name,
          forumUsername,
          token,
          expire,
        }
  );

  user.isModerator = computed(() => user.roles.includes('moderator'));
  user.isLogged = computed(() => Boolean(user.token));

  user.commitToLocaleStorage_ = function () {
    storage.set(config.urls.api, {
      userName: user.userName,
      id: user.id,
      lang: user.lang,
      roles: user.roles,
      name: user.name,
      forumUsername: user.forumUsername,
      token: user.token,
      expire: user.expire,
    });
  };

  user.updateToken = function () {
    c2c.setAuthorizationToken(user.token);
    trackingService.setAuthorizationToken(user.token);
  };

  user.signIn = function (username, password, acceptTos) {
    return c2c.userProfile.login(username, password, acceptTos).then((response) => {
      user.lang = response.data.lang;
      user.token = response.data.token;
      user.roles = response.data.roles;
      user.id = response.data.id;
      user.userName = response.data.username;
      user.name = response.data.name;
      user.forumUsername = response.data.forum_username;
      user.expire = response.data.expire;

      globals.$language.setCurrent(user.lang);
      user.commitToLocaleStorage_();
    });
  };

  user.expiredTokenLogout = function (token) {
    c2c.userProfile.expiredTokenLogout(token);
  };

  user.signout = function () {
    c2c.userProfile.logout();

    user.token = null;
    user.roles = [];
    user.id = null;
    user.userName = null;
    user.name = null;
    user.forumUsername = null;
    user.expire = null;

    user.commitToLocaleStorage_();
  };

  user.updateAccount = function (currentpassword, name, forum_username, email, is_profile_public, newpassword) {
    return c2c.userProfile.account
      .post(currentpassword, name, forum_username, email, is_profile_public, newpassword)
      .then(() => {
        user.forumUsername = forum_username === null ? user.forumUsername : forum_username;
        user.name = name === null ? user.name : name;
        user.commitToLocaleStorage_();
      });
  };

  user.saveLangPreference = function (lang) {
    // keep in last, because it will fail in read only mode
    if (user.isLogged && lang !== user.lang) {
      user.lang = lang;
      user.commitToLocaleStorage_();
      c2c.userProfile.update_preferred_language(user.lang);
    }
  };

  watch(
    () => user.token,
    () => user.updateToken(),
    { immediate: true }
  );

  // init (former created() hook)
  user.commitToLocaleStorage_();

  app.config.globalProperties.$user = user;
}
