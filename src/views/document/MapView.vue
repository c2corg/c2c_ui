<template>
  <div class="section has-background-white-print">
    <document-view-header :document="document" :version="version" :promise="promise" />
    <div v-if="document">
      <div class="box">
        <div class="columns">
          <div class="column is-3">
            <field-view :document="document" :field="fields.editor" />
          </div>
          <div class="column is-3">
            <field-view :document="document" :field="fields.code" />
          </div>
          <div class="column is-3">
            <field-view :document="document" :field="fields.scale" />
          </div>
        </div>
      </div>

      <markdown-section :document="document" :field="fields.summary" />

      <markdown-section :document="document" :field="fields.description" hide-title />

      <comments-box :document="document" />
    </div>
  </div>
</template>

<script>
import documentViewMixin from './utils/document-view-mixin.js';

export default {
  mixins: [documentViewMixin],
};
</script>
