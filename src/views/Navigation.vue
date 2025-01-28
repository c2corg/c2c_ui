<template>
  <nav
    class="is-size-5"
    :class="{
      'has-background-warning': siteConfiguration.urls.name != 'prod',
      'with-ad': !homePage() && !$screen.isMobile && !$screen.isTablet && !$screen.isDesktop,
    }"
  >
    <span
      v-if="$screen.isMobile || $screen.isTablet"
      class="navigation-item"
      :class="{ 'is-hidden-mobile': !hideSearchInput }"
      @click="$emit('toggle-side-menu')"
    >
      <span class="button">
        <fa-icon icon="bars" />
      </span>
    </span>

    <a
      v-if="$screen.isMobile || $screen.isTablet"
      :href="'/'"
      class="navigation-item navigation-brand has-text-centered"
      :class="{ 'is-hidden-mobile': !hideSearchInput }"
    >
      <img src="@/assets/img/logo.svg" alt="Camptocamp.org" />
    </a>

    <dfm-ad-large v-if="!homePage() && !$screen.isMobile && !$screen.isTablet && !$screen.isDesktop" />

    <div class="navigation-end">
      <router-link
        :to="{ name: 'article', params: { id: 106732 } }"
        class="navigation-item has-text-centered"
        :class="{ 'is-hidden-mobile': !hideSearchInput }"
      >
        <icon-help fixed-width />
        <span class="is-hidden-mobile"> {{ $gettext('help') | uppercaseFirstLetter }} </span>
      </router-link>
      <div ref="searchInputContainer">
        <input-document
          ref="searchInput"
          class="navigation-item search-input"
          :class="{ 'is-hidden-mobile': hideSearchInput }"
          :document-type="['waypoint', 'route', 'article', 'book']"
          propose-creation
          show-more-results-link
          clear-input-on-toggle
          @input="go"
        />

        <div class="navigation-item is-hidden-tablet" :class="{ 'is-hidden-mobile': !hideSearchInput }">
          <span class="button" @click="showSearchInput">
            <fa-icon icon="search" />
          </span>
        </div>
      </div>

      <div
        v-if="siteConfiguration.isBackendSelectable"
        class="navigation-item is-hidden-mobile"
        :title="'This page may contains bugs or incomplete features'"
      >
        <fa-icon icon="bug" size="lg" class="has-text-danger" />
      </div>

      <div v-if="siteConfiguration.isBackendSelectable" class="navigation-item dropdown is-hoverable is-hidden-mobile">
        <div class="dropdown-trigger">
          <fa-icon icon="database" />
        </div>
        <div class="dropdown-menu">
          <div class="dropdown-content">
            <a
              v-for="(urlsConfiguration, i) of Object.values(siteConfiguration.urlsConfigurations)"
              :key="i"
              class="dropdown-item is-size-5"
              :class="{ 'is-active': urlsConfiguration.name === siteConfiguration.urls.name }"
              @click="setUrlsConfiguration(urlsConfiguration.name)"
            >
              <span>{{ urlsConfiguration.name }}</span>
            </a>
          </div>
        </div>
      </div>

      <div class="navigation-item">
        <join-us-link class="has-text-centered button c2c-color" :class="{ 'is-hidden-mobile': !hideSearchInput }">
          <icon-join-us fixed-width />
          <span class="is-hidden-mobile">{{ $gettext('Join us') | uppercaseFirstLetter }}</span>
        </join-us-link>
      </div>

      <div class="navigation-item">
        <dropdown-button class="is-right add-button" ref="addDocumentMenu">
          <span slot="button" class="button is-success">
            <fa-icon icon="plus" />
          </span>
          <add-link
            v-for="documentType of ['outing', 'route', 'waypoint', 'article', 'book', 'xreport']"
            :key="documentType"
            :document-type="documentType"
            class="dropdown-item is-size-5 is-ellipsed"
            @click.native="$refs.addDocumentMenu.isActive = false"
          >
            <icon-document :document-type="documentType" fixed-width />
            <span>
              {{ $documentUtils.getCreationTitle(documentType) | uppercaseFirstLetter }}
            </span>
          </add-link>
        </dropdown-button>
      </div>

      <div v-if="!$user.isLogged" class="navigation-item">
        <login-button class="is-link">
          <span class="is-hidden-touch" v-translate>Login</span>
          &nbsp;
          <fa-icon icon="sign-in-alt" />
        </login-button>
      </div>

      <div v-else class="navigation-item">
        <dropdown-button class="is-right" ref="userMenu">
          <span slot="button" class="button">
            <img
              width="24"
              height="24"
              alt="Avatar"
              :src="$options.forumUrl + '/user_avatar/forum.camptocamp.org/' + $user.forumUsername + '/24/1_1.png'"
            />
            <span class="has-text-weight-bold is-hidden-mobile"> &nbsp;{{ $user.name }} </span>
          </span>

          <router-link
            v-for="item of userMenuLinks"
            :key="item.text"
            :to="item.to"
            class="dropdown-item is-size-5"
            @click.native="$refs.userMenu.isActive = false"
          >
            <component :is="item.iconComponent || 'fa-icon'" :icon="item.icon" fixed-width />
            <span>
              {{ item.text }}
            </span>
          </router-link>

          <hr class="dropdown-divider" />

          <a class="dropdown-item is-size-5" @click="signout()">
            <fa-icon icon="sign-out-alt" />
            <span>&nbsp;</span>
            <span v-translate>Logout</span>
          </a>
        </dropdown-button>
      </div>
      <div v-if="!$user.isLogged" class="navigation-item">
        <dropdown-button class="is-right">
          <button class="button" slot="button">
            {{ $language.current }}
          </button>
          <a
            v-for="(language, key) in $language.availableUI"
            :key="key"
            class="dropdown-item is-size-5"
            :class="{ 'is-active': key == $language.current }"
            @click="$language.setCurrent(key)"
          >
            {{ language }}
          </a>
        </dropdown-button>
      </div>
    </div>
  </nav>
