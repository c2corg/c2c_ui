<template>
  <div class="box no-print">
    <associated-documents :document="document" />

    <div class="has-text-centered" v-if="isNormalView && availableLangs.length">
      <span v-translate>View in other lang</span>
      <br />
      <span class="lang-switcher-box-list">
        <span v-for="l of availableLangs" :key="l">
          <document-link :document="document" :lang="l">
            {{ $gettext(l, 'langs') }}
          </document-link>
        </span>
      </span>
      <hr />
    </div>

    <tool-box-button
      v-if="shouldAddWheatherLink"
      :href="linkToMeteoBlue"
      :label="$gettext('Weather forecast (meteoblue)')"
      icon="sun"
    />

    <tool-box-button
      v-if="shouldAddDirections"
      :href="linkToGoogleMapsDirections"
      :label="$gettext('Directions (Google Maps)')"
      icon="directions"
    />

    <tool-box-button
      v-if="document.geometry && document.geometry.geom && documentType !== 'area'"
      :to="linkToClosestDocuments"
      :label="$gettext('See other documents nearby')"
      icon="compass"
    />

    <tool-box-button
      v-if="document.type === 'w' && document.waypoint_type === 'paragliding_takeoff'"
      :to="linkToParaglidingOutings"
      :label="$gettext('Paragliding outings')"
      :icon="['miscs', 'paragliding']"
    />

    <tool-box-button
      v-if="fundraiser"
      :label="$gettext('Contribute to maintainance')"
      :href="fundraiser.url"
      icon-class="has-text-danger"
      :icon="['miscs', 'drill']"
    />

    <tool-box-button
      v-if="documentType === 'profile'"
      :to="{ name: 'outings', query: { u: document.document_id } }"
      :label="$gettext('outings')"
    >
      <template #icon>
        <icon-outing />
      </template>
    </tool-box-button>

    <tool-box-button
      v-if="documentType === 'profile'"
      :to="{ name: 'outings-stats', query: { u: document.document_id } }"
      :label="$gettext('Statistics')"
      icon="chart-bar"
    />

    <hr />

    <tool-box-button
      v-if="documentType === 'profile'"
      :to="{ name: 'whatsnew', query: { u: document.document_id } }"
      :label="$gettext('Contributions')"
      rel="nofollow"
      icon="edit"
    />

    <div class="quality" v-if="quality">
      <icon-quality :quality="quality.value" fixed-width></icon-quality>
      <span>{{ quality.i18nName }}</span> {{ quality.i18nValue }}
    </div>

    <tool-box-button
      v-if="isEditable"
      :to="{ name: documentType + '-edit', params: { id: document.document_id, lang: lang } }"
      icon="edit"
      :label="$gettext('Edit a document')"
    />

    <tool-box-button
      v-if="isEditable && showAssociationEditor"
      @click="associationsModal!.show()"
      icon="link"
      :label="$gettext('Edit associations')"
    />

    <tool-box-button
      v-if="documentType != 'profile' || $user.isModerator || document.document_id === $user.id"
      :to="{ name: documentType + '-history', params: { id: document.document_id, lang: document.cooked.lang } }"
      :label="$gettext('History')"
      rel="nofollow"
      icon="history"
    />

    <tool-box-button
      v-if="isEditable && hasMissingLangs"
      @click="translateModal!.show()"
      icon="globe"
      :label="$gettext('Translate')"
    />

    <tool-box-button
      :href="`mailto:${reportingIssueMail}?subject=${reportingSubject}&body=${reportingBody}`"
      :icon="['fas', 'exclamation-circle']"
      icon-class="has-text-danger"
      :label="$gettext('Report an issue')"
    />

    <hr />

    <!-- Moderator zone -->
    <template v-if="isEditable && $user.isModerator">
      <tool-box-button
        v-if="documentType !== 'profile'"
        @click="lockDocumentAction"
        :icon="document.protected ? 'lock' : 'unlock'"
        :class="document.protected ? 'lock-button-red' : 'lock-button-green'"
        :label="document.protected ? $gettext('Unprotect document') : $gettext('Protect document')"
      />

      <tool-box-button
        v-if="documentType !== 'profile'"
        @click="mergeModal!.show()"
        icon="object-group"
        :label="$gettext('Merge with other document')"
      />

      <tool-box-button
        v-if="documentType === 'profile'"
        @click="lockAccountAction"
        icon="user-lock"
        :class="{ 'lock-button-red': isAccountBlocked }"
        :label="isAccountBlocked ? $gettext('Unblock account') : $gettext('Block account')"
      />
    </template>

    <template v-if="isDeletable">
      <tool-box-button
        v-if="document.available_langs.length > 1"
        @click="deleteLocaleModal!.show()"
        :icon="['fas', 'trash']"
        :label="$gettext('Delete this locale')"
      />

      <tool-box-button
        @click="deleteDocumentModal!.show()"
        :icon="['fas', 'trash']"
        :label="$gettext('Delete this document')"
      />
    </template>

    <hr v-if="isDeletable || (isEditable && $user.isModerator)" />

    <license-box :document="document" />

    <!-- Modal windows -->
    <div v-if="isEditable">
      <merge-document-window ref="mergeModal" :document="document" />
      <delete-document-window ref="deleteDocumentModal" :document="document" />
      <delete-locale-window ref="deleteLocaleModal" :document="document" :locale-lang="document.cooked.lang" />
      <translate-window ref="translateModal" :document="document" :missing-langs="missingLangs" />
      <associations-window ref="associationsModal" :document="document" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Point } from 'ol/geom';
