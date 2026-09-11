<template>
  <button class="button is-primary is-size-7-mobile" @click="exportCsv">
    <fa-icon icon="file-download"></fa-icon>
    <span class="is-hidden-touch">&nbsp;</span>
    <span class="is-hidden-touch" v-translate>Export to CSV</span>
  </button>
</template>

<script>
import eventBus from '@/js/event-bus';

export default {
  methods: {
    exportCsv() {
      eventBus.emit('table-csv-export');
    },
  },
};
</script>
