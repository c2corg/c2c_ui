<template>
  <div class="section has-background-light has-background-white-print">
    <document-view-header :document="document" :version="version" :promise="promise" />
    <div v-if="document">
      <div class="columns">
        <div class="column is-3">
          <label>editor</label>
          <span>{{ document.editor }}</span>
        </div>
        <div class="column is-3">
          <label>code</label>
          <span>{{ document.code }}</span>
        </div>
        <div class="column is-3">
          <label>Scale</label>
          <span>{{ document.scale }}</span>
        </div>
      </div>

      <markdown-section
        :document="document"
        :field="fields.summary"/>

      <markdown-section
        :document="document"
        :field="fields.description"
        hide-title/>

      <comments-box :document="document" />

    </div>
  </div>
</template>

<script>
  import documentViewMixin from './utils/document-view-mixin.js';

  export default {
    mixins: [ documentViewMixin ]
  };
</script>
