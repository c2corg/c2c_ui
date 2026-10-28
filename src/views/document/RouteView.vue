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
      <div class="column is-3 no-print">
        <map-box :document="document" @has-protection-area="hasProtectionArea = true" />
        <avalanche-box :document="document" v-if="!$screen.isMobile" />
        <is-reachable-by-public-transports-box v-if="!isPrintingView" :document="document" />

        <tool-box :document="document" v-if="!$screen.isMobile" />
      </div>

      <div class="column is-9 is-12-print">
        <!-- CONTENT -->

        <div class="box">
          <div class="columns">
            <div class="column is-4">
              <activities-field :document="document" />
              <field-view :document="document" :field="fields.route_types" />
              <field-view :document="document" :field="fields.durations" :unit="$gettext('day(s)')" />
              <field-view :document="document" :field="fields.rock_types" />
              <field-view :document="document" :field="fields.climbing_outdoor_type" />
              <field-view :document="document" :field="fields.configuration" />
              <field-view :document="document" :field="fields.slackline_type" />
            </div>

            <div class="column is-4">
              <label-value v-if="$documentUtils.hasRating(document)" :label="$gettext('ratings')">
                <document-rating :document="document" show-helper />
              </label-value>
              <label-value v-else-if="isEditable" :label="$gettext('ratings')">
                <edit-link :document="document" :lang="lang" />
              </label-value>

              <field-view v-if="document.glacier_gear != 'no'" :document="document" :field="fields.glacier_gear" />

              <input-orientation
                v-if="document.orientations && document.orientations.length"
                v-model="document.orientations"
                disabled
              />
            </div>

            <div class="column is-4">
              <double-numeric-field
                :document="document"
                :field1="fields.elevation_min"
                :field2="fields.elevation_max"
                :label="$gettext('elevation')"
              />

              <double-numeric-field
                :document="document"
                :field1="fields.height_diff_up"
                :field2="fields.height_diff_down"
                :label="$gettext('height_diff')"
                show-signs
              />

              <field-view :document="document" :field="fields.height_diff_difficulties" />
              <field-view :document="document" :field="fields.difficulties_height" />

              <field-view :document="document" :field="fields.height_diff_access" />
              <field-view :document="document" :field="fields.lift_access" />

              <field-view :document="document" :field="fields.route_length" :divisor="1000" unit="km" />

              <field-view :document="document" :field="fields.mtb_height_diff_portages" />
              <field-view :document="document" :field="fields.mtb_length_asphalt" :divisor="1000" unit="km" />
              <field-view :document="document" :field="fields.mtb_length_trail" :divisor="1000" unit="km" />

              <label-value v-if="document.cooked.slope" :label="$gettext('slope')">
                {{ document.cooked.slope }}
              </label-value>

              <field-view :document="document" :field="fields.slackline_height" />
            </div>
          </div>
        </div>

        <div class="box">
          <low-document-quality-banner
            v-if="isEditable && ['empty', 'draft'].includes(document.quality)"
            :document="document"
          />
          <markdown-section :document="document" :field="fields.summary" />
          <markdown-section v-if="locale.route_history" :document="document" :field="fields.route_history" />
          <div v-else-if="showMissingHistoryBanner" class="notification is-info no-print missing-history-banner">
            <edit-link :document="document" :lang="lang" v-translate>
              History is missing, please provide it if you have information.
            </edit-link>
          </div>
          <markdown-section :document="document" :field="fields.description" />
          <markdown-section :document="document" :field="fields.slackline_anchor1" />
          <markdown-section :document="document" :field="fields.slackline_anchor2" />

          <markdown-section :document="document" :field="fields.remarks">
            <template v-if="hasProtectionArea" #after>
              <div class="notification is-info protection-area-info no-print">
                <strong v-translate>Sensitive areas</strong>
                <p v-translate>There are sensitive areas on this route. Please refer to the map.</p>
              </div>
            </template>
          </markdown-section>

          <fundraiser-banner :document="document" />

          <markdown-section :document="document" :field="fields.gear">
            <template v-if="Object.keys(gearArticles).length !== 0" #after>
              <div class="content automatic-gears">
                <ul>
                  <li v-for="(label, articleId) of gearArticles" :key="articleId">
                    <router-link :to="{ name: 'article', params: { id: articleId } }">
                      {{ label }}
                    </router-link>
                  </li>
                </ul>
              </div>
            </template>
          </markdown-section>

          <markdown-section :document="document" :field="fields.external_resources" />

          <div style="clear: both" />
        </div>

        <transports-box :document="document" />

        <routes-box :document="document" hide-buttons disable-activity-split />
        <images-box :document="document" />

        <recent-outings-box :document="document" />

        <avalanche-box :document="document" v-if="$screen.isMobile" />

        <tool-box :document="document" v-if="$screen.isMobile" />

        <comments-box :document="document" />
      </div>
      <document-print-license :document="document" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import DocumentPrintLicense from './utils/DocumentPrintLicense.vue';
