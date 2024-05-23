<template>
  <aside>
    <a :href="'/'" class="menu-brand has-text-centered">
      <img src="@/assets/img/logo.svg" alt="Camptocamp.org" />
    </a>
    <router-link :to="{ name: 'topoguide' }">
      <span
        class="menu-item is-ellipsed"
        :class="{
          'router-link-active': ['topoguide', 'routes', 'waypoints', 'areas', 'route', 'waypoint', 'area'].includes(
            $route.name
          ),
        }"
      >
        <icon-topoguide fixed-width />
        <span class="menu-item-text"> {{ $gettext('Topoguide') | uppercaseFirstLetter }} </span>
      </span>
    </router-link>
    <router-link :to="{ name: 'outings', query: { qa: 'draft,great', bbox: '-431698,3115462,1931123,8442818' } }">
      <span
        class="menu-item is-ellipsed"
        :class="{
          'router-link-active': ['outings', 'outing'].includes($route.name),
        }"
      >
        <icon-outing fixed-width />
        <span class="menu-item-text"> {{ $gettext('outings') | uppercaseFirstLetter }} </span>
      </span>
    </router-link>
    <router-link :to="{ name: 'forum' }">
      <span class="menu-item is-ellipsed">
        <icon-forum />
        <span class="menu-item-text"> {{ $gettext('Forum') | uppercaseFirstLetter }} </span>
      </span>
    </router-link>
    <router-link :to="{ name: 'serac' }">
      <span
        class="menu-item is-ellipsed"
        :class="{
          'router-link-active': ['serac', 'xreports', 'xreport'].includes($route.name),
        }"
      >
        <icon-xreport fixed-width />
        <span class="menu-item-text"> {{ $gettext('Accident database') | uppercaseFirstLetter }} </span>
      </span>
    </router-link>
    <router-link :to="{ name: 'articles' }">
      <span
        class="menu-item is-ellipsed"
        :class="{ 'router-link-active': ['articles', 'article'].includes($route.name) }"
      >
        <icon-article fixed-width />
        <span class="menu-item-text"> {{ $gettext('articles') | uppercaseFirstLetter }} </span>
      </span>
    </router-link>
    <router-link :to="{ name: 'yeti' }" v-if="isTall">
      <span class="menu-item is-ellipsed" :class="{ 'router-link-active': ['yeti'].includes($route.name) }">
        <icon-yeti fixed-width />
        <span class="menu-item-text"> {{ $gettext('yeti') | uppercaseFirstLetter }} </span>
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

<script>
import IconYeti from '@/components/generics/icons/IconYeti';

export default {
  components: { IconYeti },

  data() {
    return {
      isTall: false,
    };
  },

  created() {
    this.mediaQueryList = window.matchMedia('only screen and (min-height: 715px)');
    if (this.mediaQueryList.addEventListener) {
      this.mediaQueryList.addEventListener('change', this.onHeightBreakpointChange);
    } else {
      // Safari < 14 support
      this.mediaQueryList.addListener(this.onHeightBreakpointChange);
    }
    this.onHeightBreakpointChange();
  },

  beforeDestroy() {
    if (this.mediaQueryList.removeEventListener) {
      this.mediaQueryList.removeEventListener('change', this.onHeightBreakpointChange);
    } else {
      // Safari < 14 support
      this.mediaQueryList.removeListener(this.onHeightBreakpointChange);
    }
  },

  methods: {
    showGdpr() {
      this.$root.$emit('show-gdpr');
    },

    onHeightBreakpointChange() {
      this.isTall = this.mediaQueryList.matches;
    },
  },
};
</script>

<style scoped lang="scss">
$brandLogoHeight: 70px;
$brandLogoMargin: 5px;

$menuLinkHeightPadding: 6px;

aside {
  // border-right: 1px solid $secondary;
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.2);
  background: $white;
}

.menu-brand {
  display: block;
  line-height: 0;

  img {
    height: $brandLogoHeight;
    margin: $brandLogoMargin 0;
  }
}

.menu-item {
  display: block;
  padding: $menuLinkHeightPadding 10px;
  border-left: 5px solid $white;
  color: $text;
}

.menu-item:hover {
  background: $light;
  border-left: 5px solid $color-base-c2c-lighter;
}

.menu-item-text {
  margin-left: 0;
  font-size: 1.1rem;
}

.menu-item.router-link-active {
  border-left: 5px solid $color-base-c2c;
  font-weight: bold;
}

.menu-footer {
  position: absolute;
  width: 100%;
  bottom: 0;

  .menu-socials,
  .menu-ad,
  .menu-links {
    margin-bottom: 15px !important;
    line-height: 1;
  }

  .menu-ad {
    height: 320px;
    margin-left: calc((200px - 160px) / 2);
    margin-right: calc((200px - 160px) / 2);
  }

  .instagram-icon,
  .facebook-icon,
  .donate-icon,
  .youtube-icon {
    font-size: 30px;
  }

  .facebook-icon {
    color: #6d8bc9; //facebook color
  }

  .youtube-icon {
    color: #f00; // youtube color
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
</style>
