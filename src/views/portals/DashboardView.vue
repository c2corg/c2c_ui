<template>
  <div class="section">
    <html-header title="Dashboard" />
    <div class="box">
      <h3 class="title is-3">
        <router-link to="images">
          <icon-image />
          {{ $gettext('images') | uppercaseFirstLetter }}
        </router-link>
      </h3>
      <div class="images-container">
        <loading-notification :promise="imagesPromise" />
        <gallery v-if="images != null" :images="images.documents" />
      </div>
    </div>

    <div class="columns">
      <div class="column is-7">
        <div class="box">
          <span v-if="$user.isLogged" class="is-pulled-right is-size-4">
            <router-link to="preferences" class="has-text-normal" :title="$gettext('My preferences')">
              <fa-icon icon="gears" />
            </router-link>

            <span :title="enableUserPreferences ? $gettext('Personal feed on') : $gettext('Personal feed off')">
              <fa-icon
                icon="star"
                class="has-cursor-pointer"
                :class="{ 'has-text-primary': enableUserPreferences }"
                @click="enableUserPreferences = !enableUserPreferences"
              />
            </span>
          </span>
          <h3 class="title is-2">
            <router-link to="outings">
              <icon-outing />
              {{ $gettext('outings') | uppercaseFirstLetter }}
            </router-link>
          </h3>
          <loading-notification :promise="outingsPromise" />
          <div v-if="outingsByDate != null">
            <div v-for="(sortedOutings, date) of outingsByDate" :key="date">
              <h4 class="outing-date-header has-text-centered is-italic has-text-weight-bold">
                <router-link :to="{ name: 'outings', query: { date: `${date},${date}` } }">
                  {{ $dateUtils.toLocalizedString(date, '@1') | uppercaseFirstLetter }}
                </router-link>
              </h4>
              <dashboard-outing-link v-for="outing of sortedOutings" :key="outing.document_id" :outing="outing" />
            </div>
          </div>
        </div>
      </div>

      <div class="column is-5">
        <div class="box">
          <h3 class="title is-3">
            <router-link to="forum">
              <icon-forum />
              {{ $gettext('Forum') }}
            </router-link>
          </h3>
          <forum-widget :message-count="20" />
        </div>

        <div class="box">
          <h3 class="title is-3">
            <router-link to="routes">
              <icon-route />
              {{ $gettext('routes') | uppercaseFirstLetter }}
            </router-link>
          </h3>
          <loading-notification :promise="routesPromise" />
          <div v-if="routes != null">
            <dashboard-route-link v-for="route of routes.documents" :key="route.document_id" :route="route" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import DashboardOutingLink from './utils/DashboardOutingLink';
import DashboardRouteLink from './utils/DashboardRouteLink';
import ForumWidget from './utils/ForumWidget';

import Gallery from '@/components/gallery/Gallery';
import c2c from '@/js/apis/c2c';

export default {
  name: 'DashboardView',

  components: {
    DashboardOutingLink,
    DashboardRouteLink,
    ForumWidget,
    Gallery,
  },

  data() {
    return {
      enableUserPreferences: this.$localStorage.get('enableUserPreferences', false),
      outingsPromise: null,
      routesPromise: null,
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
    this.loadOutings();
    this.routesPromise = c2c.route.getAll({ limit: 10 });
    this.imagesPromise = c2c.image.getAll();
  },

  methods: {
    loadOutings() {
      this.$localStorage.set('enableUserPreferences', this.enableUserPreferences);

      if (!this.enableUserPreferences || !this.$user.isLogged) {
        this.loadOutingsWithQuery();
      } else {
        this.outingsPromise = this.getQueryFromUserPreferences('outing').then(this.loadOutingsWithQuery);
      }
    },

    loadOutingsWithQuery(query = {}) {
      query.limit = 30;
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

<style scoped>
.images-container {
  min-height: 200px;
}

h3 {
  padding-bottom: 0.7rem !important;
  margin-bottom: 0.7rem !important;
  border-bottom: 1px solid #ddd;
}

.outing-date-header {
  margin-top: 1.5rem;
}
</style>
