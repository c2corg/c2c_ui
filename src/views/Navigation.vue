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
              <span
                class="forum-avatar"
                :class="{ 'has-notifications': forumLinks.some((link) => link.kind === 'notifications') }"
              >
                <img
                  width="24"
                  height="24"
                  alt="Avatar"
                  :src="forumUrl + '/user_avatar/forum.camptocamp.org/' + $user.forumUsername + '/24/1_1.png'"
                />
                <!-- placed like on the forum: messages on the left, other notifications on the right -->
                <span
                  v-for="link of forumLinks"
                  :key="link.kind"
                  class="forum-badge is-on-avatar"
                  :class="'is-' + link.kind"
                  aria-hidden="true"
                >
                  {{ badgeText(link.count) }}
                </span>
              </span>
              <span v-for="link of forumLinks" :key="link.kind" class="is-sr-only">
                {{ link.text }}: {{ link.count }}
              </span>
              <span class="has-text-weight-bold is-hidden-mobile"> &nbsp;{{ $user.name }} </span>
              <span
                v-if="openRemovals > 0"
                class="removals-badge"
                :title="$gettext('Account removals in progress')"
                aria-hidden="true"
              ></span>
            </span>
          </template>

          <template v-if="forumLinks.length">
            <a
              v-for="link of forumLinks"
              :key="link.kind"
              :href="link.href"
              target="_blank"
              rel="noopener"
              class="dropdown-item is-size-5 forum-link"
              @click="userMenu!.isActive = false"
            >
              <fa-icon :icon="link.icon" fixed-width />
              <span>{{ link.text }}</span>
              <span class="forum-badge" :class="'is-' + link.kind">{{ link.count }}</span>
            </a>
            <hr class="dropdown-divider" />
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
            <span v-if="item.badge" class="tag is-danger is-rounded">{{ item.badge }}</span>
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
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { isNavigationFailure, useRoute, useRouter } from 'vue-router';

import DfmAdLarge from './DfmAdLarge.vue';

import IconHelp from '@/components/generics/icons/IconHelp.vue';
import IconJoinUs from '@/components/generics/icons/IconJoinUs.vue';
import JoinUsLink from '@/components/generics/links/JoinUsLink.vue';
import c2c from '@/js/apis/c2c';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { useIsHomePage } from '@/js/composables/home-page';
import config from '@/js/config';
import { toast } from '@/js/toast';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';
import type { useForumNotificationsStore } from '@/stores/forum-notifications';

defineEmits(['toggle-side-menu']);

const route = useRoute();
const router = useRouter();
const { $gettext, $user, $documentUtils } = useGlobalProperties();

// the API refused the session (see the user store): tell the user why they are signed out
watch(
  () => $user.sessionEnded,
  (reason) => {
    if (!reason) {
      return;
    }
    toast({
      message:
        reason === 'blocked'
          ? $gettext('Your account is blocked: you have been signed out.')
          : $gettext('Your session has ended: please sign in again.'),
      type: 'is-warning',
      position: 'center',
    });
  }
);

const forumUrl = config.urls.forum;

// the unread notifications of the user on the forum, while signed in. Loaded on the first sign in: visitors don't need it
const forumNotifications = shallowRef<ReturnType<typeof useForumNotificationsStore> | null>(null);
const followedForumUser = () => ($user.isLogged ? $user.forumUsername : null);
watch(
  followedForumUser,
  async (forumUsername) => {
    if (!forumUsername) {
      forumNotifications.value?.stop();
      return;
    }
    if (!forumNotifications.value) {
      const { useForumNotificationsStore } = await import('@/stores/forum-notifications');
      forumNotifications.value = useForumNotificationsStore();
      // signed out or changed while loading: the watcher ran again
      if (followedForumUser() !== forumUsername) {
        return;
      }
    }
    forumNotifications.value.start(forumUsername);
  },
  { immediate: true }
);

// the forum pages listing them, for the counts that are not zero
const forumLinks = computed(() =>
  [
    {
      kind: 'messages',
      count: forumNotifications.value?.unreadHighPriority ?? 0,
      href: `${forumUrl}/u/${$user.forumUsername}/messages`,
      text: $gettext('Forum messages'),
      icon: 'envelope',
    },
    {
      kind: 'notifications',
      count: forumNotifications.value?.unread ?? 0,
      href: `${forumUrl}/u/${$user.forumUsername}/notifications`,
      text: $gettext('Forum notifications'),
      icon: 'bell',
    },
  ].filter((link) => link.count > 0)
);

