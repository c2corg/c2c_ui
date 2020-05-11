<template>
  <div class="view-container">
    <loading-notification :promise="promise" />

    <div v-if="document && !document.not_authorized">
      <html-header v-if="!isDraftView" :title="title" />

      <document-version-banner :version="version" :document="document" />

      <div class="box">
        <span v-if="!isDraftView" class="is-pulled-right button-bar no-print">
          <follow-button :document="document" />
          <tags-button :document="document" />

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
        <h1 class="title is-1">
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
            {{ $moment.toLocalizedString(document.date, 'LL') | uppercaseFirstLetter }}
          </span>
        </h1>
      </div>

      <images-uploader ref="imagesUploader" :lang="lang" :parent-document="document" />
    </div>
  </div>
</template>

<script>
import DocumentVersionBanner from './DocumentVersionBanner';
import FollowButton from './FollowButton';
import SocialNetworkSharing from './SocialNetworkSharing';
import TagsButton from './TagsButton';
import isEditableMixin from './is-editable-mixin';
import viewModeMixin from './view-mode-mixin';

import ImagesUploader from '@/components/images-uploader/ImagesUploader';

export default {
  components: {
    ImagesUploader,
    FollowButton,
    TagsButton,
    SocialNetworkSharing,
    DocumentVersionBanner,
  },

  mixins: [isEditableMixin, viewModeMixin],

  props: {
    document: {
      type: Object,
      default: null,
    },
    version: {
      type: Object,
      default: null,
    },
    promise: {
      type: Object,
      required: true,
    },
  },

  computed: {
    lang() {
      return this.document ? this.document.cooked.lang : null;
    },

    title() {
      return this.document ? this.$documentUtils.getDocumentTitle(this.document, this.lang) : undefined;
    },

    documentType() {
      // is-editable mixin needs this property
      return this.$documentUtils.getDocumentType(this.document.type);
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables.scss';

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
