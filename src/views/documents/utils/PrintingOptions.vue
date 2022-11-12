<template>
  <div class="box no-print">
    <h1 class="title is-1">Printing a selection of documents</h1>
    <div class="printing-option-section">
      <h2 class="title is-2">Number of documents</h2>
      <page-selector :documents="documents" page-type="print" />.
    </div>
    <div class="printing-option-section">
      <h2 class="title is-2">Other options</h2>
      <ul>
        <li><input class="print-option-checkbox" v-model="pageBreaks" type="checkbox" />Add page breaks before each document.</li>
        <li><input class="print-option-checkbox" v-model="imagePrinting" type="checkbox" />Include images.</li>
        <li><input class="print-option-checkbox" v-model="summaryVisibility" checked type="checkbox" />Include a summary.</li>
      </ul>
    </div>
    <div class="printing-option-section">
      <h2 class="title is-2">Printing</h2>
      <button :disabled="allLoaded" class="button is-primary print-button" onclick="window.print()">Print</button>
      <span v-if="allLoaded">Loaded {{ totalResolved }} documents out of {{ total }}</span>
    </div>
  </div>
</template>

<script>
import PageSelector from './PageSelector';

export default {
  components: {
    PageSelector,
  },

  props: {
    documents: {
      type: Object,
      default: null,
    },
    promises: {
      type: Array,
      default: null,
    },
  },

  data() {
    return {
      totalResolved: 0,
      pageBreaks: false,
      imagePrinting: false,
      summaryVisibility: true,
    };
  },

  computed: {
    offset() {
      return parseInt(this.$route.query.offset ?? 0);
    },
    total() {
      return this.promises.length;
    },
    allLoaded() {
      return this.totalResolved < this.total;
    },
  },

  watch: {
    promises: 'trackResolve',
    pageBreaks: 'setPageBreaks',
    imagePrinting: 'setImagePrinting',
    summaryVisibility: 'setSummaryVisibility',
  },

  methods: {
    setPageBreaks() {
      this.$emit('set-page-breaks', this.pageBreaks);
    },
    setImagePrinting() {
      this.$emit('set-image-printing', this.imagePrinting);
    },
    setSummaryVisibility() {
      this.$emit('set-summary-visibility', this.summaryVisibility);
    },
    trackResolve() {
      this.totalResolved = 0;
      this.promises.map((p) => {
        p.promise.then(() => {
          this.totalResolved++;
        });
      });
    },

  },
};
</script>

<style scoped>
.printing-option-section {
  margin-bottom: 1.5rem;
}
.printing-option-section h1 {
    font-size: 1.8rem;
    margin-bottom: 0.5em;
    border-bottom: 1px solid #ddd;
}
.printing-option-section h2 {
    font-size: 1.8rem;
    margin-bottom: 0.5em;
    border-bottom: 1px solid #ddd;
}

.print-button {
    vertical-align: baseline;
    margin-right: 10px;
}

.print-option-checkbox {
    margin-right: 5px;
}
</style>
