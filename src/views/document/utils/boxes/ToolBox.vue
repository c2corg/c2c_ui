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

    <tool-box-button
      v-if="documentType === 'profile' && document.document_id === $user.id"
      :to="{ name: 'locate-images' }"
      :label="$gettext('Locate my images on GPS tracks')"
      rel="nofollow"
      icon="map-marker-alt"
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
      v-if="canLocateImages"
      @click="locateImages"
      :icon="locatingImages ? 'spinner' : 'map-marker-alt'"
      :icon-class="locatingImages ? 'fa-spin' : undefined"
      :label="$gettext('Locate images on the GPS track')"
    />

    <!-- a sideways image: a moderator turns any image, its author a personal one (v6_api POST /images/rotate) -->
    <template v-if="canRotateImage">
      <tool-box-button
        @click="rotateImage(-90)"
        :icon="rotatingImage ? 'spinner' : 'undo-alt'"
        :icon-class="rotatingImage ? 'fa-spin' : undefined"
        :label="$gettext('Rotate image left')"
        :disabled="rotatingImage"
      />
      <tool-box-button
        @click="rotateImage(90)"
        :icon="rotatingImage ? 'spinner' : 'redo-alt'"
        :icon-class="rotatingImage ? 'fa-spin' : undefined"
        :label="$gettext('Rotate image right')"
        :disabled="rotatingImage"
      />
    </template>

    <tool-box-button
      v-if="isEditable && hasMissingLangs"
      @click="translateModal!.show()"
      icon="globe"
      :label="$gettext('Translate')"
    />

    <!-- the offline copy (src/stores/favourites.ts): a row with a real label, which the bookmark of the header cannot have -->
    <template v-if="isNormalView && SAVABLE_TYPES.includes(documentType)">
      <tool-box-button
        v-if="offline.isOfflineReady(documentType, document.document_id!)"
        :to="{ name: 'offline' }"
        icon="circle-check"
        icon-class="has-text-success"
        :label="$gettext('Saved offline')"
      />
      <tool-box-button
        v-else
        @click="saveOffline"
        :icon="savingOffline ? 'spinner' : 'download'"
        :icon-class="savingOffline ? 'fa-spin' : undefined"
        :label="savingOffline ? $gettext('Saving…') : $gettext('Save offline')"
      />
      <tool-box-button
        v-if="documentType === 'route'"
        @click="saveDayPack"
        :icon="savingPack ? 'spinner' : 'layer-group'"
        :icon-class="savingPack ? 'fa-spin' : undefined"
        :label="savingPack ? $gettext('Saving…') : $gettext('Save as the pack of the day')"
      />
    </template>

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
        v-if="(document.available_langs ?? []).length > 1"
        @click="deleteLocaleModal!.show()"
        :icon="['fas', 'trash']"
        :label="$gettext('Delete this locale')"
      />

      <tool-box-button
        @click="deleteDocumentModal!.show()"
        :icon="['fas', 'trash']"
        :label="$gettext('Delete this document')"
        :disabled="!!deletion?.blocked"
        :title="deletionTitle ?? undefined"
      />
    </template>

    <!-- the moderators of the forum can ask for the removal of an account too, without being moderators of the topoguide -->
    <tool-box-button
      v-if="canRequestRemoval"
      @click="removeAccountModal!.show()"
      icon="user-slash"
      :label="$gettext('Remove account')"
    />

    <hr v-if="isDeletable || (isEditable && $user.isModerator) || canRequestRemoval" />

    <license-box :document="document" />

    <remove-account-window v-if="canRequestRemoval" ref="removeAccountModal" :document="document" />

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
import { computed, ref, useTemplateRef } from 'vue';
import { useRoute } from 'vue-router';

import DeleteDocumentWindow from '../windows/DeleteDocumentWindow.vue';
import DeleteLocaleWindow from '../windows/DeleteLocaleWindow.vue';
import MergeDocumentWindow from '../windows/MergeDocumentWindow.vue';
import RemoveAccountWindow from '../windows/RemoveAccountWindow.vue';
import TranslateWindow from '../windows/TranslateWindow.vue';

import AssociatedDocuments from './AssociatedDocuments.vue';
import LicenseBox from './LicenseBox.vue';
import ToolBoxButton from './ToolBoxButton.vue';

