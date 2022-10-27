<template>
  <div class="section has-background-white-print">
    <loading-notification :promise="promise" />
    <document-view-header v-if="document" :document="document" :version="version" />
    <div v-if="document" class="columns is-block-print">
      <div class="column is-3 is-12-print">
        <div class="box">
          <activities-field :document="document" />
          <field-view :document="document" :field="fields.author" />
          <field-view :document="document" :field="fields.book_types" />
          <field-view :document="document" :field="fields.editor" />
          <field-view :document="document" :field="fields.langs" />
          <field-view :document="document" :field="fields.isbn" />
          <field-view :document="document" :field="fields.nb_pages" />
          <field-view :document="document" :field="fields.publication_date" />
          <field-view :document="document" :field="fields.url" style="overflow: hidden" />
        </div>

        <map-box v-if="document.associations.waypoints.length" :document="document" />

        <tool-box :document="document" v-if="!$screen.isMobile" />
      </div>

      <div class="column is-9">
        <div class="box">
          <markdown-section :document="document" :field="fields.summary" />
          <markdown-section :document="document" :field="fields.description" hide-title />
          <div style="clear: both" />
        </div>

        <routes-box :document="document" hide-buttons />

        <images-box :document="document" />

        <tool-box :document="document" v-if="$screen.isMobile" />

        <comments-box :document="document" />
      </div>
    </div>
  </div>
</template>

<script>
import documentViewMixin from './utils/document-view-mixin';

export default {
  mixins: [documentViewMixin],
};
</script>
