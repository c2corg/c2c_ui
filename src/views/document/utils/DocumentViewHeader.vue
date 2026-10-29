<template>
  <div class="view-container">
    <div v-if="!document.not_authorized">
      <html-header v-if="!isDraftView && !isPrintingView" :title="title" />

      <document-version-banner :version="version" :document="document" />

      <div class="box">
        <span v-if="!isDraftView" class="is-pulled-right button-bar no-print">
          <gotop-button v-if="isPrintingView" />
          <follow-button v-if="!isPrintingView" :document="document" />
          <tags-button v-if="!isPrintingView" :document="document" />

          <social-network-sharing v-if="documentType != 'profile' && isNormalView" :document="document" />

          <span :title="$gettext('Add images')" v-if="isEditable && documentType !== 'image'" @click="uploader?.show()">
            <fa-layers>
              <fa-icon icon="image" />
              <fa-icon icon="circle" :style="{ color: 'white' }" transform="shrink-5 right-5 up-6" />
              <fa-icon icon="plus-circle" :style="{ color: 'green' }" transform="shrink-5 right-5 up-5" />
            </fa-layers>
          </span>

          <edit-link v-if="isEditable" :document="document" :lang="lang" :title="$gettext('Edit')">
            <icon-edit />
          </edit-link>
        </span>
        <h1 class="title is-1">
          <slot name="icon-document">
            <icon-document :document-type="documentType" />
          </slot>
          <document-title :document="document" uppercase-first-letter />

          <!-- outing specific  -->
          <span v-if="documentType == 'outing'" class="outing-date is-size-5">
            {{ $filters.uppercaseFirstLetter($documentUtils.getOutingDatesLocalized(document)) }}
          </span>

          <!-- xreport specific  -->
          <span v-else-if="documentType == 'xreport'" class="outing-date is-size-5">
            {{ $filters.uppercaseFirstLetter($dateUtils.toLocalizedString(document.date, 'll')) }}
          </span>
        </h1>
      </div>

      <images-uploader ref="uploader" :lang="lang" :parent-document="document" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';

import DocumentVersionBanner from './DocumentVersionBanner.vue';
import FollowButton from './FollowButton.vue';
import GotopButton from './GotopButton.vue';
import SocialNetworkSharing from './SocialNetworkSharing.vue';
import TagsButton from './TagsButton.vue';

import ImagesUploader from '@/components/images-uploader/ImagesUploader.vue';
import { useEditable } from '@/js/composables/editable';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { documentProperty, useDocumentType } from '@/js/properties';

const props = defineProps({
  ...documentProperty,
  version: {
    type: Object,
    default: null,
  },
});

const { $documentUtils } = useGlobalProperties();
const { documentType } = useDocumentType(props);
const { isDraftView, isPrintingView, isNormalView, isEditable } = useEditable(() => props.document);

const uploader = useTemplateRef<InstanceType<typeof ImagesUploader>>('uploader');

const lang = computed(() => props.document.cooked.lang);

const title = computed(() => $documentUtils.getDocumentTitle(props.document, lang.value));
</script>

<style scoped lang="scss">
.button-bar {
  font-size: 1.5rem;
}

.button-bar > a {
  color: $text;
}

.button-bar > span,
.button-bar > a {
  margin-left: 0.25rem;
  cursor: pointer;
}
.button-bar > *:hover {
  color: $black;
}

.title {
  .outing-date {
    margin-left: 0.5rem;
  }
}

@media print {
  .title {
    font-size: 1.5rem !important;
  }
}
</style>
