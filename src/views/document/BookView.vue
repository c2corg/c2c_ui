<template>
  <div class="section has-background-white-print">
    <loading-notification :promise="promise" />
    <masked-document-version-info
      v-if="document === null"
      :version="version"
      :document-type="documentType"
    ></masked-document-version-info>
    <document-view-header v-if="document" :document="document" :version="version" />
    <div v-if="document" class="columns is-block-print">
      <div class="column-pub">
        <div class="box">
          <activities-field :document="document" />
          <field-view :document="document" :field="fields.author" />
          <field-view :document="document" :field="fields.book_types" />
          <field-view :document="document" :field="fields.editor" />
          <field-view :document="document" :field="fields.langs" />
          <field-view :document="document" :field="fields.isbn" />
          <field-view :document="document" :field="fields.nb_pages" />
          <field-view :document="document" :field="fields.publication_date" />
          <field-view :document="document" :field="fields.url" style="overflow: hidden" />
        </div>

        <ad-widget-square />
        <map-box v-if="document.associations.waypoints.length" :document="document" />
        <tool-box :document="document" v-if="!$screen.isMobile" />
      </div>

      <div class="column">
        <div class="box">
          <markdown-section :document="document" :field="fields.summary" />
          <markdown-section :document="document" :field="fields.description" hide-title />
          <div style="clear: both" />
        </div>

        <routes-box :document="document" hide-buttons />

        <images-box :document="document" />

        <tool-box :document="document" v-if="$screen.isMobile" />

        <comments-box :document="document" />
      </div>
      <document-print-license :document="document" />
    </div>
  </div>
</template>

<script>
import MaskedDocumentVersionInfo from './utils/MaskedDocumentVersionInfo';
import documentViewMixin from './utils/document-view-mixin';

import AdWidgetSquare from '@/views/portals/utils/AdWidgetSquare';

export default {
  components: {
    MaskedDocumentVersionInfo,
    AdWidgetSquare,
  },

  mixins: [documentViewMixin],
};
</script>
