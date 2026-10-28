<template>
  <div class="info-text" :class="['is-' + type, { 'is-inline-block': inline }]">
    <fa-icon :icon="icon" class="info-icon mt-1 ml-1" />
    <div class="info-content" :class="[{ 'is-inline': inline }]">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  type: {
    type: String,
    default: 'info',
  },
  inline: {
    type: Boolean,
    default: false,
  },
});

const ICONS: Record<string, string> = {
  info: 'info-circle',
  warning: 'exclamation-circle',
  help: 'question-circle',
};

const icon = computed(() => ICONS[props.type]);
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables';

.info-text {
  font-size: 0.85em;
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}
.is-info {
  color: $primary;
}
.is-warning {
  color: $red;
}
.is-help {
  background: $grey-lightest;
  color: $grey-dark;
  border-radius: 4px;
  padding: 0.75rem;
  margin-bottom: 1.5rem !important;
}
.info-icon {
  float: left;
}
.info-content {
  margin-left: 2rem;
}

.is-inline-block {
  &.info-text {
    margin-top: 0;
    margin-bottom: 0;
  }
  .info-icon {
    float: none;
  }
  .info-content {
    margin-left: 0;
  }
}
</style>
