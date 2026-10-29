<template>
  <div class="section content">
    <html-header :title="$gettext('Recent changes')" />

    <div clas="links">
      <association-history-link :user-id="userId" v-translate>Associations history</association-history-link>
    </div>

    <table v-infinite-scroll="{ load, disabled: disableInfiniteSCroll, distance: 100 }">
      <tr>
        <th v-translate translate-context="modification date">Modified the</th>
        <th v-translate>contributor</th>
        <th v-translate>Links</th>
        <th />
        <th>
          <span v-translate>title</span>
          :
          <span v-translate>comment</span>
        </th>
      </tr>
      <tr v-for="(change, index) of feed" :key="index">
        <td>
          <version-link
            :document-type="change.document.documentType"
            :id="change.document.document_id"
            :version="change.version_id"
            :lang="change.lang"
          >
            {{ $dateUtils.toTechnicalString(change.written_at) }}
          </version-link>
        </td>
        <td>
          <contributor-link :contributor="change.user" />
        </td>
        <td>
          <document-link :document="change.document" :lang="change.lang"> last </document-link>

          <diff-link
            :document-type="change.document.documentType"
            :id="change.document.document_id"
            :lang="change.lang"
            version-from="prev"
            :version-to="change.version_id"
          />

          <history-link :document="change.document" :lang="change.lang" />
        </td>
        <td>
          <marker-quality :quality="change.document.quality" />
          {{ change.lang }}
        </td>
        <td>
          <colored-icon-document :document-type="change.document.documentType" />
          {{ change.document.title }}
          :
          <span v-if="change.comment">
            {{ change.comment }}
          </span>
          <span v-else v-translate>empty comment</span>
        </td>
      </tr>
    </table>

    <loading-notification :promise="promise" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import ColoredIconDocument from './utils/ColoredIconDocument.vue';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { useNoRobots } from '@/js/composables/head';
import infiniteScroll from '@/js/directives/infinite-scroll';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const vInfiniteScroll = infiniteScroll;

useNoRobots();

const route = useRoute();
const router = useRouter();
const { $documentUtils } = useGlobalProperties();

// a change of the feed (version, author, comment...), with the type of its document
type Change = { document: C2cDocument & { type: string; documentType: string }; [property: string]: any };

const promise = ref<ApiData | { loading?: boolean; data?: undefined }>({});
const feed = ref<Change[]>([]);
const endOfFeed = ref(false);

const userId = computed(() => (route.query.u ? parseInt(String(route.query.u)) : null));
const loading = computed(() => (promise.value ? Boolean(promise.value.loading) : false));
const disableInfiniteSCroll = computed(() => loading.value || endOfFeed.value);

const nextQuery = computed(() => {
  if (!promise.value.data) {
    return route.query;
  }

  return Object.assign({}, route.query, { token: promise.value.data.pagination_token });
});

function initialize() {
  feed.value = [];
  endOfFeed.value = false;

  if (route.hash) {
    // keep compatible with v6 AngularJs hacks...
    router.replace(route.fullPath.replace('#', '?'));
    // route watcher will call load
    return;
  }

  load();
}

function load() {
  if (promise.value && promise.value.loading) {
    return;
  }

  if (endOfFeed.value) {
    return;
  }

  const request = c2c.getRecentChanges(nextQuery.value as Record<string, string>);
  promise.value = request;
  request.then(() => onLoad(request));
}

function onLoad(request: ApiData) {
  for (const change of request.data!.feed as Change[]) {
    change.document.documentType = $documentUtils.getDocumentType(change.document.type);
    feed.value.push(change);
  }

  endOfFeed.value = request.data!.feed.length === 0;
}

watch(() => route.fullPath, initialize, { immediate: true });
</script>

<style scoped lang="scss">
td {
  white-space: nowrap;
}

td:last-child {
  width: 100%;
  white-space: normal;
}

td:last-child > span:last-child,
th:last-child > span:last-child {
  font-style: italic;
}
</style>
