<template>
  <div class="view-container">
    <div v-if="!document.not_authorized">
      <html-header v-if="!isDraftView && !isPrintingView" :title="title" />

      <!-- not a private profile: the document is cooked -->
      <document-version-banner :version="version" :document="document as CookedDocument" />

      <div class="box">
        <span v-if="!isDraftView" class="is-pulled-right button-bar no-print">
          <!-- phone only: the date shares the line of the buttons -->
          <span v-if="headerDate" class="bar-date">
            <!-- "28 dic 2025", "– 2 ene 2026": the dash between two dates starts the second part -->
            <template v-for="(part, i) in headerDate.split(/ (?=[-–] )/)" :key="i">
              <!-- the space between the parts, where the range may break, would be dropped as template whitespace -->
              {{ i ? ' ' : '' }}<span class="bar-date-part">{{ part }}</span>
            </template>
          </span>
          <gotop-button v-if="isPrintingView" />
          <follow-button v-if="!isPrintingView" :document="document" />

          <add-link
            v-if="isNormalView && documentType === 'route'"
            document-type="outing"
            :query="{ r: document.document_id }"
            class="add-my-outing"
          >
            <fa-icon icon="plus" />&nbsp;{{ $gettext('Add my outing') }}
          </add-link>
          <favourite-button
            v-if="isNormalView && SAVABLE_TYPES.includes(documentType)"
            :document-type="documentType"
            :document-id="document.document_id!"
            :lang="lang!"
            :title="title"
          />
          <social-network-sharing v-if="documentType != 'profile' && isNormalView" :document="document" />

          <span :title="$gettext('Add images')" v-if="isEditable && documentType !== 'image'" @click="uploader?.show()">
            <fa-layers>
              <!-- the image glyph stops 1/16 em above the baseline of the other icons: down to it -->
              <fa-icon icon="image" transform="down-1" />
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

          <span v-if="headerDate" class="outing-date is-size-5" :class="{ 'has-bar-date': !isDraftView }">
            {{ headerDate }}
          </span>
        </h1>
      </div>

      <images-uploader ref="uploader" :lang="lang!" :parent-document="document" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';

import DocumentVersionBanner from './DocumentVersionBanner.vue';
import FavouriteButton from './FavouriteButton.vue';
import FollowButton from './FollowButton.vue';
import GotopButton from './GotopButton.vue';
import SocialNetworkSharing from './SocialNetworkSharing.vue';

import ImagesUploader from '@/components/images-uploader/ImagesUploader.vue';
import { useEditable } from '@/js/composables/editable';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { documentProperty, useDocumentType } from '@/js/properties';
import type { CookedDocument } from '@/js/vue-plugins/document-utils';
import { SAVABLE_TYPES } from '@/pwa/offline-store';

const props = defineProps({
  // a private profile has no cooked locale: the header then shows nothing
  ...documentProperty,
  version: {
    type: Object,
    default: null,
  },
});

const { $documentUtils, $filters, $dateUtils } = useGlobalProperties();
const { documentType } = useDocumentType(props);
const { isDraftView, isPrintingView, isNormalView, isEditable } = useEditable(() => props.document);

const uploader = useTemplateRef<InstanceType<typeof ImagesUploader>>('uploader');

const lang = computed(() => props.document.cooked?.lang);

// outing dates, or xreport date
const headerDate = computed(() => {
  if (documentType.value === 'outing') {
    return $filters.uppercaseFirstLetter($documentUtils.getOutingDatesLocalized(props.document));
  }
  if (documentType.value === 'xreport') {
    return $filters.uppercaseFirstLetter($dateUtils.toLocalizedString(props.document.date, 'll'));
  }
  return null;
});

const title = computed(() => $documentUtils.getDocumentTitle(props.document, lang.value));
</script>

<style scoped>
@import '@/assets/css/media.css';

/* the space between the buttons is a gap of the bar, not a margin of each: the scoped margin missed the components
   with several roots (the favourite button and its dialog), which stuck to their neighbour */
.button-bar {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 1.5rem;
}

.button-bar > a {
  color: var(--c2c-text);
}

/* the outing of this route, in one tap */
.button-bar > a.add-my-outing {
  display: inline-flex;
  align-items: center;
  /* as high as the icons beside it (the 1.5rem font size of the bar), level with them */
  height: 1.5rem;
  padding: 0 0.6rem;
  border-radius: 999px;
  background: var(--c2c-primary);
  color: var(--c2c-white);
  font-size: 0.95rem;
  font-weight: 600;
  vertical-align: text-top;
}

.button-bar > span,
.button-bar > a {
  cursor: pointer;
}

/* a button with nothing to show (no sharing on this browser) leaves no double gap */
.button-bar > :empty {
  display: none;
}

/* every icon in a box of the same width (Font Awesome's fixed width): the glyphs are not as wide (bookmark, share,
   image, pen), and the badges of the bookmark and of the image overflow them, which left the last ones too close */
.button-bar :deep(.svg-inline--fa),
.button-bar :deep(.fa-layers) {
  width: 1.25em;
}

.button-bar > *:hover {
  color: var(--c2c-black);
}

.title {
  .outing-date {
    margin-left: 0.5rem;
  }
}

.bar-date {
  display: none !important;
}

/* on a phone the buttons take their own line, above the title: floated beside it, they left a long title a few
   letters per line ("Aig / uille de la République") */
@media screen and (--c2c-max-tablet) {
  .button-bar {
    float: none !important;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    align-items: center;
    /* tighter than on a wider screen: "Ajouter ma sortie" and four buttons fit in 320px */
    gap: 0.25rem;
    margin-bottom: 0.5rem;
  }

  /* takes the room the buttons leave: the buttons keep their line, a long date goes on two */
  .bar-date {
    display: inline !important;
    flex: 1 1 0;
    margin-left: 0 !important;
    font-size: 1rem;
    cursor: default !important;
  }

  /* a range breaks at its dash first, inside one of its dates only when that date alone is too long */
  .bar-date-part {
    display: inline-block;
  }

  /* the left of the button line, as the date of an outing. It takes the room the buttons leave, up to its text: a
     long text ("Meinen Tourenbericht hinzufügen") goes on two lines rather than push the buttons to the next */
  .button-bar > a.add-my-outing {
    order: -1;
    flex: 1 1 0;
    max-width: max-content;
    height: auto;
    min-height: 1.5rem;
    margin-left: 0;
    margin-right: auto;
    padding: 0.1rem 0.35rem;
    border-radius: 0.75rem;
    line-height: 1.15;
  }

  .title .outing-date.has-bar-date {
    display: none;
  }
}

@media print {
  .title {
    font-size: 1.5rem !important;
  }
}
</style>