</template>

<script>
import DfmAdLarge from './DfmAdLarge.vue';

import IconHelp from '@/components/generics/icons/IconHelp';
import IconJoinUs from '@/components/generics/icons/IconJoinUs';
import JoinUsLink from '@/components/generics/links/JoinUsLink.vue';
import config from '@/js/config';

export default {
  components: {
    DfmAdLarge,
    IconHelp,
    IconJoinUs,
    JoinUsLink,
  },
  data() {
    return {
      searchText: '',
      hideSearchInput: true, // only on small screen,
    };
  },

  computed: {
    siteConfiguration() {
      return config;
    },

    userMenuLinks() {
      const items = [
        {
          to: { name: 'profile', params: { id: this.$user.id } },
          text: this.$gettext('My profile'),
          icon: 'user',
        },
        {
          to: { name: 'account' },
          text: this.$gettext('My account'),
          icon: 'check-circle',
        },
        {
          to: { name: 'preferences' },
          text: this.$gettext('My preferences'),
          icon: 'gears',
        },
        {
          to: { name: 'trackers' },
          text: this.$gettext('Activity trackers'),
          icon: 'location-crosshairs',
        },
        {
          to: { name: 'outings', query: { u: this.$user.id } },
          text: this.$gettext('My outings'),
          iconComponent: 'icon-outing',
        },
        {
          to: { name: 'outings-stats', query: { u: this.$user.id } },
          text: this.$gettext('My statistics'),
          icon: 'chart-bar',
        },
        {
          to: { name: 'whatsnew', query: { u: this.$user.id } },
          text: this.$gettext('My changes'),
          icon: 'edit',
        },
        {
          to: { name: 'following' },
          text: this.$gettext('My followed users'),
          icon: 'heart',
        },
        {
          to: { name: 'routes', query: { u: this.$user.id } },
          text: this.$gettext('My bookmarks'),
          icon: 'star',
        },
      ];
      return items;
    },
  },

  forumUrl: config.urls.forum,

  created() {
    window.addEventListener('click', this.onClick);
  },

  beforeDestroy() {
    window.removeEventListener('click', this.onClick);
  },

  // do need to destroy event listener as Navigation component will always exists

  methods: {
    go(document) {
      this.$router.push({
        name: this.$documentUtils.getDocumentType(document.type),
        params: { id: document.document_id },
      });
    },

    setUrlsConfiguration(name) {
      config.setUrlsName(name);
      this.$router.go();
    },

    onClick(event) {
      if (!this.$refs.searchInputContainer.contains(event.target)) {
        this.hideSearchInput = true;
      }
    },

    showSearchInput() {
      this.hideSearchInput = false;

      // after DOM update, input will be visible, and focusable
      this.$nextTick(() => {
        this.$refs.searchInput.focus();
      });
    },

    signout() {
      this.$user.signout();
      if (this.$route.meta.requiresAuth) {
        this.$router.push({ name: 'home' });
      }
    },

    homePage() {
      if (this.$route.path === '/home' || this.$route.path === '/') {
        return true;
      } else {
        return false;
      }
    },
  },
};
</script>

