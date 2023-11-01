<template>
  <div class="section has-background-white-print">
    <loading-notification :promise="promise" />
    <masked-document-version-info
      v-if="document === null"
      :version="version"
      :document-type="documentType"
    ></masked-document-version-info>
    <advertisement-small v-if="$screen.isMobile" />
    <document-view-header v-if="document" :document="document" :version="version" />
    <div v-if="document" class="columns is-block-print">
      <div class="column is-3 is-12-print">
        <advertisement-small v-if="$screen.isTablet || $screen.isDesktop" />
        <div class="box">
          <activities-field :document="document" />
          <field-view :document="document" :field="fields.categories" />
          <field-view :document="document" :field="fields.article_type" />
          <label-value v-if="document.author && document.article_type === 'personal'" :label="$gettext('contributor')">
            <author-link :author="document.author" />
          </label-value>
        </div>

        <tool-box :document="document" v-if="!$screen.isMobile" />
      </div>
      <div class="column is-9 is-12-print">
        <div class="box">
          <low-document-quality-banner
            v-if="isEditable && ['empty', 'draft'].includes(document.quality)"
            :document="document"
          />
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
      <document-print-license :document="document" />
    </div>
  </div>
</template>

<script>
import AdvertisementSmall from '../AdvertisementSmall.vue';

import LowDocumentQualityBanner from './utils/LowDocumentQualityBanner';
import MaskedDocumentVersionInfo from './utils/MaskedDocumentVersionInfo';
import documentViewMixin from './utils/document-view-mixin';

export default {
  components: {
    AdvertisementSmall,
    LowDocumentQualityBanner,
    MaskedDocumentVersionInfo,
  },

  mixins: [documentViewMixin],
};
</script>

<style scoped lang="scss">
@media screen and (min-width: $tablet) and (max-width: $widescreen) {
  .is-3 {
    width: calc(300px + 2 * 0.75rem) !important;
    flex-grow: 0;
    flex-shrink: 0;
  }

  .is-9 {
    flex: 1 1 auto !important;
  }
}
</style>
