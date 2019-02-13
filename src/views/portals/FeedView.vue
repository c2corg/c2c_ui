<template>
  <div class="has-background-light">
    <html-header :title="$gettext('Home')"/>
    <home-banner v-if="!$user.isLogged"/>
    <div class="section">
      <div class="columns">
        <div class="column is-7">
          <h3 class="title is-3">
            <span v-translate>Activity feed</span>
            <span v-if="$user.isLogged" class="is-size-5 is-pulled-right feed-buttons">
              <router-link :to="{name:'preferences'}" :title="$gettext('My preferences')">
                <fa-icon icon="cogs"/>
              </router-link>
              <span :title="isPersonal ? $gettext('Personal feed on') : $gettext('Personal feed off')">
                <fa-icon :icon="isPersonal ? 'user-check' : 'user'" @click="toggleIsPersonal"/>
              </span>
            </span>
          </h3>
          <feed-widget :type="isPersonal ? 'personal' : 'default'" />
        </div>
        <div class="column is-hidden-mobile">
          <h3 class="title is-3" v-translate>
            Mobile application
          </h3>
          <mobile-app-advertising class="box"/>

          <h3 class="title is-3" v-translate>
            Last forum topics
          </h3>

          <forum-widget wide class="box is-paddingless"/>
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
