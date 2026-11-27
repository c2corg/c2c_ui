<template>
  <a
    class="button has-text-primary"
    :disabled="disabled || null"
    :title="tooltip"
    :target="target"
    :href="href"
    @click="!disabled ? $emit('click', $event) : {}"
  >
    <span v-if="icon" class="icon">
      <fa-icon :icon="icon" />
    </span>
    <span v-if="text">
      {{ text }}
    </span>
  </a>
</template>

<script setup lang="ts">
defineProps({
  text: {
    type: String,
    default: null,
  },
  icon: {
    type: String,
    default: null,
  },
  tooltip: {
    type: String,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  target: {
    type: String,
    default: null,
  },
  href: {
    type: String,
    default: null,
  },
});
defineEmits(['click']);
</script>
