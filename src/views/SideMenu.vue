<template>
  <aside>
    <!-- the logo inline (LogoCtc): its text turns light in the dark theme -->
    <a :href="'/'" class="menu-brand has-text-centered" aria-label="Camptocamp.org">
      <logo-ctc />
    </a>
    <template v-for="item of menuItems" :key="item.key">
      <template v-if="!item.tallOnly || isTall">
        <!-- a plain link when asked, so that the page is refreshed if you are already on it (Itinevert) -->
        <component
          :is="item.reload ? 'a' : 'router-link'"
          v-bind="item.reload ? { href: $router.resolve(item.to).href } : { to: item.to }"
        >
          <span
            class="menu-item is-ellipsed"
            :class="{ 'router-link-active': item.match.includes(String($route.name)) }"
          >
            <component :is="item.iconComponent" v-if="item.iconComponent" fixed-width />
            <fa-icon v-else :icon="item.icon!" fixed-width />
            <span class="menu-item-text"> {{ item.label }} </span>
          </span>
        </component>
      </template>
    </template>

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
import { useMainMenuItems } from '@/js/composables/main-menu';
import bus from '@/js/event-bus';

const menuItems = useMainMenuItems();
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
  background: var(--app-dark-field);
}

/* the white left border of the items, the color of the dark menu (their text follows the tokens, App.vue) */
html[data-theme='dark'] .menu-item {
  border-left-color: var(--app-dark-field);
}

html[data-theme='dark'] .menu-item:hover {
  background: var(--app-dark-surface);
}
</style>