import DocumentViewHeader from './utils/DocumentViewHeader.vue';
import FundraiserBanner from './utils/FundraiserBanner.vue';
import LowDocumentQualityBanner from './utils/LowDocumentQualityBanner.vue';
import MaskedDocumentVersionInfo from './utils/MaskedDocumentVersionInfo.vue';
import AvalancheBox from './utils/boxes/AvalancheBox.vue';
import CommentsBox from './utils/boxes/CommentsBox.vue';
import ImagesBox from './utils/boxes/ImagesBox.vue';
import IsReachableByPublicTransportsBox from './utils/boxes/IsReachableByPublicTransportsBox.vue';
import MapBox from './utils/boxes/MapBox.vue';
import RecentOutingsBox from './utils/boxes/RecentOutingsBox.vue';
import RoutesBox from './utils/boxes/RoutesBox.vue';
import ToolBox from './utils/boxes/ToolBox.vue';
import TransportsBox from './utils/boxes/TransportsBox.vue';
import { documentViewProps, useDocumentView } from './utils/document-view';
import ActivitiesField from './utils/field-viewers/ActivitiesField.vue';
import DoubleNumericField from './utils/field-viewers/DoubleNumericField.vue';
import FieldView from './utils/field-viewers/FieldView.vue';
import LabelValue from './utils/field-viewers/LabelValue.vue';
import MarkdownSection from './utils/field-viewers/MarkdownSection.vue';
import { getGearArticles } from './utils/gear-articles';

import { useGlobalProperties } from '@/js/composables/global-properties';

const historyWorthActivities = [
  'snow_ice_mixed',
  'mountain_climbing',
  'rock_climbing',
  'ice_climbing',
  'via_ferrata',
  'slacklining',
];

const props = defineProps(documentViewProps);

const { $gettext } = useGlobalProperties();
const { isPrintingView, promise, documentType, fields, document, version, locale, lang, isEditable } =
  useDocumentView(props);

const hasProtectionArea = ref(false);

const gearArticles = computed(() => getGearArticles(document.value!, $gettext));

const showMissingHistoryBanner = computed(() => {
  const doc = document.value!;

  if (!isEditable.value) {
    return false;
  }

  if (version.value || ['empty', 'draft'].includes(doc.quality)) {
    // hide notice if we are consulting an old version, or if low quality doc banner is already shown
    return false;
  }
  const activities = doc.activities ?? [];
  for (let act of historyWorthActivities) {
    if (activities.includes(act)) {
      return true;
    }
  }
  if (activities.includes('skitouring') && doc.ski_rating?.startsWith('5.')) {
    return true;
  }
  return false;
});
</script>

<style lang="scss" scoped>
.missing-history-banner {
  overflow: hidden;
}

.protection-area-info {
  overflow: hidden;
  margin-bottom: 1.5rem;
}
.automatic-gears {
  margin-bottom: 1.5rem;
}
@media print {
  .protection-area-info {
    margin: 0rem !important;
    padding: 0rem !important;
  }
}
</style>
