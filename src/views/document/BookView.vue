<template>
  <div class="section has-background-light has-background-white-print">
    <document-view-header :document="document" :version="version" :promise="promise" />
    <div v-if="document" class="columns">
      <div class="column is-3">
        <div class="box">
          <label-value :label="$gettext('activities')">
            <activities :activities="document.activities"/>
          </label-value>

          <field-view :document="document" :field="fields.author"/>

          <field-view :document="document" :field="fields.book_types"/>

          <field-view :document="document" :field="fields.editor"/>
          <field-view :document="document" :field="fields.langs"/>
          <field-view :document="document" :field="fields.isbn"/>
          <field-view :document="document" :field="fields.nb_pages"/>
          <field-view :document="document" :field="fields.publication_date"/>
          <field-view :document="document" :field="fields.url" style="overflow:hidden"/>
          <field-view :document="document" :field="fields.quality"/>
        </div>

        <tool-box :document="document"/>

      </div>

      <div class="column is-9">
        <div class="box">
          <markdown-section :document="document" :field="fields.summary"/>
          <markdown-section :document="document" :field="fields.description" hide-title/>
          <div style="clear:both" />
        </div>

        <routes-box :document="document" hide-buttons/>

        <images-box :document="document"/>

        <comments-box :document="document" />
      </div>
    </div>
  </div>
</template>

<script>
  import documentViewMixin from './utils/document-view-mixin.js';

  export default {
    mixins: [ documentViewMixin ]
  };
</script>
