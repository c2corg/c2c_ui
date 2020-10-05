<template>
  <modal-window ref="modalWindow">
    <div slot="header" class="has-text-centered">
      <span v-translate> Sensitive area: </span>
      <span>
        {{ data.title }}
      </span>
    </div>

    <p v-if="data.period">
      <span v-translate>sensitive_months:</span>
      <span>{{ months.join(', ') }}</span>
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
      const paragraphList = (this.data.description || '').split(/<br ?\/?>/);
      // decode html entities
      let i = 0;
      for (i in paragraphList) {
        paragraphList[i] = utils.decodeHtmlEntities(paragraphList[i]);
      }
      return paragraphList;
    },

    months() {
      const result = [];

      for (const month in this.data.period) {
        if (this.data.period[month]) {
          result.push(this.$moment.month(parseInt(month, 10)));
        }
      }

      return result;
    },
  },

  methods: {
    show() {
      this.$refs.modalWindow.show();
    },
  },
};
</script>
