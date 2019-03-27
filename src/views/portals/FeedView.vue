<template>
  <div>
    <html-header :title="$gettext('Home')" />
    <home-banner v-if="!$user.isLogged" />
    <div class="section feed-view">
      <div class="columns">
        <div class="column is-12-mobile is-7-tablet is-7-desktop is-8-widescreen is-9-fullhd">
          <h3 class="title is-3 feed-title">
            <span v-translate>Activity feed</span>
            <span v-if="$user.isLogged" class="is-size-5 is-pulled-right feed-buttons">
              <router-link :to="{name:'preferences'}" :title="$gettext('My preferences')">
                <fa-icon icon="cogs" />
              </router-link>
              <span :title="isPersonal ? $gettext('Personal feed on') : $gettext('Personal feed off')">
                <fa-icon :icon="isPersonal ? 'user-check' : 'user'" @click="toggleIsPersonal" />
              </span>
            </span>
          </h3>
          <feed-widget :type="isPersonal && $user.isLogged ? 'personal' : 'default'" hide-empty-documents />
        </div>
        <div class="column is-hidden-mobile is-5-tablet is-5-desktop is-4-widescreen is-3-fullhd">
          <h3 class="title is-3" v-translate>
            Mobile application
          </h3>
          <mobile-app-advertising class="box" />

          <h3 class="title is-3" v-translate>
            Last forum topics
          </h3>

          <forum-widget wide class="box is-paddingless" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>

  import FeedWidget from '@/components/feed-widget/FeedWidget';
  import HomeBanner from './HomeBanner';
  import ForumWidget from './utils/ForumWidget';
  import MobileAppAdvertising from './utils/MobileAppAdvertising';

  export default {
    name: 'FeedView',

    components: {
      HomeBanner,
      FeedWidget,
      ForumWidget,
      MobileAppAdvertising
    },

    data() {
      return {
        isPersonal: false
      };
    },

    created() {
      this.isPersonal = this.$localStorage.get('isPersonal', false);
    },

    methods: {
      toggleIsPersonal() {
        this.isPersonal = !this.isPersonal;
        this.$localStorage.set('isPersonal', this.isPersonal);
      }
    }
  };

</script>

<style scoped lang="scss">

  @import '@/assets/sass/variables.scss';

  @media screen and (max-width: $tablet) {
    .feed-view{
      padding-left: 0;
      padding-right: 0;

      .feed-title{
        padding-left: 0.5rem;
        padding-right: 0.5rem;
      }
    }
  }

  .cards-container > div{
    justify-content:center;
    margin:auto;
  }

  .feed-buttons{
    a, svg{
      color:$text;
    }

    svg{
      margin-right:0.3rem;
      cursor: pointer;
    }
  }
</style>
