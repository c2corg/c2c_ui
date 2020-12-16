<template>
  <aside>
    <router-link :to="{ name: 'home' }" class="menu-brand has-text-centered">
      <img src="@/assets/img/logo.svg" url="@/assets/img/logo.svg" alt="Camptocamp.org" />
    </router-link>

    <router-link
      v-for="item of menuItems"
      :key="item.name"
      :to="{ name: item.name, query: item.query, params: item.params }"
    >
      <span
        v-if="!item.minScreenHeight || item.minScreenHeight < $screen.height"
        class="menu-item is-ellipsed"
        :class="{ 'router-link-active': item.activeFor.includes($route.name) }"
      >
        <component :is="item.icon" />
        <span class="menu-item-text"> {{ item.text | uppercaseFirstLetter }} </span>
      </span>
    </router-link>

    <div class="menu-footer is-size-7">
      <!-- We must use JS to hide add, because we do not want that hidden add be taken add's stats -->
      <advertisement class="menu-add" v-if="$screen.height >= 630" />

      <div class="has-text-centered menu-links">
        <router-link :to="{ name: 'article', params: { id: 106727 } }" v-translate>contact</router-link>
        <span> &bull; </span>
        <router-link :to="{ name: 'article', params: { id: 106731 } }" v-translate>EULA</router-link>
        <span> &bull; </span>
        <router-link :to="{ name: 'article', params: { id: 106728 } }" v-translate>Licenses</router-link>
        <br />
        <router-link :to="{ name: 'article', params: { id: 106726 } }" v-translate>Association</router-link>
      </div>

      <div class="columns is-gapless has-text-centered is-mobile menu-socials">
        <div class="column">
          <a href="https://twitter.com/camptocamporg" title="twitter">
            <fa-icon :icon="['fab', 'twitter']" class="twitter-icon" />
          </a>
        </div>
        <div class="column">
          <a href="https://www.facebook.com/camptocamp.org/" title="facebook">
            <fa-icon :icon="['fab', 'facebook']" class="facebook-icon" />
          </a>
        </div>
        <div class="column">
          <a
            href="https://www.helloasso.com/associations/camptocamp-assocation/adhesions/adhesion-camptocamp-association"
            title="Donate"
          >
            <fa-icon icon="heart" class="donate-icon" />
          </a>
        </div>
      </div>
    </div>
  </aside>
</template>

<script>
import Advertisement from './Advertisement';

export default {
  components: { Advertisement },

  computed: {
    // This must be computed, because it needs $gettext() function
    menuItems() {
      return [
        {
          name: 'topoguide',
          icon: 'icon-topoguide',
          text: this.$gettext('Topoguide'),
          activeFor: ['routes', 'waypoints', 'route', 'waypoint', 'area', 'areas'],
        },
        {
          name: 'outings',
          icon: 'icon-outing',
          text: this.$gettext('outings'),
          activeFor: ['outing'],
          query: { qa: 'draft,great', bbox: '-431698,3115462,1931123,8442818' },
        },
        { name: 'forum', icon: 'icon-forum', text: this.$gettext('Forum'), activeFor: [] },
        {
          name: 'serac',
          icon: 'icon-xreport',
          text: this.$gettext('Accident database'),
          activeFor: ['xreports', 'xreport', 'xreport-add'],
        },
        { name: 'articles', icon: 'icon-article', text: this.$gettext('articles'), activeFor: ['article'] },
        {
          name: 'article',
          icon: 'icon-help',
          text: this.$gettext('Help'),
          activeFor: [],
          minScreenHeight: 715,
          params: { id: 106732 },
        },
      ];
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables.scss';

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

  .twitter-icon,
  .facebook-icon,
  .donate-icon {
    font-size: 30px;
  }

  .twitter-icon,
  &:hover {
    color: #4198fb; // twitter color
  }

  .facebook-icon,
  &:hover {
    color: #6d8bc9; //facebook color
  }

  .donate-icon {
    color: hsl(348, 100%, 71%);
    &:hover {
      color: hsl(348, 100%, 51%);
    }
  }
}

// @media screen and (max-height: 645px){
//     .menu-ad {
//         display:none!important;
//     }
// }

@media screen and (max-height: 680px) {
  .menu-socials {
    display: none !important;
  }
}
</style>
