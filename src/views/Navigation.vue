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
        <span class="is-hidden-mobile"> {{ $filters.uppercaseFirstLetter($gettext('help')) }} </span>
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
          @update:model-value="go"
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
          <span class="is-hidden-mobile">{{ $filters.uppercaseFirstLetter($gettext('Join us')) }}</span>
        </join-us-link>
      </div>

      <div class="navigation-item">
        <dropdown-button class="is-right add-button" ref="addDocumentMenu">
          <template #button>
            <span class="button is-success">
              <fa-icon icon="plus" />
            </span>
          </template>
          <add-link
            v-for="documentType of ['outing', 'route', 'waypoint', 'article', 'book', 'xreport']"
            :key="documentType"
            :document-type="documentType"
            class="dropdown-item is-size-5 is-ellipsed"
            @click="addDocumentMenu!.isActive = false"
          >
            <icon-document :document-type="documentType" fixed-width />
            <span>
              {{ $filters.uppercaseFirstLetter($documentUtils.getCreationTitle(documentType)) }}
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
          <template #button>
            <span class="button">
              <img
                width="24"
                height="24"
                alt="Avatar"
                :src="forumUrl + '/user_avatar/forum.camptocamp.org/' + $user.forumUsername + '/24/1_1.png'"
              />
              <span class="has-text-weight-bold is-hidden-mobile"> &nbsp;{{ $user.name }} </span>
            </span>
          </template>

          <router-link
            v-for="item of userMenuLinks"
            :key="item.text"
            :to="item.to"
            class="dropdown-item is-size-5"
            @click="userMenu!.isActive = false"
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
          <template #button>
            <button class="button">
              {{ $language.current }}
            </button>
          </template>
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

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef } from 'vue';
import { isNavigationFailure, useRoute, useRouter } from 'vue-router';

import DfmAdLarge from './DfmAdLarge.vue';

import IconHelp from '@/components/generics/icons/IconHelp.vue';
import IconJoinUs from '@/components/generics/icons/IconJoinUs.vue';
import JoinUsLink from '@/components/generics/links/JoinUsLink.vue';
import { useGlobalProperties } from '@/js/composables/global-properties';
import config from '@/js/config';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

defineEmits(['toggle-side-menu']);

const route = useRoute();
const router = useRouter();
const { $gettext, $user, $documentUtils } = useGlobalProperties();

const forumUrl = config.urls.forum;
const siteConfiguration = config;

const searchInputContainer = useTemplateRef<HTMLDivElement>('searchInputContainer');
const searchInput = useTemplateRef<{ focus(): void }>('searchInput');
const addDocumentMenu = useTemplateRef<{ isActive: boolean }>('addDocumentMenu');
const userMenu = useTemplateRef<{ isActive: boolean }>('userMenu');

const hideSearchInput = ref(true); // only on small screen

const userMenuLinks = computed(() => [
  {
    to: { name: 'profile', params: { id: $user.id } },
    text: $gettext('My profile'),
    icon: 'user',
  },
  {
    to: { name: 'account' },
    text: $gettext('My account'),
    icon: 'check-circle',
  },
  {
    to: { name: 'preferences' },
    text: $gettext('My preferences'),
    icon: 'gears',
  },
  {
    to: { name: 'trackers' },
    text: $gettext('Activity trackers'),
    icon: 'location-crosshairs',
  },
  {
    to: { name: 'outings', query: { u: $user.id } },
    text: $gettext('My outings'),
    iconComponent: 'icon-outing',
  },
  {
    to: { name: 'outings-stats', query: { u: $user.id } },
    text: $gettext('My statistics'),
    icon: 'chart-bar',
  },
  {
    to: { name: 'whatsnew', query: { u: $user.id } },
    text: $gettext('My changes'),
    icon: 'edit',
  },
  {
    to: { name: 'following' },
    text: $gettext('My followed users'),
    icon: 'heart',
  },
  {
    to: { name: 'routes', query: { u: $user.id } },
    text: $gettext('My bookmarks'),
    icon: 'star',
  },
]);

function go(document: C2cDocument) {
  router.push({
    name: $documentUtils.getDocumentType(document.type),
    params: { id: document.document_id },
  });
}

function setUrlsConfiguration(name: string) {
  config.setUrlsName(name);
  // reload the page
  router.go(0);
}

function onClick(event: MouseEvent) {
  if (!searchInputContainer.value!.contains(event.target as Node)) {
    hideSearchInput.value = true;
  }
}

function showSearchInput() {
  hideSearchInput.value = false;

  // after DOM update, input will be visible, and focusable
  nextTick(() => {
    searchInput.value!.focus();
  });
}

function signout() {
  if (!route.meta.requiresAuth) {
    $user.signout();
    return;
  }

  // leave the page first: its leave guard (e.g. unsaved edits) may cancel the
  // navigation, in which case the user stays logged in on the current page.
  // vue-router resolves push() with the failure (it rejects only on errors)
  router.push({ name: 'home' }).then((failure) => {
    if (!isNavigationFailure(failure)) {
      $user.signout();
    }
  });
}

function homePage() {
  return route.path === '/home' || route.path === '/';
}

window.addEventListener('click', onClick);

onBeforeUnmount(() => {
  window.removeEventListener('click', onClick);
});
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
    transition:
      width 0.5s ease,
      margin-right 0.5s ease;
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
