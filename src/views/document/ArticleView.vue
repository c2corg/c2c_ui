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
      <div class="column is-3 is-12-print">
        <div class="box">
          <activities-field :document="document" />
          <field-view :document="document" :field="fields.categories" />
          <field-view :document="document" :field="fields.article_type" />
          <label-value v-if="document.author && document.article_type === 'personal'" :label="$gettext('contributor')">
            <author-link :author="document.author" />
          </label-value>
        </div>

        <tool-box :document="document" v-if="!$screen.isMobile" />
      </div>
      <div class="column is-9 is-12-print">
        <div class="box">
          <low-document-quality-banner
            v-if="isEditable && ['empty', 'draft'].includes(document.quality)"
            :document="document"
          />
          <markdown-section :document="document" :field="fields.summary" />
          <markdown-section :document="document" :field="fields.description" hide-title />
          <div style="clear: both" />
        </div>

        <routes-box v-if="!isDraftView" :document="document" hide-buttons />
        <recent-outings-box v-if="!isDraftView" :document="document" />
        <images-box v-if="!isDraftView" :document="document" />
        <tool-box :document="document" v-if="$screen.isMobile" />
        <comments-box v-if="!isDraftView" :document="document" />
      </div>
      <document-print-license :document="document" />
    </div>
  </div>
</template>

<script setup lang="ts">
import DocumentPrintLicense from './utils/DocumentPrintLicense.vue';
import DocumentViewHeader from './utils/DocumentViewHeader.vue';
import LowDocumentQualityBanner from './utils/LowDocumentQualityBanner.vue';
import MaskedDocumentVersionInfo from './utils/MaskedDocumentVersionInfo.vue';
import CommentsBox from './utils/boxes/CommentsBox.vue';
import ImagesBox from './utils/boxes/ImagesBox.vue';
import RecentOutingsBox from './utils/boxes/RecentOutingsBox.vue';
import RoutesBox from './utils/boxes/RoutesBox.vue';
import ToolBox from './utils/boxes/ToolBox.vue';
import { documentViewProps, useDocumentView } from './utils/document-view';
import ActivitiesField from './utils/field-viewers/ActivitiesField.vue';
import FieldView from './utils/field-viewers/FieldView.vue';
import LabelValue from './utils/field-viewers/LabelValue.vue';
import MarkdownSection from './utils/field-viewers/MarkdownSection.vue';

import type { Article } from '@/js/apis/c2c/schemas';

const props = defineProps(documentViewProps);

const { isDraftView, promise, documentType, fields, document, version, isEditable } = useDocumentView<Article>(props);
</script>
