<template>
  <datepicker
    monday-first
    :input-class="hasError ? 'input is-danger' : 'input'"
    class="intput-date"
    :language="$options.datepickerLocales[$language.current]"
    :highlighted="{ dates: [new Date()] }"
    :disabled-dates="disabledDates"
    :required="required"
    @input="onInput"
    :value="value"
  />
</template>

<script>
import Datepicker from 'vuejs-datepicker';
import { ca, de, en, es, fr, it } from 'vuejs-datepicker/dist/locale';

import { baseMixin } from './mixins';

// note that eu is missing. Sorry euskara...
const datepickerLocales = {
  fr,
  en,
  es,
  ca,
  de,
  it,
};

export default {
  components: { Datepicker },

  mixins: [baseMixin],

  props: {
    value: {
      type: String,
      default: null,
    },
    disabledDates: {
      type: Object,
      default: undefined,
    },
  },

  methods: {
    onInput(value) {
      value = this.$moment.parseDate(value).format('YYYY-MM-DD');
      this.$emit('input', value);
    },
  },

  datepickerLocales,
};
</script>

<style scoped>
.intput-date {
  display: inline-block;
}
</style>
