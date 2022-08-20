<template>
  <div>
    <html-header :title="$gettext('Home')" />
    <!-- Présentation de l'association, info qu'on met en avant -->
    <div class="section">
      <div class="feed-title">
        Bienvenue sur Camptocamp !
      </div>
      <div class="columns">
        <div class="column">
          <home-banner v-if="!$user.isLogged" />
        </div>
        <div class="column">
          Quoi de neuf côté association
        </div>
      </div>
    </div>
    <!-- Partie dashboard/feed -->
    <!-- Swicht dashboard/feed -->
    <div class="section">
      <div class="feed-title">
        <span @click="toogleProperty('listMode')" class="is-size-3 has-text-weight-semibold has-cursor-pointer">
          <span :class="listMode ? 'has-text-primary' : ''" :title="$gettext('Dashboard')" v-translate>Dashboard</span> /
          <span :class="!listMode ? 'has-text-primary' : ''" :title="$gettext('Feed')" v-translate>Activity feed</span>
        </span>
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
            Activer mes préférences
          </label>
        </div>
      </div>
    </div>
    <!-- Feed -->
    <div class="section feed-view" v-if="!listMode">
      <div class="columns">
        <div class="column is-12-mobile is-7-tablet is-7-desktop is-8-widescreen is-9-fullhd">
          <feed-widget :type="isPersonal && $user.isLogged ? 'personal' : 'default'" hide-empty-documents />
        </div>
        <div
          v-if="!$screen.isMobile"
          class="column is-hidden-mobile is-5-tablet is-5-desktop is-4-widescreen is-3-fullhd box"
        >
          <h3 class="title is-4" v-translate>Last forum topics</h3>
          <forum-widget :message-count="20" />
        </div>
      </div>
    </div>
    <!-- Dashboard -->
    <div class="section">
      <div class="columns">
        <div class="column is-7">
          <!-- Sorties -->
          <div v-if="listMode" class="box">
            <h4 class="title is-2">
              <router-link to="outings">
                <icon-outing />
                {{ $gettext('outings') | uppercaseFirstLetter }}
              </router-link>
            </h4>
            <loading-notification :promise="outingsPromise" />
            <div v-if="outingsByDate != null">
              <div v-for="(sortedOutings, date) of outingsByDate" :key="date">
                <h4 class="outing-date-header has-text-centered is-italic has-text-weight-bold">
                  <router-link :to="{ name: 'outings', query: { date: `${date},${date}` } }">
                    {{ $dateUtils.toLocalizedString(date, 'PPPP') | uppercaseFirstLetter }}
                  </router-link>
                </h4>
                <dashboard-outing-link v-for="outing of sortedOutings" :key="outing.document_id" :outing="outing" />
              </div>
            </div>
          </div>
        </div>
        <div class="column is-5">
          <!-- Images -->
          <div class="box">
            <h4 class="title is-3">
              <router-link to="images">
                <icon-image />
                {{ $gettext('images') | uppercaseFirstLetter }}
              </router-link>
            </h4>
            <div class="images-container">
              <loading-notification :promise="imagesPromise" />
              <gallery v-if="images != null" :images="images.documents" />
            </div>
          </div>
          <!-- Liens utiles -->
          <div class="box">
            <h4 class="title is-3">Liens utiles</h4>
            <div>
              <ul>
                <li>
                  <router-link :to="{ name: 'article', params: { id: 107228 } }" v-translate>Préparer sa course</router-link>
                </li>
                <li>
                  <router-link :to="{ name: 'yeti' }" v-translate>Yeti : un outil pour évaluer le risque d’avalanche</router-link>
                </li>
                <li>
                  <a href="https://www.metaskirando.ovh/" title="Metaskirando">Metaskirando : sorties de ski de rando en Europe</a>
                </li>
                <li>
                  <router-link :to="{ name: 'serac' }" v-translate>SERAC : accidents et incidents en montagne</router-link>
                </li>
              </ul>
              <ul>
                <li>
                  <router-link :to="{ name: 'article', params: { id: 106726 } }" v-translate>Camptocamp Association</router-link>
                </li>
                <li>
                  <a href="https://www.helloasso.com/associations/camptocamp-association/" title="Helloasso">Faire un don ou adhérer</a>
                </li>
              </ul>
            </div>
          </div>
          <!-- Forum -->
          <div class="box">
            <h4 class="title is-3">
              <router-link to="forum">
                <icon-forum />
                {{ $gettext('Forum') }}
              </router-link>
            </h4>
            <forum-widget :message-count="20" />
          </div>
          <!-- Itinéraires -->
          <div class="box">
            <h4 class="title is-3">
              <router-link to="routes">
                <icon-route />
                {{ $gettext('routes') | uppercaseFirstLetter }}
              </router-link>
            </h4>
            <loading-notification :promise="routesPromise" />
            <div v-if="routes != null">
              <dashboard-route-link v-for="route of routes.documents" :key="route.document_id" :route="route" />
            </div>
          </div>
          <!-- Articles -->
          <div class="box">
            <h4 class="title is-3">
              <router-link to="articles">
                <icon-article />
                {{ $gettext('articles') | uppercaseFirstLetter }}
              </router-link>
            </h4>
            <loading-notification :promise="articlesPromise" />
            <div v-if="articles != null">
              <dashboard-article-link
                v-for="article of articles.documents"
                :key="article.document_id"
                :article="article"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import HomeBanner from './HomeBanner';
