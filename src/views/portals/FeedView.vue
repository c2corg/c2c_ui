<template>
  <div>
    <html-header :title="$gettext('Home')" />
    <home-banner v-if="!$user.isLogged" />
    <div class="section feed-view">
      <div class="columns">
        <div class="column is-12-mobile is-7-tablet is-7-desktop is-8-widescreen is-9-fullhd">
          <div class="feed-title">
            <span class="is-size-3 has-text-weight-semibold" v-translate="{ TOTO: 'Bruno' }">Activity feed</span>
            <span v-if="$user.isLogged" class="feed-buttons is-pulled-right">
              <input
                id="c2c-personal-feed"
                class="is-checkradio is-primary"
                type="checkbox"
                v-model="isPersonal"
                @change="saveIsPersonalState"
              />
              <label for="c2c-personal-feed">
                {{ isPersonal ? $gettext('Personal feed on') : $gettext('Personal feed off') }}
              </label>
            </span>
          </div>
          <feed-widget :type="isPersonal && $user.isLogged ? 'personal' : 'default'" hide-empty-documents />
        </div>
        <div class="column is-hidden-mobile is-5-tablet is-5-desktop is-4-widescreen is-3-fullhd">
          <h3 class="title is-3" v-translate="{ plural: 'Last forum topic', n: 3, COUNT: 3 }">
            Last %{COUNT} forum topics
          </h3>

          <forum-widget wide class="box is-paddingless" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import HomeBanner from './HomeBanner';
import ForumWidget from './utils/ForumWidget';

import FeedWidget from '@/components/feed-widget/FeedWidget';

export default {
  name: 'FeedView',

  components: {
    HomeBanner,
    FeedWidget,
    ForumWidget,
  },

  data() {
    return {
      isPersonal: false,
    };
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
@import '@/assets/sass/variables.scss';

@media screen and (max-width: $tablet) {
  .feed-view {
    padding-left: 0;
    padding-right: 0;

    .feed-title {
      padding-left: 0.5rem;
      padding-right: 0.5rem;
    }
  }
}

.feed-title {
  margin-bottom: 12px;
}

.feed-buttons {
  vertical-align: text-bottom;
}

.cards-container > div {
  justify-content: center;
  margin: auto;
}
</style>
