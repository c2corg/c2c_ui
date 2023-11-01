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
    <div v-if="document">
      <div class="box">
        <div class="columns">
          <div class="column is-3">
            <advertisement-small v-if="$screen.isTablet || $screen.isDesktop" />
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
import AdvertisementSmall from '../AdvertisementSmall.vue';

import MaskedDocumentVersionInfo from './utils/MaskedDocumentVersionInfo';
import documentViewMixin from './utils/document-view-mixin';

export default {
  components: {
    AdvertisementSmall,
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
