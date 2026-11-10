<template>
  <div class="section documents-view">
    <html-header :title="$gettext('Printing') + ' - ' + getDocumentTypeTitle(documentType)" />
    <h1 class="title is-1 box" v-translate>Print a selection of documents</h1>
    <printing-options
      :documents="documents"
      :promises="promises"
      @set-page-breaks="pageBreaks = $event"
      @set-image-printing="includeImages = $event"
      @set-summary-visibility="summaryVisibility = $event"
    />
    <printing-summary
      v-if="summaryVisibility"
      :documents="documents"
      :document-type="documentType"
      @summary-click="scrollTo($event)"
    />
    <div :class="['documents-container', includeImages ? 'print-image' : '']">
      <div v-for="(doc, index) in promises" :key="index" class="column">
        <div v-if="pageBreaks && (index > 0 || summaryVisibility)" class="page-break" />
        <loading-notification :promise="doc.promise" />
        <component
          v-if="doc.promise.data"
          :is="documentViews[documentType]"
          :draft="doc.promise.data"
          :id="'toc-entry-' + index"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AxiosResponse } from 'axios';
import { computed, ref, watch, type Component } from 'vue';
import { useRoute } from 'vue-router';

import PrintingOptions from './utils/PrintingOptions.vue';
import PrintingSummary from './utils/PrintingSummary.vue';

import { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import { useGlobalProperties } from '@/js/composables/global-properties';
import concurrencyLimit from '@/js/concurrency-limit';
import constants from '@/js/constants';
import type Field from '@/js/constants/Field';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';
import AreaView from '@/views/document/AreaView.vue';
import ArticleView from '@/views/document/ArticleView.vue';
import BookView from '@/views/document/BookView.vue';
import ImageView from '@/views/document/ImageView.vue';
import MapView from '@/views/document/MapView.vue';
import OutingView from '@/views/document/OutingView.vue';
import ProfileView from '@/views/document/ProfileView.vue';
import RouteView from '@/views/document/RouteView.vue';
import WaypointView from '@/views/document/WaypointView.vue';
import XreportView from '@/views/document/XreportView.vue';

// Up to 100 documents per page: loading them all at once trips the API's per-IP rate limit.
// Shared across loads, so a route change while loading can't start a second batch in parallel.
const limit = concurrencyLimit(4);

const route = useRoute();
const { $gettext, $language } = useGlobalProperties();

// the view of each document type: <component :is> does not resolve the names of the imported components
const documentViews: Record<string, Component> = {
  area: AreaView,
  article: ArticleView,
  book: BookView,
  image: ImageView,
  map: MapView,
  outing: OutingView,
  profile: ProfileView,
  route: RouteView,
  waypoint: WaypointView,
  xreport: XreportView,
};

// a document of the page, loaded with its cooked locale
type Printed = {
  promise: ApiData;
  documentId: number;
  expectedLang: string;
  documentType: string;
  version: null;
  fields: Record<string, Field>;
};

const promise = ref<ApiData | null>(null);
const promises = ref<Printed[]>([]);
const pageBreaks = ref(false);
const includeImages = ref(false);
const summaryVisibility = ref(true);

const documentType = computed(() => String(route.name).slice(0, -'s-print'.length));

const documents = computed(() => promise.value?.data);

const service = () => c2c[documentType.value] as DocumentService;

function load() {
  const lang = String(route.params.lang ?? $language.current);

  const loading = service().getAll(route.query as Record<string, string>);
  promise.value = loading;
  loading.then(() => {
    promises.value = (loading.data!.documents as C2cDocument[]).map((doc) => ({
      promise: new ApiData(
        limit(
          () =>
            new Promise((resolve, reject) => {
              service().getCooked(doc.document_id!, lang).then(resolve, reject);
            })
        ) as Promise<AxiosResponse>
      ),
      documentId: doc.document_id!,
      expectedLang: lang,
      documentType: documentType.value,
      version: null,
      fields: constants.objectDefinitions[documentType.value].fields,
    }));
  });
}

// a new search, or another page
watch(() => route.fullPath, load, { immediate: true });

function getDocumentTypeTitle(documentType: string) {
  return $gettext(documentType + 's');
}

function scrollTo(name: string | number) {
  const el = document.querySelector('#toc-entry-' + name);
  if (el) {
    const docEl = document.documentElement;
    const docRect = docEl.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const y = elRect.top - docRect.top;
    window.scrollTo({ top: y - 50, behavior: 'smooth' }); // navbar height ...
  }
}
</script>

<style scoped>
.page-break {
  break-after: page;
}
</style>
