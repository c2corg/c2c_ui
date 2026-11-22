<template>
  <header class="mobile-top-bar no-print">
    <!-- searching: the input fills the bar -->
    <template v-if="searchOpen">
      <button
        type="button"
        class="top-bar-btn back-btn"
        :aria-label="$gettext('Close the search')"
        @click="closeSearch"
      >
        <fa-icon icon="chevron-left" />
      </button>
      <div ref="searchWrap" class="search-wrap">
        <input-document
          v-model="picked"
          :document-type="['waypoint', 'route', 'article', 'book']"
          propose-creation
          show-more-results-link
          clear-input-on-toggle
        />
      </div>
    </template>

    <template v-else>
      <button v-if="showBack" type="button" class="top-bar-btn back-btn" :aria-label="$gettext('Back')" @click="goBack">
        <fa-icon icon="chevron-left" />
      </button>
      <router-link v-else :to="{ name: 'home' }" class="top-bar-logo" aria-label="Camptocamp.org">
        <logo-ctc />
      </router-link>

      <h1 class="top-bar-title">{{ title }}</h1>

      <div class="top-bar-actions">
        <!-- the help article of the site, as the side menu has it -->
        <router-link :to="HELP_ROUTE" class="top-bar-btn" :aria-label="$gettext('Help')" :title="$gettext('Help')">
          <fa-icon icon="circle-info" />
        </router-link>
        <button type="button" class="top-bar-btn" :aria-label="$gettext('Search')" @click="openSearch">
          <fa-icon icon="search" />
        </button>

        <!-- joining the association (membership fee), not creating an account: for everyone, as on the site -->
        <join-us-link class="top-bar-btn join-btn" :aria-label="$gettext('Join us')">
          <icon-join-us />
        </join-us-link>

        <dropdown-button ref="addMenu" class="is-right top-bar-btn add-btn">
          <template #button>
            <!-- a real button: reached by the keyboard and named for the screen readers, not only by its title -->
            <button
              type="button"
              class="add-trigger"
              :title="$gettext('Add a document')"
              :aria-label="$gettext('Add a document')"
            >
              <fa-icon icon="plus" />
            </button>
          </template>
          <add-link
            v-for="type of ADDABLE_TYPES"
            :key="type"
            :document-type="type"
            class="dropdown-item is-size-6"
            @click="closeAddMenu"
          >
            <icon-document :document-type="type" fixed-width />
            <span>{{ $filters.uppercaseFirstLetter($documentUtils.getCreationTitle(type)) }}</span>
          </add-link>
        </dropdown-button>

        <router-link
          v-if="$user.isLogged"
          :to="{ name: 'me' }"
          class="top-bar-btn top-bar-avatar"
          :aria-label="$gettext('Me')"
        >
          <img
            v-if="avatarUrl && !avatarFailed"
            :src="avatarUrl"
            :alt="$user.userName ?? ''"
            @error="avatarFailed = true"
          />
          <fa-icon v-else icon="user" />
        </router-link>
        <login-button v-else class="top-bar-btn" :aria-label="$gettext('Login')">
          <fa-icon icon="user" />
        </login-button>
      </div>
    </template>
  </header>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import LogoCtc from './LogoCtc.vue';

import DropdownButton from '@/components/generics/DropdownButton.vue';
import forum from '@/js/apis/forum';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { ADDABLE_TYPES, HELP_ROUTE } from '@/js/composables/main-menu';

defineOptions({ name: 'MobileTopBar' });

// the routes of the bottom bar tabs: the logo on the left, no back arrow
const TAB_ROUTES = new Set(['home', 'topoguide', 'offline']);

interface PickedDocument {
  document_id: number;
  type: string;
}

const { $documentUtils, $gettext, $language, $user } = useGlobalProperties();
const route = useRoute();
const router = useRouter();

const searchOpen = ref(false);
const searchWrap = useTemplateRef<HTMLDivElement>('searchWrap');
const addMenu = useTemplateRef<InstanceType<typeof DropdownButton>>('addMenu');
const picked = ref<PickedDocument | null>(null);
const avatarFailed = ref(false);

const routeName = computed(() => String(route.name ?? ''));
const showBack = computed(() => !TAB_ROUTES.has(routeName.value));

