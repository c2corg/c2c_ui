import c2c from '@/js/apis/c2c';
import trackingService from '@/js/apis/tracking-service';
import config from '@/js/config';

export default function install(Vue) {
  Vue.prototype.$user = new Vue({
    name: 'User',

    data() {
      const data = this.$localStorage.get(config.urls.api, {});

      return {
        // The unique name, used to login
        userName: data['userName'] ?? null,

        // unique numerical ID
        id: data['id'] ?? null,

        // user lang, read write property everywhere : this.$user.lang
        lang: data['lang'] ?? this.$language.current,

        // list of roles
        roles: data['roles'] ?? [],

        // public name, a simple label
        name: data['name'] ?? null,

        // forum name
        forumUsername: data['forumUsername'] ?? null,

        // private token used for API auth
        token: data['token'] ?? null,

        // token expiration date
        expire: data['expire'] ?? null,
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
      this.checkExpiration();
    },

    methods: {
      signIn(username, password, acceptTos) {
        return c2c.userProfile.login(username, password, acceptTos).then((response) => {
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

      signout() {
        c2c.userProfile.logout();

        this.token = null;
        this.roles = [];
        this.id = null;
        this.userName = null;
        this.name = null;
        this.forumUsername = null;
        this.expire = null;

        this.commitToLocaleStorage_();
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

      checkExpiration() {
        if (!this.expire) {
          return true;
        }

        const now = Date.now() / 1000; // in seconds
        const expire = this.expire;

        if (now > expire) {
          this.signout();
          return true;
        }

        return false;
      },
    },
  });
}
