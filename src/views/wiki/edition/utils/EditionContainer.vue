<template>
  <div v-if="document" class="section" :class="{preview: isPreview}">
    <div class="has-edition-width">
      <h1 class="title is-1">
        <icon-edit />
        <span v-if="mode === 'edit'">
          <html-header :title="$gettext('Edit a document')"/>
          <document-title :document="document"/>
          <span class="is-size-5"> ({{ $language.available[$route.params.lang] }})</span>
        </span>
        <span v-else>
          <html-header :title="$documentUtils.getCreationTitle(documentType)"/>
          {{ $documentUtils.getCreationTitle(documentType) | uppercaseFirstLetter }}
          <span>
            <dropdown-button>
              <span slot="button">
                {{ $language.available[document.locales[0].lang] }}
              </span>
              <div
                v-for="lang of Object.keys($language.available)"
                :key="lang"
                class="has-hover-background has-cursor-pointer"
                @click="document.locales[0].lang = lang">
                {{ $language.available[lang] }}
              </div>
            </dropdown-button>
          </span>
        </span>

        <button class="button is-size-6 is-pulled-right" @click="isPreview=!isPreview">
          <span v-show="isPreview">
            <fa-icon icon="edit" />
            <span>&nbsp;</span>
            <span v-translate>Back to edit mode</span>
          </span>
          <span v-show="!isPreview">
            <fa-icon icon="eye" />
            <span>&nbsp;</span>
            <span v-translate>Preview</span>
          </span>
        </button>
      </h1>

      <div v-for="(error, i) of genericErrors" :key="i" class="has-text-danger has-text-weight-bold">
        {{ error.name }}
        :
        {{ error.description }}
      </div>

    </div>

    <component :is="documentType + '-view'" v-if="isPreview" :draft="document"/>

    <div v-show="!isPreview" class="has-edition-width">
      <hr>

      <slot >
        ...
      </slot>

      <save-document-row @save="$emit('save', arguments[0])" @preview="isPreview=true" :is-loading="isLoading"/>
      <quality-input-row v-if="!['map', 'profile'].includes(documentType)" :document="document" />
    </div>
  </div>
</template>

<script>

  import FormRow from './FormRow';

  import AreaView from '@/views/document/AreaView';
  import ArticleView from '@/views/document/ArticleView';
  import BookView from '@/views/document/BookView';
  import ImageView from '@/views/document/ImageView';
  import MapView from '@/views/document/MapView';
  import OutingView from '@/views/document/OutingView';
  import RouteView from '@/views/document/RouteView';
  import WaypointView from '@/views/document/WaypointView';
  import XreportView from '@/views/document/XreportView';
  import ProfileView from '@/views/document/ProfileView';

  import QualityInputRow from './QualityInputRow';
  import SaveDocumentRow from './SaveDocumentRow';

  export default {

    components: {
      FormRow,
      AreaView,
      ArticleView,
      BookView,
      ImageView,
      MapView,
      OutingView,
      ProfileView,
      RouteView,
      WaypointView,
      XreportView,

      QualityInputRow,
      SaveDocumentRow
    },

    props: {
      document: {
        type: Object,
        default: null
      },
      genericErrors: {
        type: Array,
        required: true
      },
      mode: {
        type: String,
        required: true
      },
      isLoading: {
        type: Boolean,
        required: true
      }
    },

    data() {
      return {
        isPreview: false
      };
    },

    computed: {
      documentType() {
        return this.$documentUtils.getDocumentType(this.document.type);
      }
    },

    watch: {
      '$route': 'reset'
    },

    methods: {
      reset() {
        this.isPreview = false;
      }
    }
  };
</script>

<style scoped lang="scss">
  .preview{
    background: #ffffe0;
  }

  .has-edition-width{
    margin:auto;
    width: 100%;
    max-width: 1000px;
  }
</style>