import { computed, ref, useTemplateRef } from 'vue';
import { useRoute } from 'vue-router';

import DeleteDocumentWindow from '../windows/DeleteDocumentWindow.vue';
import DeleteLocaleWindow from '../windows/DeleteLocaleWindow.vue';
import MergeDocumentWindow from '../windows/MergeDocumentWindow.vue';
import TranslateWindow from '../windows/TranslateWindow.vue';

import AssociatedDocuments from './AssociatedDocuments.vue';
import LicenseBox from './LicenseBox.vue';
import ToolBoxButton from './ToolBoxButton.vue';

import AssociationsWindow from '@/components/association-editor/AssociationsWindow.vue';
import IconQuality from '@/components/generics/icons/IconQuality.vue';
import c2c from '@/js/apis/c2c';
import { useEditable } from '@/js/composables/editable';
import { useGlobalProperties } from '@/js/composables/global-properties';
import constants from '@/js/constants';
import getFundraiser from '@/js/get-fundraiser';
import ol from '@/js/libs/ol';
import { documentProperty, useDocumentType } from '@/js/properties';

const GeoJSON = new ol.format.GeoJSON();

const reportingIssueMail = 'topo-fr@camptocamp.org';

const props = defineProps({ ...documentProperty });

const route = useRoute();
const { $gettext, $language, $user } = useGlobalProperties();
// the view mode too: isDraftView, isVersionView...
const { isNormalView, isEditable, isDeletable } = useEditable(() => props.document);
const { documentType } = useDocumentType(props);

// the windows, named apart from their tags
type Modal = { show(): void };
const mergeModal = useTemplateRef<Modal>('mergeModal');
const deleteDocumentModal = useTemplateRef<Modal>('deleteDocumentModal');
const deleteLocaleModal = useTemplateRef<Modal>('deleteLocaleModal');
const translateModal = useTemplateRef<Modal>('translateModal');
const associationsModal = useTemplateRef<Modal>('associationsModal');

const isAccountBlocked = ref<boolean | null>(null);

const lang = computed(() => props.document.cooked.lang);

const reportingSubject = computed(() => $gettext('Issue report'));

const reportingBody = computed(() =>
  encodeURIComponent($gettext('Describe here your issue') + '\r\n\r\n----\r\n\r\n' + window.location.href)
);

const availableLangs = computed(() => {
  const currentLang = route.params.lang ?? props.document.cooked?.lang;
  return (props.document.available_langs as string[]).filter((lang) => currentLang !== lang);
});

const showAssociationEditor = computed(() => documentType.value !== 'area');

const missingLangs = computed(() => {
  const result: string[] = [];

  for (const lang of constants.langs) {
    if (!props.document.available_langs.includes(lang)) {
      result.push(lang);
    }
  }

  return result;
});

const quality = computed(() => {
  const fields = constants.objectDefinitions[documentType.value].fields;
  if (!fields.quality) {
    return undefined;
  }
  return {
    ...fields.quality,
    value: props.document[fields.quality.name],
    i18nName: $gettext(fields.quality.name),
    i18nValue: $gettext(props.document[fields.quality.name], fields.quality.i18nContext),
  };
});

