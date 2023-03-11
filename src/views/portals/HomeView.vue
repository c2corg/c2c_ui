<template>
  <div class="section">
    <div class="columns">
      <div class="column is-12-mobile is-7-tablet is-7-desktop is-8-widescreen is-9-fullhd">
        <!-- Présentation de l'association, info qu'on met en avant -->
        <div class="box intro">
          <div class="feed-title">
            <span class="title is-4" :class="{ 'is-marginless': !visible }" v-translate
              >Bienvenue sur Camptocamp ! La communauté des sports de montagne</span
            >
            <fa-icon
              class="is-size-6 no-print accordion-icon mt-2"
              icon="angle-down"
              :rotation="visible ? 180 : undefined"
              @click="toogleProperty('visible')"
            />
          </div>
          <home-banner v-show="visible" :feed="feed" />
        </div>
        <publi-widget v-if="$screen.isMobile" />
        <!-- Switchs -->
        <div class="field">
          <span>
            <input id="c2c-mode" class="toggleCheckbox" type="checkbox" v-model="feed" />
            <label class="toggleContainer" for="c2c_mode">
              <span :class="{ 'is-active': !feed }" v-translate @click="toogleProperty('feed')">Tableau de bord</span>
              <span :class="{ 'is-active': feed }" v-translate @click="toogleProperty('feed')">Activity feed</span>
            </label>
          </span>
          <span :class="{ 'is-pulled-right': !$screen.isMobile }">
            <span v-if="$user.isLogged">
              <input
                id="c2c-personal-feed"
                class="switch is-rtl is-rounded"
                type="checkbox"
                v-model="isPersonal"
                @click="toogleProperty('isPersonal')"
              />
              <label
                for="c2c-personal-feed"
                v-translate
                :title="isPersonal ? $gettext('Personal feed on') : $gettext('Personal feed off')"
              >
                Load my preferences
              </label>
            </span>
            <router-link to="preferences" class="has-text-normal" :title="$gettext('My preferences')">
              <fa-icon icon="gears" />
            </router-link>
          </span>
        </div>
        <div class="feed-view" v-if="feed">
          <feed-widget :type="isPersonal && $user.isLogged ? 'personal' : 'default'" hide-empty-documents />
        </div>
        <div v-if="!feed">
          <dashboard-outings-list :is-personal="isPersonal" />
          <dashboard-images-gallery v-if="$screen.isMobile" />
          <dashboard-routes-list />
          <dashboard-articles-list v-if="$screen.isMobile" />
          <useful-links v-if="$screen.isMobile" />
          <forum-widget :message-count="20" v-if="$screen.isMobile" />
        </div>
      </div>
      <div v-if="!$screen.isMobile" class="column is-5-tablet is-5-desktop is-4-widescreen is-3-fullhd">
        <publi-widget />
        <dashboard-images-gallery v-if="!feed" />
        <useful-links />
        <forum-widget :message-count="20" />
        <dashboard-articles-list v-if="!feed" />
      </div>
    </div>
  </div>
</template>

<script>
import HomeBanner from './HomeBanner';
import DashboardArticlesList from './utils/DashboardArticlesList';
import DashboardImagesGallery from './utils/DashboardImagesGallery';
import DashboardOutingsList from './utils/DashboardOutingsList';
import DashboardRoutesList from './utils/DashboardRoutesList';
import ForumWidget from './utils/ForumWidget';
import PubliWidget from './utils/PubliWidget';
import UsefulLinks from './utils/UsefulLinks';

import FeedWidget from '@/components/feed-widget/FeedWidget';

export default {
  name: 'HomeView',

  components: {
    HomeBanner,
    DashboardArticlesList,
    DashboardImagesGallery,
    DashboardOutingsList,
    DashboardRoutesList,
    ForumWidget,
    PubliWidget,
    UsefulLinks,
    FeedWidget,
  },

  data() {
    let state = true;

    if (this.$user.isLogged) {
      state = false;
    }
    return {
      isPersonal: this.$localStorage.get('isPersonal', false),
      feed: this.$localStorage.get('feed', false),
      visible: state,
    };
  },

  methods: {
    toogleProperty(property) {
      this.setProperty(property, !this[property]);
    },
    setProperty(property, value) {
      this[property] = value;
      this.$localStorage.set(`${property}`, this[property]);
    },
  },
};
</script>

<style scoped lang="scss">
@media screen and (max-width: $tablet) {
  .feed-view {
    padding-left: 0;
    padding-right: 0;

    .feed-title {
      padding-left: 0;
      padding-right: 0;
    }
  }
}

@media screen and (min-width: $tablet) {
  .feed-view {
    margin-top: 1.5rem;
  }
}

.feed-title {
  display: flex;

  span:first-child {
    flex-grow: 1;
  }
}

h4 {
  padding-bottom: 0.7rem !important;
  margin-bottom: 0.7rem !important;
  border-bottom: 1px solid #ddd;
}

.intro {
  margin-bottom: 1rem;
}

.switch[type='checkbox']:checked + label::before {
  background: #f93;
}

.toggleCheckbox {
  display: none;
}

.toggleContainer {
  position: relative;
  border-radius: 20px;
  background: white;
  border: 1px solid #f93;
  padding: 5px 2px;
  cursor: pointer;
}

.is-active {
  color: white;
  border-radius: 20px;
  background: #f93;
  transition: color 0.3s;
}

.toggleContainer span {
  padding: 3px 10px;
  text-align: center;
  z-index: 100;
}
</style>
<style lang="scss">
h4 > a,
h6 > a,
.outing-date-header > a,
li > a {
  color: #4a4a4a !important;
}

h4 > a:hover,
h6 > a:hover,
.outing-date-header > a:hover {
  color: #337ab7 !important;
}

.dashboard-list > a:nth-child(2n + 1) {
  background-color: #fbfaf6;
}
</style>
