<template>
  <div class="box">
    <h4 class="title is-3">
      <router-link to="routes">
        <icon-route />
        {{ $gettext('routes') | uppercaseFirstLetter }}
      </router-link>
    </h4>
    <loading-notification :promise="routesPromise" />
    <div v-if="routes != null" class="dashboard-list">
      <dashboard-route-link v-for="route of routes.documents" :key="route.document_id" :route="route" />
    </div>
    <hr />
    <h6 class="title is-6 has-text-centered">
      <router-link to="routes">
        <span v-translate>Voir plus</span>
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
  created() {
    this.routesPromise = c2c.route.getAll({ limit: 5 });
  },
};
</script>
<style scoped lang="scss"></style>
