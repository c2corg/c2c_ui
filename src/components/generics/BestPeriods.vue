<template>
  <span>
    {{ period }}
  </span>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';

import common from '../../js/constants/common.json';

import { useGlobalProperties } from '@/js/composables/global-properties';

const props = defineProps({
  months: {
    type: Array as PropType<string[]>,
    default: null,
  },
});

const { $dateUtils, $gettext } = useGlobalProperties();

const period = computed(() => {
  if (props.months.length === 12) {
    return $gettext('whole year', 'period');
  }
  const period = Array(12).fill(false);
  props.months.forEach((month) => {
    const index = common.attributes.months.indexOf(month);
    if (index >= 0) {
      period[index] = true;
    }
  });
  if ($dateUtils.hasSinglePeriod(period)) {
    let start, end;
    if (period[0] && period[11]) {
      start = period.lastIndexOf(false) + 1;
      end = period.indexOf(false) - 1;
    } else {
      start = period.indexOf(true);
      end = period.lastIndexOf(true);
    }
    return $dateUtils.month(start) + ' ' + $gettext('to', 'period') + ' ' + $dateUtils.month(end);
  }

  // default case, enumerate months
  return props.months.map((month) => $dateUtils.month(common.attributes.months.indexOf(month))).join(', ');
});
</script>
