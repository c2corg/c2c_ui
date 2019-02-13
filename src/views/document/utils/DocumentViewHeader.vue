
<template>
  <div class="view-container">

    <loading-notification :promise="promise" />

    <div v-if="document && !document.not_authorized">
      <html-header v-if="!isDraftView" :title="title"/>

      <document-version-banner :version="version" :document="document" />

      <div class="box">
        <span v-if="!isDraftView" class="is-pulled-right button-bar no-print">

          <follow-button :document="document" />

          <social-network-sharing v-if="documentType!='profile' && isNormalView"/>

          <history-link
            v-if="documentType!='profile' || $user.isModerator || document.document_id === $user.id"
            :title="$gettext('History')"
            :document="document"
            :lang="lang">
            <icon-history />
          </history-link>

          <span
            :title="$gettext('Add images')"
            v-if="isEditable && documentType !== 'image'"
            @click="$refs.imagesUploader.show()">
            <icon-image />
          </span>

          <edit-link
            v-if="isEditable"
            :document="document"
            :lang="lang"
            :title="$gettext('Edit')">
            <icon-edit />
          </edit-link>
        </span>
        <div class="title is-1">
          <slot name="icon-document">
            <icon-document :document-type="documentType"/>
          </slot>
          <document-title :document="document"/>
          <!-- outing specific  -->
          <span v-if="documentType=='outing'" class="tag is-rounded is-primary is-size-6">
            {{ $documentUtils.getOutingDatesLocalized(document) }}
          </span>
        </div>
      </div>

      <images-uploader ref="imagesUploader" :lang="lang" :parent-document="document"/>
    </div>
  </div>
</template>

<script>
  import ImagesUploader from '@/components/images-uploader/ImagesUploader';
  import FollowButton from './FollowButton';
  import SocialNetworkSharing from './SocialNetworkSharing';
  import DocumentVersionBanner from './DocumentVersionBanner';

  import isEditableMixin from './is-editable-mixin';
  import viewModeMixin from './view-mode-mixin';

  export default {
    components: {
      ImagesUploader,
      FollowButton,
      SocialNetworkSharing,
      DocumentVersionBanner
    },

    mixins: [
      isEditableMixin,
      viewModeMixin
    ],

    props: {
      document: {
        type: Object,
        default: null
      },
      version: {
        type: Object,
        default: null
      },
      promise: {
        type: Object,
        required: true
      }
    },

    computed: {

      lang() {
        return this.document ? this.document.cooked.lang : null;
      },

      title() {
        return this.document ? this.$documentUtils.getDocumentTitle(this.document, this.lang) : undefined;
      },

      documentType() { // is-editable mixin needs this property
        return this.$documentUtils.getDocumentType(this.document.type);
      }
    }
  };

</script>

<style scoped lang="scss">

    @import '@/assets/sass/variables.scss';

    .button-bar{
        font-size:1.5rem;
    }

    .button-bar > a{
        color:$text;
    }

    .button-bar > span, .button-bar > a{
        margin-left:0.25rem;
        cursor:pointer;
    }
    .button-bar > *:hover{
        color:$black;
    }

    .title{
        .tag{
            margin-left:1rem;
            height: auto;
        }
    }

</style>
