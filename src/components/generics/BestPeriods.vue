<template>
  <span>
    {{ period }}
  </span>
</template>

<script>
import common from '../../js/constants/common.json';

export default {
  props: {
    months: {
      type: Array,
      default: null,
    },
  },

  computed: {
    period() {
      if (this.months.length === 12) {
        return this.$gettext('whole year', 'period');
      }
      const period = Array(12).fill(false);
      this.months.forEach((month) => {
        const index = common.attributes.months.indexOf(month);
        if (index >= 0) {
          period[index] = true;
        }
      });
      if (this.$dateUtils.hasSinglePeriod(period)) {
        let start, end;
        if (period[0] && period[11]) {
          start = period.lastIndexOf(false) + 1;
          end = period.indexOf(false) - 1;
        } else {
          start = period.indexOf(true);
          end = period.lastIndexOf(true);
        }
        return (
          this.$dateUtils.month(parseInt(start, 10)) +
          ' ' +
          this.$gettext('to', 'period') +
          ' ' +
          this.$dateUtils.month(parseInt(end, 10))
        );
      }

      // default case, enumerate months
      return this.months.map((month) => this.$dateUtils.month(common.attributes.months.indexOf(month))).join(', ');
    },
  },
};
</script>
