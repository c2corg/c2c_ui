<template>
  <div class="section documents-view">
    <html-header :title="'Printing - ' + getDocumentTypeTitle(documentType)" />
    <h1 class="title is-1 box">Print a selection of documents</h1>
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
          :is="documentType + '-view'"
          :draft="doc.promise.data"
          :id="'toc-entry-' + index"
        />
      </div>
    </div>
  </div>
</template>

<script>
import PrintingOptions from './utils/PrintingOptions';
import PrintingSummary from './utils/PrintingSummary';

import c2c from '@/js/apis/c2c';
import constants from '@/js/constants';
import AreaView from '@/views/document/AreaView';
import ArticleView from '@/views/document/ArticleView';
import BookView from '@/views/document/BookView';
import ImageView from '@/views/document/ImageView';
import MapView from '@/views/document/MapView';
import OutingView from '@/views/document/OutingView';
import ProfileView from '@/views/document/ProfileView';
import RouteView from '@/views/document/RouteView';
import WaypointView from '@/views/document/WaypointView';
import XreportView from '@/views/document/XreportView';

export default {
  name: 'DocumentsPrintingView',

  components: {
    AreaView,
    ArticleView,
    BookView,
    ImageView,
    MapView,
    OutingView,
    PrintingOptions,
    PrintingSummary,
    ProfileView,
    RouteView,
    WaypointView,
    XreportView,
  },

  data() {
    return {
      promise: null,
      promises: [],
      pageBreaks: false,
      includeImages: false,
      summaryVisibility: true,
    };
  },

  computed: {
    documentType() {
      return this.$route.name.slice(0, -'s-print'.length);
    },
    documents() {
      return this.promise.data;
    },
  },

  watch: {
    $route: {
      handler: 'load',
      immediate: true,
    },
  },

  methods: {
    load() {
      this.promise = c2c[this.documentType].getAll(this.$route.query).then(() => {
        this.promises = this.promise.data.documents.map((doc) => ({
          promise: c2c[this.documentType].getCooked(
            doc.document_id,
            this.$route.params.lang ?? this.$language.current
          ),
          documentId: doc.document_id,
          expectedLang: this.$route.params.lang ?? this.$language.current,
          documentType: this.documentType,
          version: null,
          fields: constants.objectDefinitions[this.documentType].fields,
        }));
      });
    },

    getDocumentTypeTitle(documentType) {
      return this.$gettext(documentType + 's');
    },

    scrollTo(name) {
      const el = document.querySelector("#toc-entry-"+name);
      if (el) {
        const docEl = document.documentElement;
        const docRect = docEl.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const y = elRect.top - docRect.top;
        window.scrollTo({ top: y - 50, behavior: 'smooth' }); // navbar height ...
      }
    },

  },
};
</script>

<style scoped>
.page-break {
  page-break-after: always;
}
</style>
