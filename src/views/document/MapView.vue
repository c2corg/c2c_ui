<template>
  <div class="section has-background-white-print">
    <loading-notification :promise="promise" />
    <masked-document-version-info
      v-if="document === null"
      :version="version"
      :document-type="documentType"
    ></masked-document-version-info>
    <document-view-header v-if="document" :document="document" :version="version" />
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
import MaskedDocumentVersionInfo from './utils/MaskedDocumentVersionInfo';
import documentViewMixin from './utils/document-view-mixin';

export default {
  components: {
    MaskedDocumentVersionInfo,
  },

  mixins: [documentViewMixin],
};
</script>
