<template>
  <div v-if="document" class="section" :class="{ preview: isPreview }">
    <div class="has-edition-width">
      <h1 class="title is-1">
        <icon-edit />
        <span v-if="mode === 'edit'">
          <html-header :title="$gettext('Edit a document')" />
          <document-title :document="document" />
          <span class="is-size-5"> ({{ $language.availableAPI[$route.params.lang as string] }})</span>
        </span>
        <span v-else>
          <html-header :title="$documentUtils.getCreationTitle(documentType)" />
          {{ $filters.uppercaseFirstLetter($documentUtils.getCreationTitle(documentType)) }}
          <span>
            <dropdown-button>
              <template #button>
                <span class="button">
                  <span> {{ $language.availableAPI[document.locales![0].lang] }}&nbsp; </span>
                  <fa-icon icon="angle-down" aria-hidden="true" />
                </span>
              </template>
              <div
                v-for="lang of constants.langs"
                :key="lang"
                class="dropdown-item has-hover-background has-cursor-pointer"
                @click="document.locales![0].lang = lang"
              >
                {{ $language.availableAPI[lang] }}
              </div>
            </dropdown-button>
          </span>
        </span>

        <button class="button is-size-6 is-pulled-right" @click="isPreview = !isPreview">
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

      <!-- On mobile, expand button may go too low -->
      <div style="clear: both" />
    </div>

    <component :is="documentViews[documentType]" v-if="isPreview" :draft="document" />

    <div v-show="!isPreview" class="has-edition-width">
      <hr />

      <slot> ... </slot>

      <save-document-row @save="$emit('save', $event)" @preview="isPreview = true" :is-loading="isLoading" />
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-if="banners[documentType]" v-html="banners[documentType]" class="edition-banner" />
    </div>
  </div>
</template>

<script lang="ts">
const BANNERS_ARTICLE_ID = 1110927;

// the banners of the edition views, per document type, in HTML
type Banners = { initialized: boolean; [documentType: string]: string | boolean };
// cache for banners, shared by the edition views (<script setup> runs per instance)
let htmlBanners: Banners = { initialized: false };
</script>

<script setup lang="ts">
import { computed, onMounted, ref, watch, type Component, type PropType } from 'vue';
import { useRoute } from 'vue-router';

import SaveDocumentRow from './SaveDocumentRow.vue';

import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import { useGlobalProperties } from '@/js/composables/global-properties';
import constants from '@/js/constants';
import { sanitizeRichHtml } from '@/js/sanitize-html';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';
import AreaView from '@/views/document/AreaView.vue';
import ArticleView from '@/views/document/ArticleView.vue';
import BookView from '@/views/document/BookView.vue';
import ImageView from '@/views/document/ImageView.vue';
import MapView from '@/views/document/MapView.vue';
import OutingView from '@/views/document/OutingView.vue';
import ProfileView from '@/views/document/ProfileView.vue';
import RouteView from '@/views/document/RouteView.vue';
import WaypointView from '@/views/document/WaypointView.vue';
import XreportView from '@/views/document/XreportView.vue';

// the preview of the document, per document type (the global map-view is the map component)
const documentViews: Record<string, Component> = {
  area: AreaView,
  article: ArticleView,
  book: BookView,
  image: ImageView,
  map: MapView,
  outing: OutingView,
  profile: ProfileView,
  route: RouteView,
  waypoint: WaypointView,
  xreport: XreportView,
};

const props = defineProps({
  document: {
    type: Object as PropType<C2cDocument>,
    default: null,
  },
  mode: {
    type: String,
    required: true,
  },
  isLoading: {
    type: Boolean,
    required: true,
  },
});

defineEmits(['save']);

const route = useRoute();
const { $documentUtils, $language } = useGlobalProperties();

const isPreview = ref(false);
const banners = ref<Banners>(htmlBanners);

const documentType = computed(() => $documentUtils.getDocumentType(props.document.type));

watch(
  () => route.fullPath,
  () => {
    isPreview.value = false;
  }
);

function computeBanners(response: { data: object }) {
  // getCooked is typed with the common fields of the documents, which have no cooked locale (the article schema has)
  const cooked = (response.data as { cooked: { description: string } }).cooked;

  // cooked.description is HTML converted from a wiki article's user-authored
  // markdown (banners article): sanitize it before injecting it in the DOM. The
  // resulting htmlBanners fragments (built from this sanitized DOM's outerHTML
  // below) stay safe when later bound with v-html.
  const content = window.document.createElement('div');
  content.innerHTML = sanitizeRichHtml(cooked.description);

  let key: string | undefined;
  htmlBanners = { initialized: true, undefined: '' };

  for (const node of content.children) {
    const isHeader = node.nodeName.match(/^[hH]3$/);

    if (isHeader) {
      key = node.id;
      htmlBanners[key] = '';
    } else {
      htmlBanners[String(key)] += node.outerHTML;
    }
  }
  banners.value = htmlBanners;
}

onMounted(() => {
  if (!htmlBanners.initialized) {
    (c2c.article as DocumentService).getCooked(BANNERS_ARTICLE_ID, $language.current!).then(computeBanners, () => {
      // banners are optional: the form works without them. Cache is left
      // uninitialized, so that next edit view tries again.
    });
  }
});
</script>

<style scoped lang="scss">
.preview {
  background: #ffffe0;
}

.has-edition-width {
  margin: auto;
  width: 100%;
  max-width: 1000px;
}

.edition-banner {
  margin-top: 1.5rem;
  border: 3px dashed pink;
  padding: 0.5rem;
}
</style>
