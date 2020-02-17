<template>
  <edition-container
    :mode="mode"
    :document="document"
    :generic-errors="genericErrors"
    :is-loading="saving"
    @save="save">
    <div class="columns is-multiline">
      <form-field :document="document" :field="fields.title" is-expanded />
      <form-field class="is-narrow" :document="document" :field="fields.article_type" />
      <form-field class="is-12" :document="document" :field="fields.activities" />
      <form-field class="is-8" :document="document" :field="fields.categories" />
      <quality-field ref="qualityField" class="is-4" :document="document" />
      <form-field class="is-12" :document="document" :field="fields.summary" />
      <form-field class="is-12" :document="document" :field="fields.description" />
    </div>

    <associations-input-row :document="document" :field="fields.articles" />
    <associations-input-row :document="document" :field="fields.waypoints" />
    <associations-input-row :document="document" :field="fields.outings" />
    <associations-input-row :document="document" :field="fields.routes" />
    <associations-input-row :document="document" :field="fields.books" />

    <hr>
  </edition-container>
</template>

<script>

  import documentEditionViewMixin from './utils/document-edition-view-mixin';

  export default {

    mixins: [ documentEditionViewMixin ],

    methods: {
      beforeSave() {
        this.$refs.qualityField.beforeSave();
      }
    }
  };

</script>
