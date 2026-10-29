<template>
  <div>
    <div v-for="(waypointsList, i) of waypointsLists" :key="i" class="associations-list">
      <div class="title">
        {{ $filters.uppercaseFirstLetter(waypointsList.title) }}
      </div>
      <document-link
        v-for="waypoint of waypointsList.waypoints"
        :key="waypoint.document_id"
        :document="waypoint"
        class="columns is-mobile has-hover-background is-marginless is-vcentered"
      >
        <div class="column is-narrow is-paddingless">
          <icon-waypoint-type :waypoint-type="waypoint.waypoint_type" fixed-width class="icon-link" />
        </div>
        <div class="column is-paddingless">
          <document-title :document="waypoint" />
        </div>
        <div class="column is-narrow has-text-grey is-paddingless is-size-7">{{ waypoint.elevation }}&nbsp;m</div>
      </document-link>
      <hr />
    </div>

    <!-- books -->
    <div v-if="books.length != 0" class="associations-list">
      <div class="title">
        {{ $filters.uppercaseFirstLetter($gettext('books')) }}
      </div>
      <div v-for="book of books" :key="book.document_id" class="is-ellipsed">
        <document-link :document="book">
          <icon-book fixed-width class="icon-link" />
          <document-title :document="book" />
        </document-link>
      </div>
      <hr />
    </div>

    <!-- articles -->
    <div v-if="articles.length != 0" class="associations-list">
      <div class="title">
        {{ $filters.uppercaseFirstLetter($gettext('articles')) }}
      </div>
      <div v-for="article of articles" :key="article.document_id" class="is-ellipsed">
        <document-link :document="article">
          <icon-article fixed-width class="icon-link" />
          <document-title :document="article" />
        </document-link>
      </div>
      <hr />
    </div>

    <!-- xreports -->
    <div v-if="associations.xreports && associations.xreports.length != 0" class="associations-list">
      <div class="title">
        {{ $filters.uppercaseFirstLetter($gettext('xreports')) }}
      </div>
      <div v-for="xreport of associations.xreports" :key="xreport.document_id" class="is-ellipsed">
        <document-link :document="xreport">
          <icon-xreport fixed-width class="icon-link" />
          <document-title :document="xreport" />
        </document-link>
      </div>
      <hr />
    </div>

    <!-- outings -->
    <div
      v-if="documentType === 'xreport' && associations.outings && associations.outings.length != 0"
      class="associations-list"
    >
      <div class="title">
        {{ $filters.uppercaseFirstLetter($gettext('outings')) }}
      </div>
      <div v-for="outing of associations.outings" :key="outing.document_id" class="is-ellipsed">
        <document-link :document="outing">
          <icon-outing fixed-width class="icon-link" />
          <document-title :document="outing" uppercase-first-letter />
        </document-link>
      </div>
      <hr />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useGlobalProperties } from '@/js/composables/global-properties';
import { documentProperty, useDocumentType } from '@/js/properties';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const props = defineProps({ ...documentProperty });

const { $gettext } = useGlobalProperties();
const { documentType } = useDocumentType(props);

const associations = computed(() => props.document.associations ?? {});

const waypointsLists = computed(() => {
  const result: { title: string; waypoints: C2cDocument[] }[] = [];

  const push = function (title: string, waypoints?: C2cDocument[]) {
    if (waypoints && waypoints.length !== 0) {
      result.push({ title, waypoints });
    }
  };

  push($gettext('waypoints'), associations.value.waypoints);
  push($gettext('waypoint_children'), associations.value.waypoint_children);

  return result;
});

// the books, the most recent (highest id) first
function compare(left: C2cDocument, right: C2cDocument) {
  return right.document_id! - left.document_id!;
}

// computed: the view keeps this box when it shows another document
const books = computed(() => [...(associations.value.books ?? [])].sort(compare));
const articles = computed(() => associations.value.articles ?? []);
</script>

<style scoped lang="scss">
.title {
  margin-bottom: 0.2rem !important;
}

.associations-list:not(:last-child) {
  margin-bottom: 1rem;
}

.icon-link,
.icon-link:hover {
  color: $dark;
  margin-right: 3px;
}
</style>
