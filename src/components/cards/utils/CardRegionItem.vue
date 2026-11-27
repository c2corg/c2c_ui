<template>
  <span v-if="text" class="is-ellipsed">
    <icon-area class="card-icon" />
    {{ text }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useGlobalProperties } from '@/js/composables/global-properties';
import { documentProperty } from '@/js/properties';

const props = defineProps({ ...documentProperty });

const { $documentUtils } = useGlobalProperties();

const text = computed(() => $documentUtils.getSortedAreaList(props.document));
</script>