const fundraiser = computed(() => getFundraiser(props.document as Parameters<typeof getFundraiser>[0]));

const hasMissingLangs = computed(() => missingLangs.value.length > 0);

// the location of the document
const coordinates = () =>
  (GeoJSON.readFeatures(props.document.geometry!.geom!)[0].getGeometry() as Point).getCoordinates();

const linkToClosestDocuments = computed(() => {
  const result = {
    name: documentType.value + 's',
    query: {
      wtyp: documentType.value === 'waypoint' ? props.document.waypoint_type : undefined,
    } as Record<string, string | undefined>,
  };

  if (props.document.geometry?.geom) {
    const point = GeoJSON.readFeatures(props.document.geometry.geom)[0];
    const extent = ol.extent.buffer(point.getGeometry()!.getExtent(), 10000);

    result.query.bbox = extent.map(Math.floor).join(',');
  }

  return result;
});

const linkToParaglidingOutings = computed(() => ({
  name: 'outings',
  query: {
    act: 'paragliding',
    w: [
      ...(documentType.value === 'waypoint' ? [props.document.document_id] : []),
      ...(props.document.associations!.waypoints ?? []).map((w) => w.document_id),
      ...(props.document.associations!.waypoint_children ?? []).map((w) => w.document_id),
    ].join(','),
  },
}));

const shouldAddWheatherLink = computed(
  () => (props.document.type === 'w' || props.document.type === 'r') && props.document?.geometry?.geom
);

const linkToMeteoBlue = computed(() => {
  let lang;
  switch ($language.current) {
    case 'fr':
      lang = 'fr/meteo/semaine';
      break;
    case 'it':
      lang = 'it/tempo/settimana';
      break;
    case 'de':
      lang = 'de/wetter/woche';
      break;
    case 'es':
    case 'eu':
    case 'ca':
      lang = 'es/tiempo/semana';
      break;
    case 'en':
    default:
      lang = 'en/weather/week';
  }
  const lonLat = ol.proj.toLonLat(coordinates());
  const coords = ol.coordinate.format(lonLat, '{y}N{x}E', 4);
  // use waypoint elevation, or elevation of difficuties or max elevation for routes, otherwise nothing
  const elevation =
    props.document.elevation ?? props.document.difficulties_height ?? props.document.elevation_max ?? '';
  return `https://meteoblue.com/${lang}/${coords}${elevation}`;
});

const shouldAddDirections = computed(
  () =>
    props.document.type === 'w' &&
    ['access', 'gite', 'camp_site'].includes(props.document.waypoint_type) &&
    props.document?.geometry?.geom
);

const linkToGoogleMapsDirections = computed(() => {
  const lonLat = ol.proj.toLonLat(coordinates());
  const coords = ol.coordinate.format(lonLat, '{y},{x}', 4);
  return `https://www.google.com/maps/dir/?api=1&destination=${coords}`;
});

function lockDocumentAction() {
  const document = props.document;
  if (document.protected) {
    c2c.moderator.unprotectDocument(document.document_id!).then(() => {
      document.protected = false;
    });
  } else {
    c2c.moderator.protectDocument(document.document_id!).then(() => {
      document.protected = true;
    });
  }
}

function lockAccountAction() {
  const id = props.document.document_id!;
  if (isAccountBlocked.value) {
    c2c.moderator.unblockAccount(id).then(() => {
      isAccountBlocked.value = false;
    });
  } else {
    c2c.moderator.blockAccount(id).then(() => {
      isAccountBlocked.value = true;
    });
  }
}

if ($user.isModerator && documentType.value === 'profile') {
  c2c.moderator.isAccountBlocked(props.document.document_id!).then((response) => {
    isAccountBlocked.value = response.data.blocked;
  });
}
</script>

<style scoped lang="scss">
.toolbox-button {
  cursor: pointer;

  span {
    color: $link;
  }
}

.lock-button-green {
  color: $green !important;
}

.lock-button-red {
  color: $red !important;
}

.lang-switcher-box-list span:not(:last-child)::after {
  content: ' \2022 '; /* \2022 is bull */
}

.quality {
  span:nth-of-type(1) {
    @include colon;
  }
}
</style>
