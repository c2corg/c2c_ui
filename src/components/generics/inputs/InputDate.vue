<template>
  <vue-date-picker
    :input-class-name="hasError ? 'input is-danger' : 'input'"
    class="intput-date"
    :locale="$language.current"
    :min-date="disabledDates && disabledDates.to"
    :max-date="disabledDates && disabledDates.from"
    :required="required"
    format="yyyy-MM-dd"
    model-type="yyyy-MM-dd"
    :enable-time-picker="false"
    :clearable="false"
    auto-apply
    text-input
    v-model="value_"
  />
</template>

<script>
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

import { baseMixin } from './mixins';

export default {
  components: {
    VueDatePicker,
  },

  mixins: [baseMixin],

  props: {
    modelValue: {
      type: String,
      default: null,
    },
    disabledDates: {
      type: Object,
      default: undefined,
    },
  },
};
</script>

<style scoped>
.intput-date {
  display: inline-block;
}
</style>
