<template>
  <activities-icons
    :activities="activities"
    class="card-icon is-size-2 is-ellipsed icon-activities has-text-secondary"
  />
</template>

<script setup lang="ts">
import type { PropType } from 'vue';

// imported under another name: the template would resolve <activities> to the prop, and render nothing
import ActivitiesIcons from '@/components/generics/Activities.vue';

defineProps({
  activities: {
    type: Array as PropType<string[]>,
    default: null,
  },
});
</script>

<style>
.icon-activities {
  line-height: 1;
}
</style>
