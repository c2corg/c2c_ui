<template>
  <div class="control">
    <span v-if="prefix !== null"> {{ prefix | uppercaseFirstLetter }} : </span>
    <input :id="'c2c-' + _uid + '_yes'" type="radio" :value="true" class="is-checkradio is-primary" v-model="value_" />
    <label :for="'c2c-' + _uid + '_yes'">{{ labelYes || $gettext('yes') | uppercaseFirstLetter }}</label>

    <input :id="'c2c-' + _uid + '_no'" type="radio" :value="false" class="is-checkradio is-primary" v-model="value_" />
    <label :for="'c2c-' + _uid + '_no'">{{ labelNo || $gettext('no') | uppercaseFirstLetter }}</label>

    <input
      v-if="nullable"
      :id="'c2c-' + _uid + '_null'"
      type="radio"
      :value="null"
      class="is-checkradio is-primary"
      v-model="value_"
    />
    <label v-if="nullable" :for="'c2c-' + _uid + '_null'" class="is-italic">
      {{ $gettext('no info') | uppercaseFirstLetter }}
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
    nullable: {
      type: Boolean,
      default: false,
    },
    prefix: {
      type: String,
      default: null,
    },
    labelYes: {
      type: String,
      default: null,
    },
    labelNo: {
      type: String,
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