import AssociationsWindow from '@/components/association-editor/AssociationsWindow.vue';
import IconQuality from '@/components/generics/icons/IconQuality.vue';
import c2c from '@/js/apis/c2c';
import { useEditable } from '@/js/composables/editable';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { useModerationRoles } from '@/js/composables/moderation';
import constants from '@/js/constants';
import { toLonLat } from '@/js/geo/projection';
import getFundraiser from '@/js/get-fundraiser';
import { hasTimedTrack, locateOutingImages } from '@/js/locate-outing-images';
import { cookedDocumentProperty, useDocumentType } from '@/js/properties';
import { notify } from '@/js/toast';
import { SAVABLE_TYPES } from '@/pwa/offline-store';
import { useFavouritesStore } from '@/stores/favourites';
import { useOfflineStore } from '@/stores/offline';

const reportingIssueMail = 'topo-fr@camptocamp.org';

const props = defineProps({ ...cookedDocumentProperty });

const route = useRoute();
const { $gettext, $language, $user, $documentUtils, $dateUtils } = useGlobalProperties();
const offline = useOfflineStore();
const favourites = useFavouritesStore();
// the view mode too: isDraftView, isVersionView...
const { isNormalView, isEditable, isDeletable, deletion } = useEditable(() => props.document);
// why the delete button is disabled, or until when it works (the authors only: 30 days)
const deletionTitle = computed(() => {
  const state = deletion.value;
  if (!state) {
    return null;
  }
  if (state.blocked === 'too_old') {
    return $gettext('More than 30 days old');
  }
  if (state.blocked === 'other_participants') {
    return $gettext('Other participants: unlink them first');
  }
  return state.until
    ? $gettext('Deletable until') + ' ' + $dateUtils.toLocalizedString(state.until.toISOString(), 'll')
    : null;
});
const { documentType } = useDocumentType(props);
const { any: canModerate } = useModerationRoles();
// a moderator's own profile is not removable: the API refuses it too
const canRequestRemoval = computed(
  () => documentType.value === 'profile' && canModerate.value && props.document.document_id !== $user.id
);

const savingOffline = ref(false);
const savingPack = ref(false);
const thisDocument = () => ({
  id: props.document.document_id!,
  lang: props.document.cooked.lang!,
  title: $documentUtils.getDocumentTitle(props.document, props.document.cooked.lang!),
});

async function saveOffline() {
  if (savingOffline.value) {
    return;
  }
  savingOffline.value = true;
  try {
    // a favourite too
    await favourites.saveOffline({ type: documentType.value, ...thisDocument() });
    notify($gettext('Saved offline'), 'is-success');
  } catch {
    notify($gettext('Download failed: check the network and try again'), 'is-warning');
  } finally {
    savingOffline.value = false;
  }
}

async function saveDayPack() {
  const route = thisDocument();
  const folderName = window.prompt($gettext('Name of the pack?'), route.title)?.trim();
  if (!folderName || savingPack.value) {
    return;
  }
  savingPack.value = true;
  try {
    const waypoints = await favourites.saveDayPack(route, folderName);
    notify(
      $gettext('Pack saved offline, in Favourites: the route and its waypoints:') + ' ' + (waypoints + 1),
      'is-success'
    );
  } catch {
    notify($gettext('Download failed: check the network and try again'), 'is-warning');
  } finally {
    savingPack.value = false;
  }
}

// the images of the outing without a location of their own, on its GPS track (#4259)
const locatingImages = ref(false);
const canLocateImages = computed(
  () =>
    documentType.value === 'outing' &&
    isEditable.value &&
    Boolean(props.document.associations?.images?.length) &&
    hasTimedTrack(props.document)
);

async function locateImages() {
  if (
    locatingImages.value ||
    !window.confirm(
      $gettext(
        'Set the location of the images without one to where the GPS track was when they were shot (accounting for a time zone difference of the camera)?'
      )
    )
  ) {
    return;
  }
  locatingImages.value = true;
  try {
    const located = await locateOutingImages(
      props.document,
      lang.value!,
      $user,
      $gettext('Location computed from the GPS track of the outing')
    );
    if (located.length) {
      notify($gettext('Images located on the GPS track of the outing:') + ' ' + located.length, 'is-success');
    } else {
      notify($gettext('No image to locate: they have a location, or no time matching the track'), 'is-info');
    }
  } catch {
    notify($gettext('An error occurred, the images could not all be located'), 'is-warning');
  } finally {
    locatingImages.value = false;
  }
}

