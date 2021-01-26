<template>
  <button class="button is-primary" @click="exportCsv">
    <fa-icon icon="file-download"></fa-icon>
    <span class="is-hidden-touch">&nbsp;</span>
    <span class="is-hidden-touch" v-translate>Export to CSV</span>
  </button>
</template>
<script>
export default {
  methods: {
    exportCsv() {
      this.$root.$emit('table-csv-export');
    },
  },
};
</script>
<style lang="scss" scoped></style>
