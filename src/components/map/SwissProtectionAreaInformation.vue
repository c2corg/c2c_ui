<template>
  <modal-window ref="modal">
    <template #header>
      <div class="has-text-centered">
        <span>
          {{ type }}
        </span>
        <span>
          {{ data.properties.label }}
        </span>
      </div>
    </template>
    <table>
      <tbody>
        <tr v-if="protectionStatus">
          <td v-translate>Protection status</td>
          <td>{{ protectionStatus }}</td>
        </tr>
        <tr v-if="data.properties.schutzzeit">
          <td v-translate>Period of protection</td>
          <td>{{ data.properties.schutzzeit }}</td>
        </tr>
        <tr v-if="dispositions.length">
          <td v-translate>Dispositions</td>
          <td>{{ dispositions }}</td>
        </tr>
        <tr v-if="additionalInformation.length">
          <td v-translate>Additional information</td>
          <td>{{ additionalInformation }}</td>
        </tr>
      </tbody>
    </table>
  </modal-window>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';

import { useGlobalProperties } from '@/js/composables/global-properties';
import utils from '@/js/utils';

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
});

const { $gettext, $language } = useGlobalProperties();
const modal = useTemplateRef<{ show(): void }>('modal');

// the texts of the area are in French, German and Italian
const textLang = () => {
  const lang = $language.current;
  return lang && ['fr', 'de', 'it'].includes(lang) ? lang : 'fr';
};

const type = computed(() => {
  switch (props.data.layerBodId) {
    case 'ch.bafu.wrz-wildruhezonen_portal':
      return $gettext('Protection area:');
    case 'ch.bafu.wrz-jagdbanngebiete_select':
      return $gettext('Fauna protection site:');
    default:
      return $gettext('Sensitive area:');
  }
});

const dispositions = computed(() => utils.decodeHtmlEntities(props.data.properties[`best_${textLang()}`] ?? '') ?? '');
const additionalInformation = computed(
  () => utils.decodeHtmlEntities(props.data.properties.zusatzinformation ?? '') ?? ''
);
const protectionStatus = computed(
  () => utils.decodeHtmlEntities(props.data.properties[`schutzs_${textLang()}`] ?? '') ?? ''
);

function show() {
  modal.value!.show();
}

// the map shows it for the clicked area
defineExpose({ show });
</script>
