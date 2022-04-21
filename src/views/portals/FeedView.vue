<template>
  <div>
    <html-header :title="$gettext('Home')" />
    <home-banner v-if="!$user.isLogged" />
    <div class="section feed-view">
      <div class="columns">
        <div class="column is-12-mobile is-7-tablet is-7-desktop is-8-widescreen is-9-fullhd">
          <div class="feed-title">
            <span class="is-size-3 has-text-weight-semibold" v-translate>Activity feed</span>
            <div class="field" v-if="$user.isLogged">
              <input
                id="c2c-personal-feed"
                class="switch is-rtl is-rounded is-info"
                type="checkbox"
                v-model="isPersonal"
                @change="saveIsPersonalState"
              />
              <label
                for="c2c-personal-feed"
                v-translate
                :title="isPersonal ? $gettext('Personal feed on') : $gettext('Personal feed off')"
              >
                Personal feed
              </label>
            </div>
            <span @click="toogleProperty('listMode')" class="header-item is-size-3 has-cursor-pointer is-hidden-mobile">
              <fa-icon icon="th-list" :class="listMode ? 'has-text-primary' : ''" :title="$gettext('List mode')" />
              <fa-icon icon="th" :class="!listMode ? 'has-text-primary' : ''" :title="$gettext('Cards mode')" />
            </span>
          </div>
          <feed-widget
            v-if="!listMode"
            :type="isPersonal && $user.isLogged ? 'personal' : 'default'"
            hide-empty-documents
            hide-waypoints
          />
          <feed-tab
            v-if="listMode"
            :type="isPersonal && $user.isLogged ? 'personal' : 'default'"
            hide-empty-documents
            hide-waypoints
          />
        </div>
        <div
          v-if="!$screen.isMobile"
          class="column is-hidden-mobile is-5-tablet is-5-desktop is-4-widescreen is-3-fullhd"
        >
          <h3 class="title is-3" v-translate>Last forum topics</h3>
          <forum-widget wide class="box is-paddingless" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import HomeBanner from './HomeBanner';
import ForumWidget from './utils/ForumWidget';

import FeedTab from '@/components/feed-widget/FeedTab';
import FeedWidget from '@/components/feed-widget/FeedWidget';

export default {
  name: 'FeedView',

  components: {
    HomeBanner,
    FeedTab,
    FeedWidget,
    ForumWidget,
  },

  data() {
    return {
      isPersonal: false,
      listMode: false,
    };
  },

  created() {
    this.isPersonal = this.$localStorage.get('isPersonal', false);
  },

  methods: {
    saveIsPersonalState() {
      this.$localStorage.set('isPersonal', this.isPersonal);
    },

    toogleProperty(property) {
      this.setProperty(property, !this[property]);
    },

    setProperty(property, value) {
      this[property] = value;
      this.$localStorage.set(`${this.documentType}.${property}`, this[property]);
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

.feed-title {
  margin-bottom: 12px;
  display: flex;
  align-items: baseline;

  span:first-child {
    flex-grow: 1;
  }
}

.cards-container > div {
  justify-content: center;
  margin: auto;
}
</style>
