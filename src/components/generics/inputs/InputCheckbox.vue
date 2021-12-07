<template>
  <span class="input-checkbox">
    <input
      :id="'c2c-checkbox' + _uid"
      class="is-checkradio is-primary"
      type="checkbox"
      v-model="value_"
      :disabled="disabled"
      @change="$emit('change')"
    />
    <label :for="'c2c-checkbox' + _uid">
      <slot />
    </label>
  </span>
</template>

<script>
import { baseMixin } from './mixins';

export default {
  mixins: [baseMixin],

  props: {
    value: {
      type: Boolean,
      default: null,
    },
  },
};
</script>

<style scoped>
.input-checkbox {
  /* extension radio has removed padding around inputs */
  display: inline-block;
  padding-bottom: calc(0.375em - 1px);
}
</style>
