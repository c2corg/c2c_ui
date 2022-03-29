<template>
  <div>
    <html-header :title="$gettext('Alternative Home')" />
    <home-banner v-if="!$user.isLogged" />
    <div class="section">
      <div class="columns">
        <div class="column is-7 section feed-view">
          <div class="columns">
            <div class="column is-12">
              <div class="feed-title">
                <span class="is-size-3 has-text-weight-semibold" v-translate>Best of</span>
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
        <div class="column is-5">
          <div class="box">
            <h4 class="title is-3">
              <router-link to="forum">
                <icon-forum />
                Actualités du site et de l'association
              </router-link>
            </h4>
            <forum-widget-asso :message-count="10" />
          </div>
          <div class="box">
            <h4 class="title is-3">
              <router-link to="forum">
                <icon-forum />
                Coin du contributeur
              </router-link>
            </h4>
            <forum-widget-contributeurs :message-count="10" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import HomeBanner from './HomeBanner';
import ForumWidgetAsso from './utils/ForumWidgetAsso';
import ForumWidgetContributeurs from './utils/ForumWidgetContributeurs';

import FeedWidget from '@/components/feed-widget/FeedWidget';

export default {
  name: 'AlterhomeView',

  components: {
    HomeBanner,
    FeedWidget,
    ForumWidgetAsso,
    ForumWidgetContributeurs,
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
