<template>
  <edition-container :mode="mode" :document="document" :is-loading="saving" @save="save">
    <div class="columns is-multiline">
      <form-field class="is-12" :document="document" :field="fields.activities" />
      <form-field class="is-12" :document="document" :field="fields.categories" />
      <form-field class="is-12" :document="document" :field="fields.summary" />
      <form-field class="is-12" :document="document" :field="fields.description" />
    </div>

    <map-input-row :document="document" />

    <hr />
  </edition-container>
</template>

<script>
import documentEditionViewMixin from './utils/document-edition-view-mixin';

export default {
  mixins: [documentEditionViewMixin],
};
</script>
