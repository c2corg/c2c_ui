<template>
  <div class="section has-background-white-print">
    <document-view-header :document="document" :version="version" :promise="promise" />
    <div v-if="document" class="columns">
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

        <div class="box">
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
    </div>
  </div>
</template>

<script>
import documentViewMixin from './utils/document-view-mixin';

export default {
  mixins: [documentViewMixin],
};
</script>
