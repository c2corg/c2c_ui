<template>
  <edition-container :mode="mode" :document="document" :is-loading="saving" @save="save">
    <div class="columns is-multiline">
      <form-field class="is-12" :document="document" :field="fields.activities" />
      <form-field class="is-12" :document="document" :field="fields.categories" />
      <form-field class="is-12" :document="document" :field="fields.summary" />
      <form-field class="is-12" :document="document" :field="fields.description" />
    </div>

    <map-input-row :document="document" ref="map" />

    <hr />
  </edition-container>
</template>

<script>
import { documentEditionComponents, useDocumentEdition } from './utils/document-edition';

export default {
  components: { ...documentEditionComponents },

  setup() {
    return useDocumentEdition();
  },

  watch: {
    'document.geometry.geom': function (to, from) {
      if (from === null && to) {
        this.$nextTick(() => {
          this.$refs.map.fitMapToDocuments();
        });
      }
    },
  },
};
</script>