// the windows, named apart from their tags
type Modal = { show(): void };
const mergeModal = useTemplateRef<Modal>('mergeModal');
const deleteDocumentModal = useTemplateRef<Modal>('deleteDocumentModal');
const deleteLocaleModal = useTemplateRef<Modal>('deleteLocaleModal');
const removeAccountModal = useTemplateRef<Modal>('removeAccountModal');
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
    if (!(props.document.available_langs ?? []).includes(lang)) {
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
    value: props.document.quality!,
    i18nName: $gettext(fields.quality.name),
    i18nValue: $gettext(props.document.quality!, fields.quality.i18nContext),
  };
});

const fundraiser = computed(() => getFundraiser(props.document as Parameters<typeof getFundraiser>[0]));

const hasMissingLangs = computed(() => missingLangs.value.length > 0);

// the location of the document: its geometry is a GeoJSON point (EPSG:3857), read without OpenLayers' GeoJSON format,
// which would put the OpenLayers geometries in the startup bundle (#4876)
const pointOf = (geom: string) => (JSON.parse(geom) as { coordinates: number[] }).coordinates.slice(0, 2);
const coordinates = () => pointOf(props.document.geometry!.geom!);

const linkToClosestDocuments = computed(() => {
  const result = {
    name: documentType.value + 's',
    query: {
      wtyp: documentType.value === 'waypoint' ? props.document.waypoint_type : undefined,
    } as Record<string, string | undefined>,
  };

  if (props.document.geometry?.geom) {
    // 10 km around the point
    const [x, y] = pointOf(props.document.geometry.geom);
    const extent = [x - 10000, y - 10000, x + 10000, y + 10000];

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
  const [lon, lat] = toLonLat(coordinates());
  const coords = `${lat.toFixed(4)}N${lon.toFixed(4)}E`;
  // use waypoint elevation, or elevation of difficuties or max elevation for routes, otherwise nothing
  const elevation =
    props.document.elevation ?? props.document.difficulties_height ?? props.document.elevation_max ?? '';
  return `https://meteoblue.com/${lang}/${coords}${elevation}`;
});

const shouldAddDirections = computed(
  () =>
    props.document.type === 'w' &&
    ['access', 'gite', 'camp_site'].includes(props.document.waypoint_type ?? '') &&
    props.document?.geometry?.geom
);

const linkToGoogleMapsDirections = computed(() => {
  const [lon, lat] = toLonLat(coordinates());
  const coords = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${coords}`;
});

const rotatingImage = ref(false);
const canRotateImage = computed(() => {
  const image = props.document;
  return (
    documentType.value === 'image' &&
    isEditable.value &&
    !(image.filename ?? '').toLowerCase().endsWith('.svg') &&
    ($user.isModerator || (image.image_type === 'personal' && image.creator?.user_id === $user.id))
  );
});

async function rotateImage(rotation: 90 | -90) {
  if (rotatingImage.value) {
    return;
  }
  rotatingImage.value = true;
  try {
    const { data } = await c2c.rotateImage(props.document.document_id!, rotation);
    // a new file: the page shows it at once, without any cache of the old one
    props.document.filename = data.filename;
  } catch {
    notify($gettext('The image could not be rotated'), 'is-warning');
  } finally {
    rotatingImage.value = false;
  }
}

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

<style scoped>
.toolbox-button {
  cursor: pointer;

  span {
    color: var(--c2c-link);
  }
}

.lock-button-green {
  color: var(--c2c-green) !important;
}

.lock-button-red {
  color: var(--c2c-red) !important;
}

.lang-switcher-box-list span:not(:last-child)::after {
  /* \2022 is bull; the space after an escape ends it, so the space shown after it is the second one */
  content: ' \2022  ';
}

/* a colon after the label, with a non-breaking space before it in French */
.quality span:nth-of-type(1) {
  :lang(fr) &::after {
    content: '\00a0:';
  }
  :lang(ca) &::after,
  :lang(de) &::after,
  :lang(en) &::after,
  :lang(es) &::after,
  :lang(eu) &::after,
  :lang(hu) &::after,
  :lang(it) &::after,
  :lang(sl) &::after,
  :lang(zh) &::after {
    content: ':';
  }
}
</style>
