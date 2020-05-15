<template>
  <div class="control">
    <input
      :id="'c2c-checkbox' + _uid"
      class="is-checkradio is-primary"
      type="checkbox"
      v-model="value_"
      @change="$emit('change')"
    />
    <label :for="'c2c-checkbox' + _uid">
      <slot />
    </label>
  </div>
</template>

<script>
import { baseMixin } from './mixins.js';

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
.control {
  /* extension radio has removed padding around inputs */
  padding-top: calc(0.375em - 1px);
  padding-bottom: calc(0.375em - 1px);
}
</style>
