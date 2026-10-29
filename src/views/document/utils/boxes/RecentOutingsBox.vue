<template>
  <div class="box no-print" v-if="!isDraftView && (showAddOutingButton || outings.length !== 0)">
    <div class="title is-2">
      <span v-if="['image', 'article'].includes(documentType)" v-translate>Associated outings</span>
      <span v-else v-translate>Last outings</span>
    </div>

    <div v-for="(outing, i) of outings" :key="i">
      <pretty-outing-link :outing="outing" />
    </div>

    <div
      v-if="(!hideSeeAllResultsButton && outings.length) || showAddOutingButton"
      class="has-text-centered add-section"
    >
      <router-link
        :to="{ name: 'outings', query: allOutingsQuery }"
        class="button is-primary"
        v-if="!hideSeeAllResultsButton && outings.length"
      >
        <span v-translate>show all</span>&nbsp;<span class="badge">{{ totalOutings }}</span>
      </router-link>
      <add-link v-if="showAddOutingButton" document-type="outing" :query="addOutingQuery" class="button is-primary">
        <span v-translate v-if="outings.length === 0">Add the first outing</span>
      </add-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useGlobalProperties } from '@/js/composables/global-properties';
import { useViewMode } from '@/js/composables/view-mode';
import { documentProperty, useDocumentType } from '@/js/properties';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const props = defineProps({
  ...documentProperty,
  hideSeeAllResultsButton: {
    type: Boolean,
    default: false,
  },
  includeEmptyOutings: {
    type: Boolean,
    default: false,
  },
});

const { $documentUtils } = useGlobalProperties();
const { documentType } = useDocumentType(props);
const { isDraftView } = useViewMode();

// the outings of a document, and for a waypoint the routes of the area: a page of the documents, and their total
type Page = { documents: C2cDocument[]; total: number };
const associations = computed(
  () => props.document.associations as { outings?: C2cDocument[]; recent_outings?: Page; all_routes?: Page }
);

const outings = computed(() => {
  const outings = associations.value.recent_outings?.documents || associations.value.outings || [];

  if (props.includeEmptyOutings) {
    return outings;
  } else {
    return outings.filter((outing) => outing.quality !== 'empty');
  }
});

const totalOutings = computed(() => associations.value.recent_outings?.total || outings.value.length);

const addOutingQuery = computed(() => {
  const query: Record<string, string | number | undefined> = {};

  if (documentType.value === 'waypoint') {
    const bbox = $documentUtils.getDocumentsBbox(associations.value.all_routes!.documents);
    query.initial_bbox = bbox?.join(',');
  } else if (documentType.value === 'route') {
    query[props.document.type!] = props.document.document_id;
  }

  return query;
});

const allOutingsQuery = computed(() => {
  const query: Record<string, number | undefined> = {};
  query[props.document.type!] = props.document.document_id;
  return query;
});

const showAddOutingButton = computed(() => {
  // if the document is a route, we can add an outing directly linked to the route
  if (documentType.value === 'route') {
    return true;
  }

  // if the document is a waypoint, and if it has associated route, then the outing form
  // will propose routes in the extent of the waypoint (see initial_bbox query above)
  if (documentType.value === 'waypoint' && associations.value.all_routes!.total !== 0) {
    return true;
  }

  return false;
});
</script>

<style scoped lang="scss">
.button {
  vertical-align: bottom;
  margin-left: 1rem;
}

.add-section {
  margin-top: 1.5rem;
}

.badge {
  @include button-badge-primary;
}
</style>
