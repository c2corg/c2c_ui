<template>
  <aside>
    <!-- the logo inline (LogoCtc): its text turns light in the dark theme -->
    <a :href="'/'" class="menu-brand has-text-centered" aria-label="Camptocamp.org">
      <logo-ctc />
    </a>
    <router-link :to="{ name: 'topoguide' }">
      <span
        class="menu-item is-ellipsed"
        :class="{
          'router-link-active': ['topoguide', 'routes', 'waypoints', 'areas', 'route', 'waypoint', 'area'].includes(
            String($route.name)
          ),
        }"
      >
        <icon-topoguide fixed-width />
        <span class="menu-item-text"> {{ $filters.uppercaseFirstLetter($gettext('Topoguide')) }} </span>
      </span>
    </router-link>
    <router-link :to="{ name: 'outings', query: { qa: 'draft,great', bbox: '-431698,3115462,1931123,8442818' } }">
      <span
        class="menu-item is-ellipsed"
        :class="{
          'router-link-active': ['outings', 'outing'].includes(String($route.name)),
        }"
      >
        <icon-outing fixed-width />
        <span class="menu-item-text"> {{ $filters.uppercaseFirstLetter($gettext('outings')) }} </span>
      </span>
    </router-link>
    <router-link :to="{ name: 'forum' }">
      <span class="menu-item is-ellipsed">
        <icon-forum />
        <span class="menu-item-text"> {{ $filters.uppercaseFirstLetter($gettext('Forum')) }} </span>
      </span>
    </router-link>
    <router-link :to="{ name: 'serac' }">
      <span
        class="menu-item is-ellipsed"
        :class="{
          'router-link-active': ['serac', 'xreports', 'xreport'].includes(String($route.name)),
        }"
      >
        <icon-xreport fixed-width />
        <span class="menu-item-text"> {{ $filters.uppercaseFirstLetter($gettext('Accident database')) }} </span>
      </span>
    </router-link>
    <router-link :to="{ name: 'articles' }">
      <span
        class="menu-item is-ellipsed"
        :class="{ 'router-link-active': ['articles', 'article'].includes(String($route.name)) }"
      >
        <icon-article fixed-width />
        <span class="menu-item-text"> {{ $filters.uppercaseFirstLetter($gettext('articles')) }} </span>
      </span>
    </router-link>
    <router-link :to="{ name: 'yeti' }" v-if="isTall">
      <span class="menu-item is-ellipsed" :class="{ 'router-link-active': ['yeti'].includes(String($route.name)) }">
        <icon-yeti fixed-width />
        <span class="menu-item-text"> {{ $filters.uppercaseFirstLetter($gettext('yeti')) }} </span>
      </span>
    </router-link>
    <!-- use of a href instead of router link so that the page is refreshed if you are already on Itinevert -->
    <a :href="$router.resolve({ name: 'itinevert' }).href">
      <span
        class="menu-item is-ellipsed"
        :class="{ 'router-link-active': ['itinevert'].includes(String($route.name)) }"
      >
        <icon-itinevert fixed-width />
        <span class="menu-item-text"> {{ $filters.uppercaseFirstLetter($gettext('Itinevert')) }} </span>
      </span>
    </a>
    <!-- the pages of the app that its bottom tab bar opens in the phone layout -->
    <router-link :to="{ name: 'offline' }">
      <span class="menu-item is-ellipsed">
        <fa-icon icon="bookmark" fixed-width />
        <span class="menu-item-text">{{ $gettext('My topos') }}</span>
      </span>
    </router-link>
    <router-link :to="{ name: 'app-settings' }">
      <span class="menu-item is-ellipsed">
        <fa-icon icon="palette" fixed-width />
        <span class="menu-item-text">{{ $gettext('Settings') }}</span>
      </span>
    </router-link>

    <div class="menu-footer is-size-7">
      <div class="has-text-centered menu-links">
        <router-link :to="{ name: 'article', params: { id: 106727 } }" v-translate>contact</router-link>
        <span> &bull; </span>
        <router-link :to="{ name: 'article', params: { id: 106731 } }" v-translate>EULA</router-link>
        <span> &bull; </span>
        <router-link :to="{ name: 'article', params: { id: 106728 } }" v-translate>Licenses</router-link>
        <br />
        <router-link :to="{ name: 'article', params: { id: 106726 } }" v-translate>Association</router-link>
        <span> &bull; </span>
        <a @click="showGdpr" v-translate>Cookies</a>
      </div>

      <div class="columns is-gapless has-text-centered is-mobile menu-socials">
        <div class="column">
          <a href="https://www.instagram.com/camptocamp_org/" title="Instagram">
            <icon-instagram class="instagram-icon" />
          </a>
        </div>
        <div class="column">
          <a href="https://www.facebook.com/camptocamp.org/" title="Facebook">
            <fa-icon :icon="['fab', 'facebook']" class="facebook-icon" />
          </a>
        </div>
        <div class="column">
          <a href="https://www.youtube.com/channel/UCllJ4-Ab7A0ZoqlAOAJtnCw" :title="$gettext('Youtube')">
            <fa-icon :icon="['fab', 'youtube']" class="youtube-icon" />
          </a>
        </div>
        <div class="column">
          <a href="https://www.helloasso.com/associations/camptocamp-association" :title="$gettext('Donate')">
            <fa-icon icon="heart" class="donate-icon" />
          </a>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';

