<template>
  <div class="section has-background-white-print">
    <loading-notification :promise="promise" />
    <masked-document-version-info
      v-if="document === null"
      :version="version"
      :document-type="documentType"
    ></masked-document-version-info>
    <document-view-header v-if="document" :document="document" :version="version" />

    <div v-if="document && document.not_authorized" v-translate class="notification is-danger">
      This profile is only available to authenticated users.
    </div>

    <div v-if="document && !document.not_authorized" class="columns">
      <div class="column is-3">
        <div class="box">
          <activities-field v-if="document.activities && document.activities.length" :document="document" />

          <label-value :label="$gettext('forum')">
            <a :href="forumUrl + '/u/' + document.forum_username + '/activity'"> @{{ document.forum_username }} </a>
          </label-value>

          <field-view :document="document" :field="fields.categories" />

          <div class="buttons is-centered button-outings">
            <outings-downloader :profile-id="documentId" />
          </div>
        </div>

        <map-box :document="document" v-if="document.geometry && document.geometry.geom" />
        <tool-box :document="document" />
      </div>

      <div class="column is-9">
        <div class="box" v-if="locale.summary || locale.description">
          <markdown-section :document="document" :field="fields.summary" />
          <markdown-section :document="document" :field="fields.description" hide-title />
          <div style="clear: both" />
        </div>

        <images-box :document="document" />

        <feed-widget type="profile" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DocumentViewHeader from './utils/DocumentViewHeader.vue';
import MaskedDocumentVersionInfo from './utils/MaskedDocumentVersionInfo.vue';
import OutingsDownloader from './utils/OutingsDownloader.vue';
import ImagesBox from './utils/boxes/ImagesBox.vue';
import MapBox from './utils/boxes/MapBox.vue';
import ToolBox from './utils/boxes/ToolBox.vue';
import { documentViewProps, useDocumentView } from './utils/document-view';
import ActivitiesField from './utils/field-viewers/ActivitiesField.vue';
import FieldView from './utils/field-viewers/FieldView.vue';
import LabelValue from './utils/field-viewers/LabelValue.vue';
import MarkdownSection from './utils/field-viewers/MarkdownSection.vue';

import FeedWidget from '@/components/feed-widget/FeedWidget.vue';
import config from '@/js/config';

const props = defineProps(documentViewProps);

const { promise, documentId, documentType, fields, document, version, locale } = useDocumentView(props);

const forumUrl = config.urls.forum;
</script>

<style lang="scss" scoped>
.button-outings {
  margin-top: 1rem;
}
</style>
