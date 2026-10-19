<template>
  <div class="box no-print">
    <div class="columns">
      <div class="column printing-option-section">
        <h2 class="title is-2" v-translate>Number of documents</h2>
        <page-selector :documents="documents" page-type="print" />.
      </div>
      <div class="column printing-option-section">
        <h2 class="title is-2" v-translate>Other options</h2>
        <ul>
          <li>
            <label
              ><input class="print-option-checkbox" v-model="pageBreaks" type="checkbox" /><span v-translate
                >Add page break before each document</span
              ></label
            >
          </li>
          <li>
            <label
              ><input class="print-option-checkbox" v-model="imagePrinting" type="checkbox" /><span v-translate
                >Include image section</span
              ></label
            >
          </li>
          <li>
            <label
              ><input class="print-option-checkbox" v-model="summaryVisibility" checked type="checkbox" /><span
                v-translate
                >Include summary</span
              ></label
            >
          </li>
        </ul>
      </div>
      <div class="column printing-option-section">
        <h2 class="title is-2" v-translate>Printing</h2>
        <button
          :disabled="isLoading || isPreparingPrint"
          :class="{ 'is-loading': isPreparingPrint }"
          class="button is-primary print-button"
          @click="print"
          v-translate
        >
          Print
        </button>
        <template v-if="isLoading"><span v-translate>Loading...</span>({{ totalResolved }} / {{ total }})</template>
      </div>
    </div>
  </div>
</template>

<script>
import PageSelector from './PageSelector';

const PRINT_IMAGES_TIMEOUT = 15000; // ms

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

  emits: ['set-image-printing', 'set-page-breaks', 'set-summary-visibility'],

  data() {
    return {
      totalResolved: 0,
      pageBreaks: false,
      imagePrinting: false,
      summaryVisibility: true,
      isPreparingPrint: false,
    };
  },

  computed: {
    offset() {
      return parseInt(this.$route.query.offset ?? 0);
    },
    total() {
      return this.promises.length;
    },
    isLoading() {
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
    // Images embedded in markdown are lazy loaded: the ones that were never scrolled into
    // view would be blank in the printout (some browsers don't load them when printing).
    // Load them first, and wait for them (at most PRINT_IMAGES_TIMEOUT) before printing.
    async print() {
      this.isPreparingPrint = true;

      const images = [...document.querySelectorAll('img[c2c\\:role=embedded-image]')].filter(
        (image) => !image.complete && image.offsetParent !== null
      );

      const loaded = images.map(
        (image) =>
          new Promise((resolve) => {
            image.addEventListener('load', resolve, { once: true });
            image.addEventListener('error', resolve, { once: true });
            image.loading = 'eager';
          })
      );
      const timeout = new Promise((resolve) => setTimeout(resolve, PRINT_IMAGES_TIMEOUT));
      await Promise.race([Promise.all(loaded), timeout]);

      this.isPreparingPrint = false;
      window.print();
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
