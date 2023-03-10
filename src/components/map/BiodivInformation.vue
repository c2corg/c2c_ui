<template>
  <modal-window ref="modalWindow">
    <div slot="header" class="has-text-centered">
      <span v-translate>Sensitive area:</span>
      <span>
        {{ data.title }}
      </span>
    </div>

    <p v-if="data.period">
      <span v-translate>sensitive_months:</span>
      <span>{{ period }}</span>
    </p>

    <!-- content formatting done with DOM parser to decode html entities -->
    <p v-for="(descPar, i) of descriptionParagraphs" :key="i">{{ descPar }}</p>
    <a :href="data.infoUrl" target="_blank" rel="noopener" v-translate>More info</a> |
    <a :href="data.kmlUrl" target="_blank" rel="noopener">KML</a>
  </modal-window>
</template>

<script>
import utils from '@/js/utils';

export default {
  props: {
    data: {
      type: Object,
      required: true,
    },
  },

  computed: {
    descriptionParagraphs() {
      // keep line breaks for better readability
      const paragraphList = (this.data.description ?? '').split(/<br ?\/?>/);
      // decode html entities
      for (let i in paragraphList) {
        paragraphList[i] = utils.decodeHtmlEntities(paragraphList[i]);
      }
      return paragraphList;
    },

    period() {
      if (this.data.period.every((month) => !!month)) {
        return this.$gettext('whole year', 'period');
      }
      if (this.$dateUtils.hasSinglePeriod(this.data.period)) {
        let start, end;
        if (this.data.period[0] && this.data.period[11]) {
          start = this.data.period.lastIndexOf(false) + 1;
          end = this.data.period.indexOf(false) - 1;
        } else {
          start = this.data.period.indexOf(true);
          end = this.data.period.lastIndexOf(true);
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
      return this.data.period
        .map((included, index) => (included ? this.$dateUtils.month(parseInt(index, 10)) : undefined))
        .filter((month) => !!month)
        .join(', ');
    },
  },

  methods: {
    show() {
      this.$refs.modalWindow.show();
    },
  },
};
</script>
