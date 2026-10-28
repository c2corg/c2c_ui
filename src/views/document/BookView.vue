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
      <div class="column is-3">
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

        <map-box v-if="document.associations!.waypoints.length" :document="document" />

        <tool-box :document="document" v-if="!$screen.isMobile" />
      </div>

      <div class="column is-9">
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

<script setup lang="ts">
import DocumentPrintLicense from './utils/DocumentPrintLicense.vue';
import DocumentViewHeader from './utils/DocumentViewHeader.vue';
import MaskedDocumentVersionInfo from './utils/MaskedDocumentVersionInfo.vue';
import CommentsBox from './utils/boxes/CommentsBox.vue';
import ImagesBox from './utils/boxes/ImagesBox.vue';
import MapBox from './utils/boxes/MapBox.vue';
import RoutesBox from './utils/boxes/RoutesBox.vue';
import ToolBox from './utils/boxes/ToolBox.vue';
import { documentViewProps, useDocumentView } from './utils/document-view';
import ActivitiesField from './utils/field-viewers/ActivitiesField.vue';
import FieldView from './utils/field-viewers/FieldView.vue';
import MarkdownSection from './utils/field-viewers/MarkdownSection.vue';

const props = defineProps(documentViewProps);

const { promise, documentType, fields, document, version } = useDocumentView(props);
</script>
