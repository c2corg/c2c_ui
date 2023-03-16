<template>
  <div class="box">
    <h4 class="title is-3">
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
        <div class="dashboard-list">
          <dashboard-outing-link v-for="outing of sortedOutings" :key="outing.document_id" :outing="outing" />
        </div>
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
</template>

<script>
import DashboardOutingLink from './DashboardOutingLink';

import c2c from '@/js/apis/c2c';

export default {
  name: 'DashboardOutingsList',

  components: {
    DashboardOutingLink,
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
    };
  },

  computed: {
    outings() {
      return this.outingsPromise?.data;
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
  },

  methods: {
    loadOutings() {
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
  border-bottom: solid #f93 2px;
}

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

.dashboard-list > a:nth-child(2n + 1) {
  background-color: #fbfaf6;
}
</style>
