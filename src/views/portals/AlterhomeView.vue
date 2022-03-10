<template>
  <div>
    <html-header :title="$gettext('Alternative Home')" />
    <home-banner v-if="!$user.isLogged" />
    <div class="section feed-view">
      <div class="columns">
        <div class="column is-12">
          <div class="feed-title">
            <span class="is-size-3 has-text-weight-semibold" v-translate>Activity feed</span>
            <router-link :to="{ name: 'dashboard' }">
              <span v-translate="" class="is-size-5">Dashboard</span>...
            </router-link>
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
          <feed-widget :type="isPersonal && $user.isLogged ? 'personal' : 'default'" show-great-documents />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import HomeBanner from './HomeBanner';

import FeedWidget from '@/components/feed-widget/FeedWidget';

export default {
  name: 'AlterhomeView',

  components: {
    HomeBanner,
    FeedWidget,
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
