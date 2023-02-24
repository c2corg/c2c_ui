<template>
  <div class="columns">
    <div class="column is-7">
      <!-- Sorties -->
      <div class="box">
        <h4 class="title is-3">
          <router-link to="outings">
            <icon-outing />
            {{ $gettext('outings') | uppercaseFirstLetter }}
          </router-link>
        </h4>
        <loading-notification :promise="outingsPromise" />
        <div v-if="outingsByDate != null">
          <div v-for="(sortedOutings, date) of outingsByDate" :key="date">
            <p class="outing-date-header is-4 is-italic has-text-weight-bold">
              <router-link :to="{ name: 'outings', query: { date: `${date},${date}` } }">
                {{ $dateUtils.toLocalizedString(date, '@1') | uppercaseFirstLetter }}
              </router-link>
            </p>
            <dashboard-outing-link v-for="outing of sortedOutings" :key="outing.document_id" :outing="outing" />
          </div>
        </div>
        <hr />
        <h6 class="title is-6 has-text-centered">
          <router-link
            :to="{
              name: 'outings',
              query: {
                qa: 'draft,great',
                bbox: '-431698,3115462,1931123,8442818',
                offset: 0,
                limit: 100,
              },
            }"
          >
            <span v-translate>Voir plus</span>
          </router-link>
        </h6>
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
        <hr />
        <h6 class="title is-6 has-text-centered">
          <router-link to="routes">
            <span v-translate>Voir plus</span>
          </router-link>
        </h6>
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
        <hr />
        <h6 class="title is-6 has-text-centered">
          <router-link to="images">
            <span v-translate>Voir plus</span>
          </router-link>
        </h6>
      </div>
      <useful-links />
      <!-- Forum -->
      <div class="box">
        <h4 class="title is-3">
          <router-link to="forum">
            <icon-forum />
            {{ $gettext('Forum') }}
          </router-link>
        </h4>
        <forum-widget :message-count="20" />
        <hr />
        <h6 class="title is-6 has-text-centered">
          <router-link to="forum">
            <span v-translate>Voir plus</span>
          </router-link>
        </h6>
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
          <ul>
            <dashboard-article-link
              v-for="article of articles.documents"
              :key="article.document_id"
              :article="article"
            />
          </ul>
        </div>
        <hr />
        <h6 class="title is-6 has-text-centered">
          <router-link to="articles">
            <span v-translate>Voir plus</span>
          </router-link>
        </h6>
      </div>
    </div>
  </div>
</template>

<script>
import DashboardArticleLink from './utils/DashboardArticleLink';
import DashboardOutingLink from './utils/DashboardOutingLink';
import DashboardRouteLink from './utils/DashboardRouteLink';
import ForumWidget from './utils/ForumWidget';
import UsefulLinks from './utils/UsefulLinks';

import Gallery from '@/components/gallery/Gallery';
import c2c from '@/js/apis/c2c';

export default {
  name: 'DashboardView',

  components: {
    DashboardArticleLink,
    DashboardOutingLink,
    DashboardRouteLink,
    UsefulLinks,
    ForumWidget,
    Gallery,
  },
  props: {
    isPersonal: {
      type: Boolean,
      required: true,
    },
  },

  data() {
    return {
      outingsPromise: null,
      routesPromise: null,
      articlesPromise: null,
      imagesPromise: null,
    };
  },

  computed: {
    outings() {
      return this.outingsPromise?.data;
    },

    images() {
      return this.imagesPromise?.data;
    },

    routes() {
      return this.routesPromise?.data;
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
        if (outing.quality !== 'empty') {
          result[outing.date_end] = result[outing.date_end] ?? [];
          result[outing.date_end].push(outing);
        }
      }

      return result;
    },
  },

  watch: {
    isPersonal: 'loadOutings',
  },

  created() {
    this.loadOutings();
    this.routesPromise = c2c.route.getAll({ limit: 5 });
    this.articlesPromise = c2c.article.getAll({ limit: 5 });
    this.imagesPromise = c2c.image.getAll();
  },

  methods: {
    loadOutings() {
      //this.$localStorage.set('isPersonal', this.isPersonal);

      if (!this.isPersonal || !this.$user.isLogged) {
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
  },
};
</script>

<style scoped lang="scss">
.outing-date-header {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.images-container {
  min-height: 200px;
}

ul {
  list-style-type: disc !important;
  padding-left: 12px;
}
</style>
