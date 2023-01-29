<template>
  <div class="columns">
    <div class="column is-12-mobile is-7-tablet is-7-desktop is-8-widescreen is-9-fullhd">
      <feed-widget :type="isPersonal && $user.isLogged ? 'personal' : 'default'" />
    </div>
    <div
      v-if="!$screen.isMobile"
      class="column is-hidden-mobile is-5-tablet is-5-desktop is-4-widescreen is-3-fullhd"
    >
      <useful-links />
      <div class="box">
        <h4 class="title is-3">
          <router-link to="forum">
            <icon-forum />
            {{ $gettext('Forum') }}
          </router-link>
        </h4>
        <forum-widget :message-count="20" />
        <hr/>
        <h6 class="title is-6 has-text-centered">
          <router-link to="forum">
            <span v-translate>Voir plus</span>
          </router-link>
        </h6>
      </div>
    </div>
  </div>
</template>

<script>

import ForumWidget from './utils/ForumWidget';
import UsefulLinks from './utils/UsefulLinks';

import FeedWidget from '@/components/feed-widget/FeedWidget';
import c2c from '@/js/apis/c2c';

export default {
  name: 'FeedView',

  components: {
    FeedWidget,
    UsefulLinks,
    ForumWidget,
    },

  props: {
    isPersonal: {
      type: Boolean,
      required: true,
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
  //margin-bottom: 12px;
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
