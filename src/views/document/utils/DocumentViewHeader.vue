<template>
  <div class="view-container">
    <div v-if="!document.not_authorized">
      <html-header v-if="!isDraftView && !isPrintingView" :title="title" />

      <document-version-banner :version="version" :document="document" />
      <div class="columns">
        <div class="column is-narrow" v-if="previousDocument">
          <document-link :document="previousDocument" class="box">&lt;</document-link>
        </div>
        <div class="box column">
          <span v-if="!isDraftView" class="is-pulled-right button-bar no-print">
            <gotop-button v-if="isPrintingView" />
            <follow-button v-if="!isPrintingView" :document="document" />
            <tags-button v-if="!isPrintingView" :document="document" />

            <social-network-sharing v-if="documentType != 'profile' && isNormalView" />

            <span
              :title="$gettext('Add images')"
              v-if="isEditable && documentType !== 'image'"
              @click="$refs.imagesUploader.show()"
            >
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
          <h1 class="column title">
            <slot name="icon-document">
              <icon-document :document-type="documentType" />
            </slot>
            <document-title :document="document" uppercase-first-letter />

            <!-- outing specific  -->
            <span v-if="documentType == 'outing'" class="outing-date is-size-5">
              {{ $documentUtils.getOutingDatesLocalized(document) | uppercaseFirstLetter }}
            </span>

            <!-- xreport specific  -->
            <span v-else-if="documentType == 'xreport'" class="outing-date is-size-5">
              {{ $dateUtils.toLocalizedString(document.date, 'll') | uppercaseFirstLetter }}
            </span>
          </h1>
        </div>
        <div class="column is-narrow" v-if="nextDocument">
          <document-link :document="nextDocument" class="box">&gt;</document-link>
        </div>
      </div>
      <images-uploader ref="imagesUploader" :lang="lang" :parent-document="document" />
    </div>
  </div>
</template>

<script>
import DocumentVersionBanner from './DocumentVersionBanner';
import FollowButton from './FollowButton';
import GotopButton from './GotopButton';
import SocialNetworkSharing from './SocialNetworkSharing';
import TagsButton from './TagsButton';

import ImagesUploader from '@/components/images-uploader/ImagesUploader';
import isEditableMixin from '@/js/is-editable-mixin';
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  components: {
    ImagesUploader,
    FollowButton,
    GotopButton,
    TagsButton,
    SocialNetworkSharing,
    DocumentVersionBanner,
  },

  mixins: [isEditableMixin, requireDocumentProperty],

  props: {
    version: {
      type: Object,
      default: null,
    },
    previousDocument: {
      type: Object,
      default: null,
    },
    nextDocument: {
      type: Object,
      default: null,
    },
  },

  computed: {
    lang() {
      return this.document.cooked.lang;
    },

    title() {
      return this.$documentUtils.getDocumentTitle(this.document, this.lang);
    },
  },
};
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