<style scoped lang="scss">
nav {
  max-width: 100vw;
  height: $navbar-height;
  background-color: $white;
  box-shadow: 0 2px 0 $color-base-c2c;
  display: flex;
}

.navigation-brand {
  padding: 4px 5px !important;
  img {
    height: calc(#{$navbar-height} - 8px);
  }
}

.navigation-end {
  justify-content: flex-end;
  margin-left: auto;
  display: flex;
}

.navigation-item {
  display: flex;
  align-items: center;
  line-height: 1.5;
}

.c2c-color {
  background-color: $color-base-c2c;
}

.with-ad {
  height: $navbarad-height;
  margin-left: 200px;

  .navigation-end {
    flex-shrink: 1;
    margin-right: 1rem;
    flex-wrap: wrap-reverse;
    align-content: center;
  }

  .navigation-item {
    padding: 0.25rem 0.25rem;
  }
}

@media screen and (max-width: $tablet) {
  .navigation-brand {
    img {
      margin-left: 0px;
      // height:31px;
    }
  }

  .navigation-item {
    padding: 0.5rem 0.1rem;
  }

  .navigation-end {
    margin-right: 5px;
  }

  .search-input {
    width: 160px;
  }
}

@media screen and (min-width: $tablet) and (max-width: $desktop) {
  .navigation-brand {
    img {
      margin-left: 5px;
    }
  }

  .navigation-item {
    padding: 0.5rem 0.2rem;
  }

  .navigation-end {
    margin-right: 5px;
  }

  .search-input {
    width: 160px;
  }
}

@media screen and (min-width: $desktop) and (max-width: $widescreen) {
  .navigation-brand {
    img {
      margin-left: 20px;
    }
  }

  .navigation-item {
    padding: 0.5rem 0.75rem;
  }

  .navigation-end {
    margin-right: 1rem;
  }

  .search-input {
    width: 160px;
  }
}

@media screen and (min-width: $widescreen) and (max-width: $fullhd) {
  .navigation-brand {
    img {
      margin-left: 20px;
    }
  }

  .navigation-item {
    padding: 0.5rem 0.75rem;
  }

  .navigation-end {
    margin-right: 1rem;
  }
}

@media screen and (min-width: $fullhd) {
  .navigation-brand {
    img {
      margin-left: 20px;
    }
  }

  .navigation-item {
    padding: 0.5rem 0.75rem;
  }

  .navigation-end {
    margin-right: 1rem;
  }
}

// search input : increase size to right on hover
// only on screen wider than desktop
@media screen and (min-width: $fullhd) {
  .search-input {
    width: 250px;
    margin-right: 50px;
    transition: width 0.5s ease, margin-right 0.5s ease;
  }

  .search-input:hover {
    width: 300px;
    margin-right: 0;
  }
}
</style>

<style lang="scss">
.c2c-color > a {
  color: $color-text;
}

@media screen and (max-width: $tablet) {
  .add-button .dropdown-content {
    position: fixed;
    right: 0;
    max-width: 100%;
  }
}
</style>
