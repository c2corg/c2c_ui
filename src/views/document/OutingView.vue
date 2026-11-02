<template>
  <div class="section has-background-white-print">
    <loading-notification :promise="promise" />
    <masked-document-version-info
      v-if="document === null"
      :version="version"
      :document-type="documentType"
    ></masked-document-version-info>
    <document-view-header v-if="document" :document="document" :version="version" />

    <images-box v-if="document" :document="document" />

    <div v-if="document" class="columns is-multiline is-block-print">
      <div class="column is-3 no-print">
        <map-box :document="document" />
        <tool-box :document="document" v-if="!$screen.isMobile" />
      </div>

      <div class="column is-9 is-12-print">
        <div class="box">
          <div class="no-print" v-for="route of document.associations!.routes" :key="route.document_id">
            <pretty-route-link :route="route" hide-area hide-orientation />
          </div>

          <div>
            <!-- API anti-pattern :
                associations.users should have been called associations.profiles
                as it refers to profiles document
                let stay profile coherent and call this component profiles-links
                and not users-links -->
            <profiles-links :profiles="document.associations!.users!" />
            <span v-if="document.cooked!.participants">, {{ document.cooked!.participants }}</span>
          </div>

          <hr />

          <div class="columns">
            <div class="column is-4">
              <activities-field :document="document" />
              <field-view :document="document" :field="fields.frequentation" />
              <field-view :document="document" :field="fields.condition_rating" />
              <field-view v-if="document.partial_trip" :document="document" :field="fields.partial_trip" />

              <field-view :document="document" :field="fields.participant_count" />
            </div>

            <div class="column is-4">
              <label-value :label="$gettext('ratings')">
                <document-rating :document="document" show-helper />
              </label-value>

              <!-- Access block -->
              <field-view v-if="document.public_transport" :document="document" :field="fields.public_transport" />
              <field-view :document="document" :field="fields.access_condition" />
              <field-view :document="document" :field="fields.lift_status" />
              <field-view :document="document" :field="fields.hut_status" />
            </div>

            <div class="column is-4">
              <!-- elevation block  -->
              <double-numeric-field
                :document="document"
                :field1="fields.elevation_min"
                :field2="fields.elevation_max"
                :label="$gettext('elevation')"
              />

              <field-view :document="document" :field="fields.elevation_access" />
              <double-numeric-field
                :document="document"
                :field1="fields.height_diff_up"
                :field2="fields.height_diff_down"
                :label="$gettext('height_diff')"
                show-signs
              />
              <label-value v-if="document.length_total" :label="$gettext('length_total')">
                {{ document.length_total / 1000 }}&nbsp;km
              </label-value>

              <!-- snow block -->
              <field-view :document="document" :field="fields.elevation_up_snow" />
              <field-view :document="document" :field="fields.elevation_down_snow" />
              <field-view :document="document" :field="fields.snow_quantity" />
              <field-view :document="document" :field="fields.snow_quality" />
              <field-view :document="document" :field="fields.glacier_rating" />
              <field-view :document="document" :field="fields.avalanche_signs" />
            </div>
          </div>
        </div>

        <div class="box">
          <markdown-section :document="document" :field="fields.route_description" />
          <markdown-section :document="document" :field="fields.weather" />
          <markdown-section :document="document" :field="fields.conditions" />

          <condition-levels :data="locale!.conditions_levels ?? undefined" />

          <markdown-section :document="document" :field="fields.avalanches" />
          <markdown-section :document="document" :field="fields.timing" />
          <markdown-section :document="document" :field="fields.access_comment" />
          <markdown-section :document="document" :field="fields.hut_comment" />
          <markdown-section :document="document" :field="fields.description" :title="$gettext('personal comments')" />

          <div style="clear: both" />
        </div>

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
import ActivitiesField from './utils/field-viewers/ActivitiesField.vue';
import ConditionLevels from './utils/field-viewers/ConditionLevels.vue';
import DoubleNumericField from './utils/field-viewers/DoubleNumericField.vue';
import FieldView from './utils/field-viewers/FieldView.vue';
import LabelValue from './utils/field-viewers/LabelValue.vue';
import MarkdownSection from './utils/field-viewers/MarkdownSection.vue';
import ProfilesLinks from './utils/field-viewers/ProfilesLinks.vue';

import type { Outing } from '@/js/apis/c2c/schemas';

const props = defineProps(documentViewProps);

const { promise, documentType, fields, document, version, locale } = useDocumentView<Outing>(props);
</script>
