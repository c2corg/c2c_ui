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
import ca from 'vuejs-datepicker/dist/locale/translations/ca';
import de from 'vuejs-datepicker/dist/locale/translations/de';
import en from 'vuejs-datepicker/dist/locale/translations/en';
import es from 'vuejs-datepicker/dist/locale/translations/es';
import fr from 'vuejs-datepicker/dist/locale/translations/fr';
import it from 'vuejs-datepicker/dist/locale/translations/it';
import hu from 'vuejs-datepicker/dist/locale/translations/hu';

import { baseMixin } from './mixins';

const datepickerLocales = {
  fr,
  en,
  es,
  eu: {
    language: 'Euskara',
    months: [
      'Urtarrila',
      'Otsaila',
      'Martxoa',
      'Apirila',
      'Maiatza',
      'Ekaina',
      'Uztaila',
      'Abuztua',
      'Iraila',
      'Urria',
      'Azaroa',
      'Abendua',
    ],
    monthsAbbr: ['Urt', 'Ots', 'Mar', 'Api', 'Mai', 'Eka', 'Uzt', 'Abu', 'Ira', 'Urr', 'Aza', 'Abe'],
    days: ['Iga', 'Ast', 'Ast', 'Ast', 'Ost', 'Ost', 'Lar'],
    rtl: false,
    ymd: false,
    yearSuffix: 'ko',
  },
  ca,
  de,
  it,
  hu,
  zh_Cn: {
    language: 'Chinese',
    months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
    monthsAbbr: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    days: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
    rtl: false,
    ymd: false,
    yearSuffix: '',
  },
};

export default {
  components: {
    Datepicker: () => import(/* webpackChunkName: "wiki-tools" */ 'vuejs-datepicker'),
  },

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
      value = this.$dateUtils.toLocalizedString(value, 'yyyy-MM-dd');
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
