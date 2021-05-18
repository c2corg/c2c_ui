<template>
  <div>
    <html-header :title="$gettext('Home')" />
    <home-banner v-if="!$user.isLogged" />
    <div class="section feed-view">
      <div class="columns">
        <div class="column is-12-mobile is-7-tablet is-7-desktop is-8-widescreen is-9-fullhd">
          <div class="feed-title">
            <span class="is-size-3 has-text-weight-semibold" v-translate>Activity feed</span>
            <span v-if="$user.isLogged" class="feed-buttons is-pulled-right">
              <!--<dropdown-button class="is-right" ref="configureFeedMenu">
                <span slot="button" class="button is-text">
                  <fa-icon icon="ellipsis-v" />
                </span>
                <div>
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
                    Personnaliser
                  </label>
                </div>
              </dropdown-button>-->
              <!--<div class="dropdown is-right is-active">
                <div class="dropdown-trigger">
                  <div class="button is-success" aria-haspopup="true" aria-controls="feed-dropdown-menu">
                    <fa-icon icon="ellipsis-v" />
                  </div>
                </div>
                <div class="dropdown-menu" id="feed-dropdown-menu" role="menu">
                  <div class="dropdown-content">
                    <div class="dropdown-item">
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
                    </div>
                  </div>
                </div>
              </div>-->
              <!--<button
                class="button is-text"
                :class="{ 'has-text-grey-light': !isPersonal }"
                @click="toggleIsPersonalState"
                :title="isPersonal ? $gettext('Personal feed on') : $gettext('Personal feed off')"
              >
                <fa-icon :icon="isPersonal ? 'user' : 'user-slash'" />
              </button>-->
              <!--<input
                id="c2c-personal-feed"
                class="is-checkradio is-primary"
                type="checkbox"
                v-model="isPersonal"
                @change="saveIsPersonalState"
              />
              <label for="c2c-personal-feed">
                {{ isPersonal ? $gettext('Personal feed on') : $gettext('Personal feed off') }}
              </label>-->
              <div class="field">
                <input
                  id="c2c-personal-feed"
                  class="switch is-rounded is-info"
                  type="checkbox"
                  v-model="isPersonal"
                  @change="saveIsPersonalState"
                />
                <label
                  for="c2c-personal-feed"
                  v-translate
                  :title="isPersonal ? $gettext('Personal feed on') : $gettext('Personal feed off')"
                >
                  Personnaliser
                </label>
              </div>
            </span>
          </div>
          <feed-widget :type="isPersonal && $user.isLogged ? 'personal' : 'default'" hide-empty-documents />
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

import FeedWidget from '@/components/feed-widget/FeedWidget';
import DropdownButton from '@/components/generics/DropdownButton';

export default {
  name: 'FeedView',

  components: {
    //DropdownButton,
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
    toggleIsPersonalState() {
      this.isPersonal = !this.isPersonal;
      this.$localStorage.set('isPersonal', this.isPersonal);
    },
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
