<template>
  <div class="section has-background-white-print">
    <loading-notification :promise="promise" />
    <masked-document-version-info
      v-if="document === null"
      :version="version"
      :document-type="documentType"
    ></masked-document-version-info>
    <document-view-header v-if="document" :document="document" :version="version" />
    <div v-if="document">
      <div class="box">
        <div class="columns">
          <div class="column is-3">
            <field-view :document="document" :field="fields.editor" />
          </div>
          <div class="column is-3">
            <field-view :document="document" :field="fields.code" />
          </div>
          <div class="column is-3">
            <field-view :document="document" :field="fields.scale" />
          </div>
        </div>
      </div>

      <markdown-section :document="document" :field="fields.summary" />

      <markdown-section :document="document" :field="fields.description" hide-title />

      <comments-box :document="document" />
    </div>
  </div>
</template>

<script setup lang="ts">
import DocumentViewHeader from './utils/DocumentViewHeader.vue';
import MaskedDocumentVersionInfo from './utils/MaskedDocumentVersionInfo.vue';
import CommentsBox from './utils/boxes/CommentsBox.vue';
import { documentViewProps, useDocumentView } from './utils/document-view';
import FieldView from './utils/field-viewers/FieldView.vue';
import MarkdownSection from './utils/field-viewers/MarkdownSection.vue';

import type { TopoMap } from '@/js/apis/c2c/schemas';

const props = defineProps(documentViewProps);

const { promise, documentType, fields, document, version } = useDocumentView<TopoMap>(props);
</script>
