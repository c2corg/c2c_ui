import c2c from '@/js/apis/c2c';
import trackingService from '@/js/apis/tracking-service';
import config from '@/js/config';

export default function install(Vue) {
  Vue.prototype.$user = new Vue({
    name: 'User',

    data() {
      const data = this.$localStorage.get(config.urls.api, {});

      // token expiration date
      const expire = data['expire'] ?? null;
      // The unique name, used to login
      const userName = data['userName'] ?? null;
      // unique numerical ID
      const id = data['id'] ?? null;
      // user lang, read write property everywhere : this.$user.lang
      const lang = data['lang'] ?? this.$language.current;
      // list of roles
      const roles = data['roles'] ?? [];
      // public name, a simple label
      const name = data['name'] ?? null;
      // forum name
      const forumUsername = data['forumUsername'] ?? null;
      // private token used for API auth
      const token = data['token'] ?? null;

      const expired = this.checkExpiration(expire, token);

      return expired
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
          };
    },

    computed: {
      isModerator() {
        return this.roles.includes('moderator');
      },
      isLogged() {
        return Boolean(this.token);
      },
    },

    watch: {
      token: {
        handler: 'updateToken',
        immediate: true,
      },
    },

    created() {
      this.commitToLocaleStorage_();
    },

    methods: {
      signIn(username, password) {
        return c2c.userProfile.login(username, password).then((response) => {
          this.lang = response.data.lang;
          this.token = response.data.token;
          this.roles = response.data.roles;
          this.id = response.data.id;
          this.userName = response.data.username;
          this.name = response.data.name;
          this.forumUsername = response.data.forum_username;
          this.expire = response.data.expire;

          this.$language.setCurrent(this.lang);
          this.commitToLocaleStorage_();
        });
      },

      signout(token) {
        // we have an expired token in local storage, so we don't want to use that token
        // for the API calls (we would go into https://github.com/c2corg/v6_api/issues/730 instead
        // of doing unauthentified requests).
        // We still want to make the logout call which needs a (potentially expired) token
        c2c.userProfile.logout(token);
      },

      updateAccount(currentpassword, name, forum_username, email, is_profile_public, newpassword) {
        return c2c.userProfile.account
          .post(currentpassword, name, forum_username, email, is_profile_public, newpassword)
          .then(() => {
            this.forumUsername = forum_username === null ? this.forumUsername : forum_username;
            this.name = name === null ? this.name : name;
            this.commitToLocaleStorage_();
          });
      },

      updateToken() {
        c2c.setAuthorizationToken(this.token);
        trackingService.setAuthorizationToken(this.token);
      },

      saveLangPreference(lang) {
        // keep in last, because it will fail in read only mode
        if (this.isLogged && lang !== this.lang) {
          this.lang = lang;
          this.commitToLocaleStorage_();
          c2c.userProfile.update_preferred_language(this.lang);
        }
      },

      commitToLocaleStorage_() {
        this.$localStorage.set(config.urls.api, this.$data);
      },

      checkExpiration(expire, token) {
        if (!expire) {
          return true;
        }

        const now = Date.now() / 1000; // in seconds

        if (now > expire) {
          this.signout(token);
          return true;
        }

        return false;
      },
    },
  });
}
