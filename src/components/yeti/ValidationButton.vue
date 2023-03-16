<template>
  <div class="columns">
    <div class="column has-text-right">
      <button
        class="button is-primary"
        :class="{ 'is-loading': loading }"
        :disabled="loading"
        :tabindex="tabindex"
        @click="$emit('click')"
        v-translate
      >
        Compute risk
      </button>
      <div v-if="currentError" class="info">
        <info inline>
          <span>{{ currentError }}</span>
        </info>
      </div>
    </div>
  </div>
</template>

<script>
import Info from '@/components/yeti/Info.vue';

export default {
  components: { Info },
  props: {
    currentError: {
      type: String,
      default: '',
    },
    loading: {
      type: [Promise, Object],
      default: null,
    },
    tabindex: {
      type: String,
      default: '0',
    },
  },
};
</script>

<style scoped lang="scss">
.info {
  margin-top: 0.25rem;
  margin-right: -0.75rem;
}
</style>
