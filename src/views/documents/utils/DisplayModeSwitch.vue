<template>
  <dropdown-button class="is-right" ref="dropdown">
    <template #button>
      <span class="button is-small">
        <fa-icon :icon="['fas', 'eye']" class="is-size-4" />
        <span>&nbsp;</span>
        <fa-icon icon="angle-down" aria-hidden="true" />
      </span>
    </template>
    <a
      class="dropdown-item is-size-6"
      :class="{ 'is-active': modelValue === 'result' }"
      @click="
        dropdown!.isActive = false;
        $emit('update:modelValue', 'result');
      "
    >
      <span class="has-text-centered item-icons">
        <fa-icon :icon="listMode ? 'th-list' : 'th'" />
      </span>
      <span class="is-nowrap" v-translate>Results only</span>
    </a>
    <a
      class="dropdown-item is-size-6"
      :class="{ 'is-active': modelValue === 'both' }"
      @click="
        dropdown!.isActive = false;
        $emit('update:modelValue', 'both');
      "
    >
      <span class="is-nowrap item-icons">
        <fa-icon :icon="listMode ? 'th-list' : 'th'" />
        <fa-icon icon="map-marked-alt" />
      </span>
      <span class="is-nowrap" v-translate>Both results and map</span>
    </a>
    <a
      class="dropdown-item is-size-6"
      :class="{ 'is-active': modelValue === 'map' }"
      @click="
        dropdown!.isActive = false;
        $emit('update:modelValue', 'map');
      "
    >
      <span class="has-text-centered item-icons">
        <fa-icon icon="map-marked-alt" />
      </span>
      <span class="is-nowrap" v-translate>Map only</span>
    </a>
  </dropdown-button>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue';

import type DropdownButton from '@/components/generics/DropdownButton.vue';

defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  // the results are a list (else cards): the icons of the modes follow
  listMode: {
    type: Boolean,
    required: true,
  },
});
defineEmits(['update:modelValue']);

const dropdown = useTemplateRef<InstanceType<typeof DropdownButton>>('dropdown');
</script>

<style lang="scss" scoped>
.item-icons {
  display: inline-block;
  width: 2.2rem;

  svg {
    margin: 0 0.1rem;
  }
}

span:nth-child(2) {
  padding-left: 0.5rem;
}
</style>