const title = computed(() => {
  const titles: Record<string, string> = {
    topoguide: $gettext('Topoguide'),
    home: $gettext('Home'),
    offline: $gettext('Favourites'),
    me: $gettext('Me'),
    'app-settings': $gettext('App settings'),
    'app-guide': $gettext('App guide'),
    outings: $gettext('outings'),
    routes: $gettext('routes'),
    waypoints: $gettext('waypoints'),
    articles: $gettext('articles'),
    books: $gettext('books'),
    xreports: $gettext('xreports'),
    areas: $gettext('areas'),
    images: $gettext('images'),
    maps: $gettext('maps'),
    profiles: $gettext('profiles'),
    outing: $gettext('outing'),
    route: $gettext('route'),
    waypoint: $gettext('waypoint'),
    article: $gettext('article'),
    book: $gettext('book'),
    xreport: $gettext('xreport'),
    area: $gettext('area'),
    image: $gettext('image'),
    map: $gettext('map'),
    profile: $gettext('profile'),
    account: $gettext('Account'),
    preferences: $gettext('Preferences'),
    following: $gettext('Following'),
    trackers: $gettext('Activity trackers'),
    auth: $gettext('Login'),
    'auth-sso': $gettext('Login'),
    yeti: 'Yeti',
    serac: 'SERAC',
    whatsnew: $gettext('Recent changes'),
    itinevert: 'Itinévert',
  };
  const name = titles[routeName.value];
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Camptocamp';
});

const avatarUrl = computed(() => ($user.forumUsername ? forum.getUserAvatarUrl($user.forumUsername, 48) : null));
// a new address deserves a new attempt
watch(avatarUrl, () => (avatarFailed.value = false));

watch(
  () => route.fullPath,
  () => (searchOpen.value = false)
);

function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    void router.push({ name: 'home' });
  }
}

async function openSearch() {
  searchOpen.value = true;
  await nextTick();
  // the keyboard opens at once
  searchWrap.value?.querySelector('input')?.focus();
}

function closeSearch() {
  searchOpen.value = false;
}

function closeAddMenu() {
  if (addMenu.value) {
    addMenu.value.isActive = false;
  }
}

// the search input picks a document without leaving the page (it also filters lists): open it
watch(picked, (document) => {
  if (!document) {
    return;
  }
  picked.value = null;
  searchOpen.value = false;
  const documentType = $documentUtils.getDocumentType(document.type);
  void router.push({
    name: documentType,
    params: { id: String(document.document_id), lang: $language.current ?? 'fr' },
  });
});
</script>

<style scoped>
.mobile-top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 26;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-height: 52px;
  padding: env(safe-area-inset-top) 0.25rem 0;
  background: var(--app-bar);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.top-bar-btn {
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--c2c-color-text);
  font-size: 1.1rem;
  cursor: pointer;
  border-radius: 4px;
  text-decoration: none;

  &:hover {
    background: var(--app-hover);
    color: var(--c2c-color-text);
  }
}

/* as big as the other buttons */
.top-bar-avatar {
  overflow: hidden;
  padding: 0;

  img {
    width: 100%;
    height: 100%;
    /* rounded square like the forum's avatars and the top bar buttons */
    border-radius: 4px;
    object-fit: cover;
    display: block;
  }
}

.back-btn {
  margin-right: 0.25rem;
}

.top-bar-logo {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  height: 38px;
  padding: 0 0.4rem;

  .logo-ctc {
    height: 28px;
    width: auto;
  }
}

.top-bar-title {
  flex: 1;
  text-align: center;
  font-size: 1rem;
  font-weight: 600;
  color: var(--c2c-color-text);
  margin: 0 0.25rem;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.top-bar-actions {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
}

/* join us: orange, as the button of the site */
.join-btn {
  background: var(--c2c-color-base-c2c);
  color: var(--c2c-white);
  /* JoinUsLink wraps a classless <a>: the button gives it its color, not Bulma's blue */
  :deep(a) {
    color: inherit;
  }
  &:hover {
    background: #e6791f;
    color: var(--c2c-white);
  }
}

/* the coloured buttons and the avatar: a little apart, all the same, unlike the plain icons */
.add-btn,
.top-bar-avatar {
  margin-left: 0.15rem;
}

/* add: green, as the is-success button of the site */
.add-btn {
  :deep(.add-trigger) {
    width: 38px;
    height: 38px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #48c774;
    color: var(--c2c-white);
    border: none;
    border-radius: 4px;
    font: inherit;
    padding: 0;
    cursor: pointer;
  }
  :deep(.add-trigger:hover) {
    background: #3ec46d;
  }
  :deep(.dropdown-menu) {
    z-index: 30;
    /* right-anchored: never wider than the screen, or its left edge goes off it */
    max-width: calc(100vw - 1rem);
  }
  /* the creation titles ("Ajouter un itinéraire") are longer than the menu on a phone: they wrap */
  :deep(.dropdown-content) {
    max-width: 100%;
  }
  :deep(.dropdown-item) {
    white-space: normal;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    line-height: 1.25;
  }
}

.search-wrap {
  flex: 1;
  display: flex;
  align-items: center;

  :deep(.input),
  :deep(input[type='search']),
  :deep(input[type='text']) {
    width: 100%;
    height: 36px;
    font-size: 16px; /* iOS zooms in on smaller inputs */
  }
}
</style>
