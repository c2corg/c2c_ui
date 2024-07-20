<template>
  <div class="section">
    <html-header :title="$gettext('Camptocamp.org')" />
    <div class="columns">
      <div
        class="column is-12-mobile"
        :class="feed ? 'is-7-tablet is-7-desktop is-8-widescreen is-9-fullhd' : 'is-7 is-8-fullhd'"
      >
        <!-- Association and website introduction -->
        <div class="box intro">
          <div class="feed-title has-cursor-pointer">
            <span class="title is-4" :class="{ 'is-marginless': !visible }" v-translate>
              Welcome to Camptocamp, the mountain sports community!
            </span>
            <fa-icon
              class="is-size-6 no-print accordion-icon mt-2"
              icon="angle-down"
              :rotation="visible ? 180 : undefined"
              @click="toggleProperty('visible')"
            />
          </div>
          <home-banner v-show="visible" />
        </div>
        <board-announcement-widget v-if="$screen.isMobile" />
        <dfm-ad-small v-if="$screen.isMobile" />
        <!-- Switchs -->
        <div class="field">
          <span>
            <input id="c2c-mode" class="toggleCheckbox" type="checkbox" v-model="feed" />
            <label class="toggleContainer" for="c2c_mode">
              <span :class="{ 'is-active': !feed }" @click="toggleProperty('feed')" v-translate>Dashboard</span>
              <span :class="{ 'is-active': feed }" @click="toggleProperty('feed')" v-translate>Activity feed</span>
            </label>
          </span>
          <span class="preference-switch">
            <span v-if="$user.isLogged">
              <input
                id="c2c-personal-feed"
                :class="{ 'switch is-rtl is-rounded': !$screen.isMobile }"
                type="checkbox"
                v-model="isPersonal"
                @click="toggleProperty('isPersonal')"
              />
              <label
                for="c2c-personal-feed"
                :title="isPersonal ? $gettext('Personal feed on') : $gettext('Personal feed off')"
              >
                <span v-translate>Load my preferences</span>
              </label>
            </span>
            <router-link to="preferences" class="has-text-normal" :title="$gettext('My preferences')">
              <fa-icon icon="gears" />
            </router-link>
          </span>
        </div>
        <!-- Feed/Dashboard -->
        <div class="feed-view" v-if="feed">
          <feed-widget :type="isPersonal && $user.isLogged ? 'personal' : 'default'" hide-empty-documents />
        </div>
        <div v-if="!feed">
          <dashboard-images-gallery v-if="!$screen.isMobile" />
          <dashboard-outings-list :is-personal="isPersonal" />
          <dashboard-images-gallery v-if="$screen.isMobile" />
          <dashboard-routes-list />
          <dashboard-articles-list v-if="$screen.isMobile" />
          <useful-links v-if="$screen.isMobile" />
          <forum-widget :message-count="20" v-if="$screen.isMobile" />
        </div>
      </div>
      <div
        v-if="!$screen.isMobile"
        class="column"
        :class="feed ? 'is-5-tablet is-5-desktop is-4-widescreen is-3-fullhd' : 'is-5 is-4-fullhd'"
      >
        <board-announcement-widget />
        <dfm-ad-small />
        <useful-links />
        <forum-widget :message-count="20" />
        <dashboard-articles-list v-if="!feed" />
      </div>
    </div>
  </div>
</template>

<script>
import DfmAdSmall from '../DfmAdSmall';

import HomeBanner from './HomeBanner';
import BoardAnnouncementWidget from './utils/BoardAnnoucementWidget';
import DashboardArticlesList from './utils/DashboardArticlesList';
import DashboardImagesGallery from './utils/DashboardImagesGallery';
import DashboardOutingsList from './utils/DashboardOutingsList';
import DashboardRoutesList from './utils/DashboardRoutesList';
import ForumWidget from './utils/ForumWidget';
import UsefulLinks from './utils/UsefulLinks';

import FeedWidget from '@/components/feed-widget/FeedWidget';

export default {
  name: 'HomeView',

  components: {
    DfmAdSmall,
    HomeBanner,
    BoardAnnouncementWidget,
    DashboardArticlesList,
    DashboardImagesGallery,
    DashboardOutingsList,
    DashboardRoutesList,
    ForumWidget,
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
    toggleProperty(property) {
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

  .field {
    flex-direction: column;
  }

  .preference-switch {
    margin-top: 0.3rem;
    margin-left: 0.3rem;
    display: flex;
  }

  .preference-switch > span {
    display: flex;
    flex-direction: row-reverse;
  }

  .preference-switch > span > * {
    margin-right: 0.3rem;
  }
}

@media screen and (min-width: $tablet) {
  .feed-view {
    margin-top: $size-3;
  }

  .field {
    justify-content: space-between;
    align-items: baseline;
  }
}

.feed-title {
  display: flex;

  span:first-child {
    flex-grow: 1;
  }
}

.intro {
  margin-bottom: $size-6;
}

.switch[type='checkbox']:checked + label::before {
  background: $color-base-c2c;
}

.toggleCheckbox {
  display: none;
}

.toggleContainer {
  position: relative;
  border-radius: 20px;
  background: white;
  border: 1px solid $color-base-c2c;
  padding: 5px 2px;
  cursor: pointer;
}

.is-active {
  color: white;
  border-radius: 20px;
  background: $color-base-c2c;
  transition: color 0.3s;
}

.toggleContainer span {
  padding: 3px 10px;
  text-align: center;
  z-index: 100;
}

.field {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.ams-ad {
  margin-bottom: $size-7;
}
</style>
