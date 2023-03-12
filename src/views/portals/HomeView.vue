<template>
  <div class="section">
    <div class="columns">
      <div
        class="column is-12-mobile"
        :class="feed ? 'is-7-tablet is-7-desktop is-8-widescreen is-9-fullhd' : 'is-7 is-8-fullhd'"
      >
        <div class="box intro">
          <div class="feed-title">
            <span class="title is-4" :class="{ 'is-marginless': !visible }" v-translate
              >Bienvenue sur Camptocamp ! La communauté des sports de montagne</span
            >
          </div>
          <home-banner v-show="visible" />
        </div>
        <publi-widget v-if="$screen.isMobile" />
        <!--Display parameters-->
        <dropdown-button v-if="$screen.isMobile">
          <span slot="button" class="button parameters-button">
            <fa-icon icon="cogs" />
            <span>&nbsp;</span>
            <span v-translate>Paramètres d'affichage</span>
          </span>
          <!--Show intro text or not-->
          <a class="dropdown-item is-size-6" :class="{ 'is-active': visible }" @click="toogleProperty('visible')">
            <span class="is-nowrap item-icons">
              <fa-icon :icon="visible ? 'circle-check' : 'circle'" />
            </span>
            <span class="is-nowrap" v-translate>Afficher le texte de présentation</span>
          </a>
          <hr />
          <!--User preferences-->
          <a
            class="dropdown-item is-size-6"
            :class="{ 'is-active': isPersonal }"
            @click="toogleProperty('isPersonal')"
            v-if="$user.isLogged"
          >
            <span class="is-nowrap item-icons">
              <fa-icon :icon="isPersonal ? 'circle-check' : 'circle'" />
            </span>
            <span class="is-nowrap" v-translate>Load my preferences</span>
          </a>
          <hr v-if="$user.isLogged" />
          <!--Dashboard-->
          <a class="dropdown-item is-size-6" :class="{ 'is-active': !feed }" @click="toogleProperty('feed')">
            <span class="is-nowrap item-icons">
              <fa-icon icon="th-list" />
            </span>
            <span class="is-nowrap" v-translate>Tableau de bord</span>
          </a>
          <!--Feed-->
          <a class="dropdown-item is-size-6" :class="{ 'is-active': feed }" @click="toogleProperty('feed')">
            <span class="is-nowrap item-icons">
              <fa-icon icon="th-large" />
            </span>
            <span class="is-nowrap" v-translate>Activity feed</span>
          </a>
        </dropdown-button>
        <!--End Display parameters-->
        <div class="feed-view" v-if="feed">
          <feed-widget :type="isPersonal && $user.isLogged ? 'personal' : 'default'" hide-empty-documents />
        </div>
        <div v-if="!feed">
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
        <!--Display parameters-->
        <dropdown-button>
          <span slot="button" class="button parameters-button">
            <fa-icon icon="cogs" />
            <span>&nbsp;</span>
            <span v-translate>Paramètres d'affichage</span>
          </span>
          <!--Show intro text or not-->
          <a class="dropdown-item is-size-6" :class="{ 'is-active': visible }" @click="toogleProperty('visible')">
            <span class="is-nowrap item-icons">
              <fa-icon :icon="visible ? 'circle-check' : 'circle'" />
            </span>
            <span class="is-nowrap" v-translate>Afficher le texte de présentation</span>
          </a>
          <hr />
          <!--User preferences-->
          <a
            class="dropdown-item is-size-6"
            :class="{ 'is-active': isPersonal }"
            @click="toogleProperty('isPersonal')"
            v-if="$user.isLogged"
          >
            <span class="is-nowrap item-icons">
              <fa-icon :icon="isPersonal ? 'circle-check' : 'circle'" />
            </span>
            <span class="is-nowrap" v-translate>Load my preferences</span>
          </a>
          <hr v-if="$user.isLogged" />
          <!--Dashboard-->
          <a class="dropdown-item is-size-6" :class="{ 'is-active': !feed }" @click="toogleProperty('feed')">
            <span class="is-nowrap item-icons">
              <fa-icon icon="th-list" />
            </span>
            <span class="is-nowrap" v-translate>Tableau de bord</span>
          </a>
          <!--Feed-->
          <a class="dropdown-item is-size-6" :class="{ 'is-active': feed }" @click="toogleProperty('feed')">
            <span class="is-nowrap item-icons">
              <fa-icon icon="th-large" />
            </span>
            <span class="is-nowrap" v-translate>Activity feed</span>
          </a>
        </dropdown-button>
        <!--End Display parameters-->
        <publi-widget />
        <dashboard-images-gallery v-if="!feed" />
        <useful-links />
        <forum-widget :message-count="20" />
        <dashboard-articles-list v-if="!feed" />
      </div>
    </div>
  </div>
</template>

<script>
import HomeBanner from './HomeBanner';
import DashboardArticlesList from './utils/DashboardArticlesList';
import DashboardImagesGallery from './utils/DashboardImagesGallery';
import DashboardOutingsList from './utils/DashboardOutingsList';
import DashboardRoutesList from './utils/DashboardRoutesList';
import ForumWidget from './utils/ForumWidget';
import PubliWidget from './utils/PubliWidget';
import UsefulLinks from './utils/UsefulLinks';

import FeedWidget from '@/components/feed-widget/FeedWidget';

export default {
  name: 'HomeView',

  components: {
    HomeBanner,
    DashboardArticlesList,
    DashboardImagesGallery,
    DashboardOutingsList,
    DashboardRoutesList,
    ForumWidget,
    PubliWidget,
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
    toogleProperty(property) {
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
@media screen and (min-width: $tablet) {
  .feed-view {
    margin-top: 1.5rem;
  }
}
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
  display: flex;

  span:first-child {
    flex-grow: 1;
  }
}

h4 {
  padding-bottom: 0.7rem !important;
  margin-bottom: 0.7rem !important;
  border-bottom: 1px solid #ddd;
}

.intro {
  margin-bottom: 1rem;
}

.parameters-button {
  margin-bottom: 0.5rem;
  border: solid 1px #f93 !important;
  border-radius: 0.5rem;
}

a.dropdown-item.is-active {
  background-color: #f93;
}
</style>
<style lang="scss">
h4 > a,
h6 > a,
.outing-date-header > a,
li > a {
  color: #4a4a4a !important;
}

h4 > a:hover,
h6 > a:hover,
.outing-date-header > a:hover {
  color: #337ab7 !important;
}

.outing-date-header > a:hover {
  color: #337ab7 !important;
}
.dashboard-list > a:nth-child(2n + 1) {
  background-color: #fbfaf6;
}
</style>
