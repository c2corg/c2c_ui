<template>
  <div class="section">
    <html-header :title="$gettext('Offline documents')" />
    <h1 class="title is-size-3" v-translate>Offline documents</h1>

    <offline-documents />
  </div>
</template>

<script>
import OfflineDocuments from './OfflineDocuments';

export default {
  name: 'Offline',

  components: {
    OfflineDocuments,
  },
};
</script>

<style scoped lang="scss">
.title {
  line-height: 1.5em;
}
</style>