import DashboardArticleLink from './utils/DashboardArticleLink';
import DashboardOutingLink from './utils/DashboardOutingLink';
import DashboardRouteLink from './utils/DashboardRouteLink';
import ForumWidget from './utils/ForumWidget';

import FeedWidget from '@/components/feed-widget/FeedWidget';
import Gallery from '@/components/gallery/Gallery';
import c2c from '@/js/apis/c2c';

export default {
  name: 'FeedView',

  components: {
    HomeBanner,
    FeedWidget,
    DashboardArticleLink,
    DashboardOutingLink,
    DashboardRouteLink,
    ForumWidget,
    Gallery,
    },

  data() {
    return {
      isPersonal: false,
      enableUserPreferences: this.$localStorage.get('enableUserPreferences', false),
      outingsPromise: null,
      routesPromise: null,
      articlesPromise: null,
      imagesPromise: null,
      listMode: true,
    };
  },

  computed: {
    outings() {
      return this.outingsPromise.data;
    },

    images() {
      return this.imagesPromise.data;
    },

    routes() {
      return this.routesPromise.data;
    },

    articles() {
      return this.articlesPromise.data;
    },

    outingsByDate() {
      if (!this.outings) {
        return null;
      }

      const result = {};

      for (const outing of this.outings.documents) {
        result[outing.date_end] = result[outing.date_end] ?? [];
        result[outing.date_end].push(outing);
      }

      return result;
    },
  },

  watch: {
    enableUserPreferences: 'loadOutings',
  },

  created() {
    this.isPersonal = this.$localStorage.get('isPersonal', false);
    this.loadOutings();
    this.routesPromise = c2c.route.getAll({ limit: 5 });
    this.articlesPromise = c2c.article.getAll({ limit: 5 });
    this.imagesPromise = c2c.image.getAll();
  },

  methods: {
    saveIsPersonalState() {
      this.$localStorage.set('isPersonal', this.isPersonal);
    },

    loadOutings() {
      this.$localStorage.set('enableUserPreferences', this.enableUserPreferences);

      if (!this.enableUserPreferences || !this.$user.isLogged) {
        this.loadOutingsWithQuery();
      } else {
        this.outingsPromise = this.getQueryFromUserPreferences('outing').then(this.loadOutingsWithQuery);
      }
    },

    loadOutingsWithQuery(query = {}) {
      query.limit = 40;
      this.outingsPromise = c2c.outing.getAll(query);
    },

    getQueryFromUserPreferences(documentType) {
      return new Promise(function (resolve) {
        c2c.userProfile.preferences.get().then((result) => {
          const preferences = result.data;
          const query = {};

          if (['outing', 'route', 'image', 'xreport', 'books', 'articles'].includes(documentType)) {
            const activities = preferences.activities.join(',');
            query.act = activities === '' ? undefined : activities;
          }

          if (['outing', 'route', 'image', 'xreport', 'waypoint'].includes(documentType)) {
            const areas = preferences.areas.map((area) => area.document_id).join(',');
            query.a = areas === '' ? undefined : areas;
            query.bbox = undefined;
          }

          resolve(query);
        });
      });
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

.images-container {
  min-height: 200px;
}

h4 {
  padding-bottom: 0.7rem !important;
  margin-bottom: 0.7rem !important;
  border-bottom: 1px solid #ddd;
}

.outing-date-header {
  margin-top: 1rem;
}
</style>
