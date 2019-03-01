<template>
  <div class="section has-background-white-print">
    <document-view-header :document="document" :version="version" :promise="promise" />
    <div v-if="document" class="columns">
      <div class="column is-3">
        <div class="box">
          <field-view :document="document" :field="fields.activities" />
          <field-view :document="document" :field="fields.categories" />
          <field-view :document="document" :field="fields.article_type" />
          <field-view :document="document" :field="fields.quality" />
        </div>

        <tool-box :document="document"/>
      </div>
      <div class="column is-9">
        <div class="box">
          <markdown-section :document="document" :field="fields.summary"/>
          <markdown-section :document="document" :field="fields.description" hide-title/>
          <div style="clear:both" />
        </div>

        <routes-box v-if="!isDraftView" :document="document"/>
        <recent-outings-box v-if="!isDraftView" :document="document"/>
        <images-box v-if="!isDraftView" :document="document"/>
        <comments-box v-if="!isDraftView" :document="document" />
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
