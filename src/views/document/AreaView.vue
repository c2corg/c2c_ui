<template>
  <div class="section has-background-white-print">
    <loading-notification :promise="promise" />
    <masked-document-version-info
      v-if="document === null"
      :version="version"
      :document-type="documentType"
    ></masked-document-version-info>
    <document-view-header
      v-if="document"
      :previous-document="previousDocument"
      :next-document="nextDocument"
      :document="document"
      :version="version"
    />
    <div v-if="document" class="columns print-no-columns">
      <div class="column is-3">
        <div class="box">
          <field-view :document="document" :field="fields.area_type" />
        </div>
        <map-box :document="document" />
        <tool-box :document="document" v-if="!$screen.isMobile" />
      </div>

      <div class="column is-9">
        <div class="box" v-if="document.cooked.summary || document.cooked.description">
          <markdown-section :document="document" :field="fields.summary" />
          <markdown-section :document="document" :field="fields.description" />
          <div style="clear: both" />
        </div>

        <div class="box no-print">
          <div class="level is-mobile">
            <div
              class="level-item has-text-centered"
              v-for="documentType of ['waypoint', 'route', 'outing']"
              :key="documentType"
            >
              <router-link :to="{ name: documentType + 's', query: { a: documentId } }" class="">
                <div>
                  <icon-document class="is-size-1" :document-type="documentType.toLowerCase()" />
                </div>
                <p>{{ $gettext(documentType + 's') | uppercaseFirstLetter }}</p>
              </router-link>
            </div>
          </div>
        </div>

        <images-box :document="document" />

        <tool-box :document="document" v-if="$screen.isMobile" />

        <comments-box :document="document" />
      </div>
      <document-print-license :document="document" />
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
