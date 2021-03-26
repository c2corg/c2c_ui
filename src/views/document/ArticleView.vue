<template>
  <div class="section has-background-white-print">
    <document-view-header :document="document" :version="version" :promise="promise" />
    <div v-if="document" class="two-columns-doc">
      <div>
        <div class="box">
          <activities-field :document="document" />
          <field-view :document="document" :field="fields.categories" />
          <field-view :document="document" :field="fields.article_type" />
          <label-value v-if="document.author && document.article_type === 'personal'" :label="$gettext('contributor')">
            <author-link :author="document.author" />
          </label-value>
        </div>

        <tool-box :document="document" />
      </div>
      <div>
        <div class="box">
          <markdown-section :document="document" :field="fields.summary" />
          <markdown-section :document="document" :field="fields.description" hide-title />
          <div style="clear: both" />
        </div>

        <routes-box v-if="!isDraftView" :document="document" hide-buttons />
        <recent-outings-box v-if="!isDraftView" :document="document" />
        <images-box v-if="!isDraftView" :document="document" />
        <tool-box :document="document" v-if="$screen.isMobile" />
        <comments-box v-if="!isDraftView" :document="document" />
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
