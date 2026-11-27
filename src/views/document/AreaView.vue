<template>
  <div class="section has-background-white-print">
    <loading-notification :promise="promise" />
    <masked-document-version-info
      v-if="document === null"
      :version="version"
      :document-type="documentType"
    ></masked-document-version-info>
    <document-view-header v-if="document" :document="document" :version="version" />
    <div v-if="document" class="columns print-no-columns">
      <div class="column is-3">
        <div class="box">
          <field-view :document="document" :field="fields.area_type" />
        </div>
        <map-box :document="document" />
        <tool-box :document="document" v-if="!$screen.isMobile" />
      </div>

      <div class="column is-9">
        <div class="box" v-if="document.cooked!.summary || document.cooked!.description">
          <markdown-section :document="document" :field="fields.summary" />
          <markdown-section :document="document" :field="fields.description" />
          <div style="clear: both" />
        </div>

        <fundraiser-banner :document="document" />

        <div class="box no-print">
          <div class="level is-mobile">
            <div
              class="level-item has-text-centered"
              v-for="listType of ['waypoint', 'image', 'route', 'outing']"
              :key="listType"
            >
              <router-link :to="{ name: listType + 's', query: { a: documentId } }" class="">
                <div>
                  <icon-document class="is-size-1" :document-type="listType.toLowerCase()" />
                </div>
                <p>{{ $filters.uppercaseFirstLetter($gettext(listType + 's')) }}</p>
              </router-link>
            </div>
          </div>
        </div>

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
import FundraiserBanner from './utils/FundraiserBanner.vue';
import MaskedDocumentVersionInfo from './utils/MaskedDocumentVersionInfo.vue';
import CommentsBox from './utils/boxes/CommentsBox.vue';
import ImagesBox from './utils/boxes/ImagesBox.vue';
import MapBox from './utils/boxes/MapBox.vue';
import ToolBox from './utils/boxes/ToolBox.vue';
import { documentViewProps, useDocumentView } from './utils/document-view';
import FieldView from './utils/field-viewers/FieldView.vue';
import MarkdownSection from './utils/field-viewers/MarkdownSection.vue';

import type { Area } from '@/js/apis/c2c/schemas';

const props = defineProps(documentViewProps);

const { promise, documentId, documentType, fields, document, version } = useDocumentView<Area>(props);
</script>
