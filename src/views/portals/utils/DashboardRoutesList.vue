<template>
  <div class="box">
    <h4 class="title is-3">
      <router-link to="routes">
        <icon-route />
        {{ $gettext('routes') | uppercaseFirstLetter }}
      </router-link>
    </h4>
    <loading-notification :promise="routesPromise" />
    <div v-if="routes" class="dashboard-list">
      <dashboard-route-link v-for="route of routes.documents" :key="route.document_id" :route="route" />
    </div>
    <hr />
    <h6 class="title is-6 has-text-centered">
      <router-link to="routes">
        <span v-translate>See more</span>
      </router-link>
    </h6>
  </div>
</template>

<script>
import DashboardRouteLink from './DashboardRouteLink';

import c2c from '@/js/apis/c2c';

export default {
  name: 'DashboardRoutesList',

  components: {
    DashboardRouteLink,
  },

  data() {
    return {
      routesPromise: null,
    };
  },

  computed: {
    routes() {
      return this.routesPromise?.data;
    },
  },

  created(query = {}) {
    query.limit = 5;
    query.qa = 'draft,great';
    this.routesPromise = c2c.route.getAll(query);
  },
};
</script>

<style scoped lang="scss">
h4 > a,
h6 > a {
  color: $color-text !important;
}

h4 > a:hover,
h6 > a:hover {
  color: $color-link !important;
}

.dashboard-list > a:nth-child(2n + 1) {
  background-color: $body-background-color;
}
</style>
