<template>
  <div>
    <html-header :title="$gettext('Home')" />
    <home-banner v-if="!$user.isLogged" />
    <div v-if="isOffline">
      <div class="p-4 mb-4 has-text-light has-background-grey">
        <p v-translate>Network is down, Camptocamp.org is offline. You can view saved documents and images.</p>
        <p v-translate>Other sections require a network connection.</p>
      </div>
      <offline-documents class="section" />
    </div>
    <template v-else>
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
            </div>
            <feed-widget :type="isPersonal && $user.isLogged ? 'personal' : 'default'" hide-empty-documents />
          </div>
          <div
            v-if="!$screen.isMobile"
            class="column is-hidden-mobile is-5-tablet is-5-desktop is-4-widescreen is-3-fullhd"
          >
            <h3 class="title is-3" v-translate>Last forum topics</h3>
            <forum-widget wide />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import HomeBanner from './HomeBanner';
import ForumWidget from './utils/ForumWidget';

import FeedWidget from '@/components/feed-widget/FeedWidget';
import OfflineDocuments from '@/views/offline/OfflineDocuments';

export default {
  name: 'FeedView',

  components: {
    HomeBanner,
    FeedWidget,
    ForumWidget,
    OfflineDocuments,
  },

  data() {
    return {
      isPersonal: false,
    };
  },

  computed: {
    isOffline() {
      return this.$offline.isOffline();
    },
  },

  created() {
    this.isPersonal = this.$localStorage.get('isPersonal', false);
  },

  methods: {
    saveIsPersonalState() {
      this.$localStorage.set('isPersonal', this.isPersonal);
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
