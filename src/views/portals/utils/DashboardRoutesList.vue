<template>
  <div class="box">
    <h4 class="title is-3">
      <router-link to="routes">
        <icon-route />
        {{ $filters.uppercaseFirstLetter($gettext('routes')) }}
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

<script setup lang="ts">
import { computed, ref } from 'vue';

import DashboardRouteLink from './DashboardRouteLink.vue';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const routesPromise = ref<ApiData<{ documents: C2cDocument[] }>>(
  (c2c.route as DocumentService).getAll({
    limit: 5,
    qa: 'draft,great',
  })
);

const routes = computed(() => routesPromise.value.data);
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