function badgeText(count: number) {
  return count > 9 ? '9+' : String(count);
}
const siteConfiguration = config;

const searchInputContainer = useTemplateRef<HTMLDivElement>('searchInputContainer');
const searchInput = useTemplateRef<{ focus(): void }>('searchInput');
const addDocumentMenu = useTemplateRef<{ isActive: boolean }>('addDocumentMenu');
const userMenu = useTemplateRef<{ isActive: boolean }>('userMenu');

const hideSearchInput = ref(true); // only on small screen

// the removal requests of the accounts which are not done: moderators of the topoguide and of the forum are notified of them
const openRemovals = ref(0);

watch(
  () => $user.canManageRemovals,
  (canManageRemovals) => {
    if (canManageRemovals) {
      c2c.moderator.countAccountRemovals().then((response) => {
        openRemovals.value = response.data.open;
      });
    } else {
      openRemovals.value = 0;
    }
  },
  { immediate: true }
);

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
  ...($user.canManageRemovals
    ? [
        {
          to: { name: 'account-removals' },
          text: $gettext('Account removals'),
          icon: 'user-slash',
          badge: openRemovals.value || null,
        },
      ]
    : []),
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

const isHomePage = useIsHomePage();
function homePage() {
  return isHomePage.value;
}

window.addEventListener('click', onClick);

onBeforeUnmount(() => {
  window.removeEventListener('click', onClick);
  forumNotifications.value?.stop();
});
</script>

<style scoped>
@import '@/assets/css/media.css';

.removals-badge {
  display: inline-block;
  width: 0.6rem;
  height: 0.6rem;
  margin-left: 0.3rem;
  border-radius: 50%;
  background-color: hsl(348deg 86% 61%);
}

nav {
  max-width: 100vw;
  height: var(--c2c-navbar-height);
  background-color: var(--c2c-white);
  box-shadow: 0 2px 0 var(--c2c-color-base-c2c);
  display: flex;
}

.navigation-brand {
  padding: 4px 5px !important;
  img {
    height: calc(var(--c2c-navbar-height) - 8px);
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
  background-color: var(--c2c-color-base-c2c);
}

/* the forum's badges: its colors (tertiary, success), white text, rounded */
.forum-avatar {
  position: relative;
  display: inline-flex;

  /* room for the right badge before the name */
  &.has-notifications {
    margin-right: 9px;
  }
}

/* like Discourse's .badge-notification: one line of text, same padding above and below */
.forum-badge {
  display: inline-block;
  box-sizing: content-box;
  min-width: 8px;
  padding: 2px 3px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: bold;
  line-height: 10px;
  text-align: center;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  color: #fff;
  background-color: #337ab7;

  /* where the digits sit in the line box depends on the font (Segoe UI, San Francisco, Roboto...):
     trimmed to the digits' height (cap height to baseline), the same padding above and below centers them */
  @supports (text-box: trim-both cap alphabetic) {
    padding: 3.5px 3px;
    text-box: trim-both cap alphabetic;
  }

  &.is-messages {
    background-color: #090;
  }

  /* on the top corners of the avatar, within the button's border: there are only 3px above the avatar */
  &.is-on-avatar {
    position: absolute;
    top: -2px;
    right: -9px;
    border: 1px solid var(--c2c-white);

    &.is-messages {
      right: auto;
      left: -9px;
    }
  }
}

.forum-link .forum-badge {
  margin-left: 0.5em;
  vertical-align: middle;
}

.with-ad {
  height: var(--c2c-navbarad-height);
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

@media screen and (--c2c-max-tablet) {
  .navigation-brand {
    img {
      margin-left: 0px;
      /* height:31px; */
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

@media screen and (--c2c-min-tablet) and (--c2c-max-desktop) {
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

@media screen and (--c2c-min-desktop) and (--c2c-max-widescreen) {
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

@media screen and (--c2c-min-widescreen) and (--c2c-max-fullhd) {
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

@media screen and (--c2c-min-fullhd) {
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

/* search input : increase size to right on hover */
/* only on screen wider than desktop */
@media screen and (--c2c-min-fullhd) {
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

<style>
@import '@/assets/css/media.css';

.c2c-color > a {
  color: var(--c2c-color-text);
}

@media screen and (--c2c-max-tablet) {
  .add-button .dropdown-content {
    position: fixed;
    right: 0;
    max-width: 100%;
  }
}
</style>
