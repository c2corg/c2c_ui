<template>
  <modal-window ref="modal">
    <template #header>
      <div class="has-text-centered">
        <span v-translate>Sensitive area:</span>
        <span>
          {{ data.title }}
        </span>
      </div>
    </template>

    <p v-if="data.period">
      <span v-translate>sensitive_months:</span>
      <span>{{ period }}</span>
    </p>

    <!-- content formatting done with DOM parser to decode html entities -->
    <p v-for="(descPar, i) of descriptionParagraphs" :key="i">{{ descPar }}</p>
    <a :href="data.infoUrl" target="_blank" rel="noopener" v-translate>More info</a> |
    <a :href="data.kmlUrl" target="_blank" rel="noopener">KML</a>
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

const { $dateUtils, $gettext } = useGlobalProperties();
const modal = useTemplateRef<{ show(): void }>('modal');

// keep line breaks for better readability, and decode html entities
const descriptionParagraphs = computed(() =>
  ((props.data.description as string | undefined) ?? '')
    .split(/<br ?\/?>/)
    .map((paragraph) => utils.decodeHtmlEntities(paragraph))
);

const period = computed(() => {
  const months = props.data.period as boolean[];
  if (months.every((month) => !!month)) {
    return $gettext('whole year', 'period');
  }
  if ($dateUtils.hasSinglePeriod(months)) {
    let start, end;
    if (months[0] && months[11]) {
      start = months.lastIndexOf(false) + 1;
      end = months.indexOf(false) - 1;
    } else {
      start = months.indexOf(true);
      end = months.lastIndexOf(true);
    }
    return $dateUtils.month(start) + ' ' + $gettext('to', 'period') + ' ' + $dateUtils.month(end);
  }

  // default case, enumerate months
  return months
    .map((included, index) => (included ? $dateUtils.month(index) : undefined))
    .filter((month) => !!month)
    .join(', ');
});

function show() {
  modal.value!.show();
}

// the map shows it for the clicked area
defineExpose({ show });
</script>
