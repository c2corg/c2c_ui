<template>
  <edition-container
    :mode="mode"
    :document="document"
    :generic-errors="genericErrors"
    :is-loading="saving"
    @save="save">
    <div class="columns">
      <form-field :document="document" :field="fields.title"/>
      <form-field class="is-narrow" :document="document" :field="fields.area_type"/>
    </div>
    <map-input-row v-if="$user.isModerator" :document="document" geom-detail-editable/>
    <div class="columns is-multiline">
      <form-field class="is-12" :document="document" :field="fields.summary"/>
      <form-field class="is-12" :document="document" :field="fields.description"/>
    </div>

    <hr>
  </edition-container>
</template>

<script>

  import documentEditionViewMixin from './utils/document-edition-view-mixin.js';

  export default {

    mixins: [ documentEditionViewMixin ],

    methods: {
      beforeSave() {
        if (!this.$user.isModerator) {
          // need to delete geomtry : API won't allow any modification otherwise
          delete this.document.geometry;
        }
      }
    }
  };
</script>
