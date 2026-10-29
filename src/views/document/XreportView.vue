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
          <event-activity-field :document="document" />
          <label-value v-if="document.author" :label="$gettext('contributor')">
            <author-link :author="document.author" />
          </label-value>

          <field-view :document="document" :field="fields.event_type" />

          <label-value v-if="document.associations!.users.length" :label="$gettext('participants')">
            <profiles-links :profiles="document.associations!.users" />
          </label-value>

          <field-view :document="document" :field="fields.avalanche_level" />
          <field-view :document="document" :field="fields.avalanche_slope" />
          <field-view :document="document" :field="fields.elevation" />
          <field-view :document="document" :field="fields.nb_participants" />
          <field-view :document="document" :field="fields.nb_impacted" />
          <field-view :document="document" :field="fields.rescue" />
          <field-view :document="document" :field="fields.severity" />
          <field-view :document="document" :field="fields.supervision" />
          <field-view :document="document" :field="fields.autonomy" />
          <field-view :document="document" :field="fields.activity_rate" />
          <field-view :document="document" :field="fields.qualification" />
        </div>

        <map-box :document="document" />
        <tool-box :document="document" v-if="!$screen.isMobile" />
      </div>

      <div class="column is-9 is-12-print">
        <div class="box">
          <markdown-section :document="document" :field="fields.summary" />
          <markdown-section :document="document" :field="fields.description" />
          <markdown-section :document="document" :field="fields.place" />
          <markdown-section :document="document" :field="fields.route_study" />
          <markdown-section :document="document" :field="fields.conditions" />
          <markdown-section :document="document" :field="fields.training" />
          <markdown-section :document="document" :field="fields.motivations" />
          <markdown-section :document="document" :field="fields.group_management" />
          <markdown-section :document="document" :field="fields.risk" />
          <markdown-section :document="document" :field="fields.time_management" />
          <markdown-section :document="document" :field="fields.safety" />
          <markdown-section :document="document" :field="fields.increase_impact" />
          <markdown-section :document="document" :field="fields.reduce_impact" />
          <markdown-section :document="document" :field="fields.modifications" />
          <markdown-section :document="document" :field="fields.other_comments" />
          <div style="clear: both" />

          <div v-for="route of document.associations!.routes" :key="route.document_id">
            <pretty-route-link :route="route" hide-area hide-orientation />
          </div>
        </div>

        <images-box v-if="document" :document="document" />

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
import ToolBox from './utils/boxes/ToolBox.vue';
import { documentViewProps, useDocumentView } from './utils/document-view';
import EventActivityField from './utils/field-viewers/EventActivityField.vue';
import FieldView from './utils/field-viewers/FieldView.vue';
import LabelValue from './utils/field-viewers/LabelValue.vue';
import MarkdownSection from './utils/field-viewers/MarkdownSection.vue';
import ProfilesLinks from './utils/field-viewers/ProfilesLinks.vue';

const props = defineProps(documentViewProps);

const { promise, documentType, fields, document, version } = useDocumentView(props);
</script>