import LogoCtc from '@/components/app/LogoCtc.vue';
import IconYeti from '@/components/generics/icons/IconYeti.vue';
import bus from '@/js/event-bus';

const isTall = ref(false);

function showGdpr() {
  bus.emit('show-gdpr');
}

function onHeightBreakpointChange() {
  isTall.value = mediaQueryList.matches;
}

const mediaQueryList = window.matchMedia('only screen and (min-height: 715px)');
if (mediaQueryList.addEventListener) {
  mediaQueryList.addEventListener('change', onHeightBreakpointChange);
} else {
  // Safari < 14 support
  mediaQueryList.addListener(onHeightBreakpointChange);
}
onHeightBreakpointChange();

onBeforeUnmount(() => {
  if (mediaQueryList.removeEventListener) {
    mediaQueryList.removeEventListener('change', onHeightBreakpointChange);
  } else {
    // Safari < 14 support
    mediaQueryList.removeListener(onHeightBreakpointChange);
  }
});
</script>

<style scoped>
aside {
  /* border-right: 1px solid var(--c2c-secondary); */
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.2);
  background: var(--c2c-white);
}

.menu-brand {
  display: block;
  line-height: 0;

  .logo-ctc {
    display: inline-block;
    width: auto;
    height: 70px;
    margin: 5px 0;
  }
}

.menu-item {
  display: block;
  padding: 6px 10px;
  border-left: 5px solid var(--c2c-white);
  color: var(--c2c-text);
}

.menu-item:hover {
  background: var(--c2c-light);
  border-left: 5px solid var(--c2c-color-base-c2c-lighter);
}

.menu-item-text {
  margin-left: 0;
  font-size: 1.1rem;
}

.menu-item.router-link-active {
  border-left: 5px solid var(--c2c-color-base-c2c);
  font-weight: bold;
}

.menu-footer {
  position: absolute;
  width: 100%;
  bottom: 0;

  .menu-socials,
  .menu-links {
    margin-bottom: 15px !important;
    line-height: 1;
  }

  .instagram-icon,
  .facebook-icon,
  .donate-icon,
  .youtube-icon {
    font-size: 30px;
  }

  .facebook-icon {
    color: #6d8bc9; /* facebook color */
  }

  .youtube-icon {
    color: #f00; /* youtube color */
  }

  .donate-icon {
    color: hsl(348, 100%, 71%);
    &:hover {
      color: hsl(348, 100%, 51%);
    }
  }
}

@media screen and (max-height: 680px) {
  .menu-socials {
    display: none !important;
  }
}

/* the dark theme of the app (src/stores/app-settings.ts, App.vue): a dark menu */
html[data-theme='dark'] aside {
  background: #1f1f1f;
}

html[data-theme='dark'] .menu-item {
  color: #e5e5e5;
}

html[data-theme='dark'] .menu-item:hover {
  background: #2a2a2a;
}
</style>
