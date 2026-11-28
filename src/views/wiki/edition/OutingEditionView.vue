<template>
  <edition-container v-if="document" :mode="mode" :document="document" :is-loading="saving" @save="save">
    <!-- shown once loaded, as the container is -->
    <template v-if="document">
      <div v-if="draftId" class="notification is-info is-light">
        {{
          $gettext(
            'You are editing an outing saved on the phone, not published yet. Save updates it; publish it from Favourites.'
          )
        }}
      </div>
      <form-section
        :title="$gettext('General information')"
        :sub-title="$gettext('Main informations about your outing')"
        expanded-on-load
      >
        <div class="columns">
          <form-field
            class="is-narrow"
            :document="document"
            :field="fields.date_start"
            :max="showBothDates ? document.date_end : currentDate"
            @input="handleDates"
            @click="setCurrentDate"
          />
          <form-field
            class="is-narrow"
            v-show="showBothDates"
            :document="document"
            :field="fields.date_end"
            :min="showBothDates ? document.date_start : undefined"
            :max="currentDate"
            @click="setCurrentDate"
          />
          <div class="column is-narrow">
            <input-checkbox v-model="showBothDates">{{ $gettext('Several days?') }}</input-checkbox>
          </div>
        </div>

        <!-- the trace of the user's watch, while there is none (or it is the picked one, which another can replace) -->
        <outing-trace-picker
          v-if="mode === 'add' && (!document.geometry?.geom_detail || pickedActivityId !== null)"
          :picked-id="pickedActivityId"
          @pick="useTrackerActivity"
        />

        <div class="columns is-multiline">
          <form-field class="is-two-fifths" :document="document" :field="fields.activities" />
          <div class="column">
            <!-- without the possible routes: in an editable map, their markers can be neither hovered nor clicked -->
            <map-input-row
              class="field"
              :document="document"
              geom-detail-editable
              ref="mapInput"
              @move="updateBbox"
              @activities="prefillActivities"
              @replace="giveBackTrackerPick"
              :initial-extent="initialExtent"
            />
          </div>
        </div>

        <div class="field">
          <label class="label">
            {{ $filters.uppercaseFirstLetter($gettext('routes')) }}:
            <marker-helper name="1063027#routes" />
          </label>
          <div class="control">
            <input class="input" type="text" placeholder="Name" v-model="routeTitle" />
          </div>
        </div>

        <!-- the routes of Favourites saved offline: at hand without a network, or just after coming down from one -->
        <div v-if="offlineRoutes.length" class="field">
          <label class="label"><fa-icon icon="bookmark" />&nbsp;{{ $gettext('My routes saved offline') }}</label>
          <div v-for="route of offlineRoutes" :key="route.document_id">
            <input-checkbox
              :model-value="routeIsAssociated(route.document_id!)"
              @update:model-value="changeRouteAssociation($event, route)"
            >
              <activities :activities="route.activities" class="is-size-4 has-text-secondary" />
              <document-title :document="route" />
            </input-checkbox>
          </div>
        </div>

        <div v-if="possibleRoutes.length !== 0" class="field">
          <div v-for="route of possibleRoutes" :key="route.document_id">
            <input-checkbox
              :model-value="routeIsAssociated(route.document_id!)"
              @update:model-value="changeRouteAssociation($event, route)"
            >
              <activities :activities="route.activities" class="is-size-4 has-text-secondary" />
              <document-title :document="route" />,
              <document-rating :document="route" />
            </input-checkbox>
            <document-link :document="route" target="_blank" :title="$gettext('Open in a new tab')">
              <fa-icon icon="link" />
            </document-link>
          </div>
          <button v-if="hiddenRoutes" type="button" class="button is-small mt-2" @click="showMore">
            {{ $gettext('Show more routes') }} ({{ hiddenRoutes }})
          </button>
        </div>

        <div class="notification is-info" v-else>
          <span v-translate>Please move the map, or change the route's name.</span>
          <span v-translate>If the route does not exists in our base, you can create it.</span>
        </div>

        <div class="notification is-info" v-if="showMoreResultsBanner">
          <span v-translate>
            More routes are available. You can move the map, specify the name or set an activity to filter them out.
          </span>
        </div>

        <!-- No route to link (none offline, or not on Camptocamp yet): a note says which one it is, and the outing waits
             on the phone until it is linked from Favourites -->
        <template v-if="mode === 'add' && !document.associations?.routes?.length">
          <p v-if="!showRouteNote" class="help mb-3">
            <a @click="routeNoteOpened = true">{{ $gettext('Route not found? Save without a route') }}</a>
          </p>
          <div v-else class="notification is-warning is-light">
            <p class="has-text-weight-semibold">
              {{ offline.online ? $gettext('Route not found') : $gettext('No route available offline') }}
            </p>
            <p class="mb-2">
              {{ $gettext('Note which route this outing is: you will link it later from Favourites.') }}
            </p>
            <textarea
              v-model="routeNote"
              class="textarea"
              rows="2"
              :placeholder="$gettext('E.g. South face of the Dent du Requin, normal route')"
            />
            <button
              type="button"
              class="button is-warning is-fullwidth mt-2"
              :disabled="saving || !routeNote.trim()"
              @click="saveWithoutRoute"
            >
              {{ $gettext('Save without a route (to complete later)') }}
            </button>
          </div>
        </template>

        <div class="columns is-multiline">
          <form-field :document="document" :field="fields.title" />
          <form-field class="is-narrow" :document="document" :field="fields.partial_trip" />
          <form-field
            class="is-12"
            :document="document"
            :field="fields.route_description"
            :placeholder="$gettext('describe route_conditions')"
          />
        </div>
      </form-section>

      <!-- open on load: the conditions are what the readers of an outing look for, and they count most in its quality -->
      <form-section
        :title="$gettext('Weather & conditions')"
        :sub-title="$gettext('Describe the conditions you encountered during your outing')"
        expanded-on-load
      >
        <div class="columns is-multiline">
          <form-field class="is-6" :document="document" :field="fields.condition_rating" />
          <form-field class="is-6" :document="document" :field="fields.glacier_rating" />
          <form-field class="is-12" :document="document" :field="fields.conditions_levels" />
        </div>
        <div class="columns">
          <form-field :document="document" :field="fields.elevation_up_snow" />
          <form-field :document="document" :field="fields.elevation_down_snow" />
        </div>
        <div class="columns">
          <form-field :document="document" :field="fields.snow_quantity" />
          <form-field :document="document" :field="fields.snow_quality" />
        </div>
        <div class="columns is-multiline">
          <form-field
            class="is-12"
            :document="document"
            :field="fields.conditions"
            :placeholder="$gettext('describe conditions')"
          />
          <form-field
            class="is-6"
            :document="document"
            :field="fields.weather"
            :placeholder="$gettext('describe weather')"
          />
          <form-field
            class="is-6"
            :document="document"
            :field="fields.timing"
            :placeholder="$gettext('describe timing')"
          />
          <form-field class="is-12" :document="document" :field="fields.avalanche_signs" />
          <form-field class="is-12" :document="document" :field="fields.avalanches" />
          <div v-if="dataAvalancheLinks" class="column is-12">
            <p class="help is-size-6">
              <a :href="dataAvalancheLinks.report" target="_blank" rel="noopener noreferrer" v-translate
                >Add a report</a
              >
              <span v-translate> on </span>
              <a
                :href="dataAvalancheLinks.home"
                class="external-link"
                target="_blank"
                rel="noopener noreferrer"
                v-translate
              >
                data-avalanche.org </a
              ><span v-translate>, an association dedicated to improving and sharing knowledge about avalanches.</span>
            </p>
          </div>
        </div>
      </form-section>

      <form-section
        :title="$gettext('Personal informations')"
        :sub-title="$gettext('People who were with you, and your feelings about this outing')"
      >
        <associations-input-row
          :label="$gettext('participants')"
          :document="document"
          :field="fields.users"
          :load-suggestions="proposePartners ? loadRecentPartners : undefined"
        />
        <div class="columns">
          <form-field :document="document" :field="fields.participant_count" class="is-narrow" />
          <form-field
            :document="document"
            :field="fields.participants"
            :placeholder="$gettext('Without c2c account')"
          />
        </div>
        <div class="columns is-multiline">
          <form-field
            class="is-12"
            :document="document"
            :field="fields.description"
            :label="$gettext('personal comments')"
            :placeholder="$gettext('write your comments')"
          />
          <form-field :document="document" :field="fields.disable_comments" />
        </div>
      </form-section>

      <form-section
        :title="$gettext('Details')"
        :sub-title="$gettext('Detailed figures, like ratings, height differences, frequentation...')"
      >
        <div class="columns">
          <form-field class="is-4" :document="document" :field="fields.frequentation" />
        </div>

        <div class="columns is-multiline">
          <div class="column is-4">
            <form-field no-wrapper :document="document" :field="fields.elevation_access" />
            <form-field no-wrapper :document="document" :field="fields.access_condition" />
            <form-field no-wrapper :document="document" :field="fields.public_transport" />
          </div>
          <form-field class="is-8" :document="document" :field="fields.access_comment" />

          <div class="column is-4">
            <form-field no-wrapper :document="document" :field="fields.lift_status" />
            <form-field no-wrapper :document="document" :field="fields.hut_status" />
          </div>
          <form-field class="is-8" :document="document" :field="fields.hut_comment" />
        </div>

        <div class="columns">
          <form-field class="is-4" :document="document" :field="fields.height_diff_up" />
          <form-field class="is-4" :document="document" :field="fields.height_diff_down" />
          <form-field class="is-4" :document="document" :field="fields.height_diff_difficulties" />
        </div>

        <div class="columns">
          <form-field class="is-4" :document="document" :field="fields.length_total" unit="km" :divisor="1000" />
          <form-field class="is-4" :document="document" :field="fields.elevation_min" />
          <form-field class="is-4" :document="document" :field="fields.elevation_max" />
        </div>

        <div class="columns is-multiline">
          <form-field class="is-4" :document="document" :field="fields.global_rating" />
          <form-field class="is-4" :document="document" :field="fields.rock_free_rating" />
          <form-field class="is-4" :document="document" :field="fields.engagement_rating" />
          <form-field class="is-4" :document="document" :field="fields.equipment_rating" />

          <form-field
            class="is-4"
            :document="document"
            :field="fields.ski_rating"
            prefix="?"
            @click-prefix="showCotometer"
          />
          <form-field class="is-4" :document="document" :field="fields.labande_global_rating" />

          <form-field class="is-4" :document="document" :field="fields.ice_rating" />
          <form-field class="is-4" :document="document" :field="fields.snowshoe_rating" />
          <form-field class="is-4" :document="document" :field="fields.via_ferrata_rating" />
          <form-field class="is-4" :document="document" :field="fields.hiking_rating" />
        </div>

        <div class="columns">
          <form-field class="is-4" :document="document" :field="fields.mtb_down_rating" />
          <form-field class="is-4" :document="document" :field="fields.mtb_up_rating" />
        </div>

        <div class="columns">
          <quality-field ref="quality" class="is-4" :document="document" />
        </div>
      </form-section>

      <!-- TODO where is that ??
              <form-field :document="document" :field="fields.summary"/>
          -->
      <cotometer-window ref="cotometer" v-if="document" v-model="document.ski_rating" />

      <div v-if="mode === 'add' && !draftId" class="keep-on-phone">
        <button
          type="button"
          class="button is-fullwidth"
          :class="{ 'is-loading': saving }"
          @click="saveWithoutPublishing"
        >
          {{ $gettext('Save without publishing') }}
        </button>
        <p class="help">{{ $gettext('The outing stays on the phone: complete and publish it from Favourites.') }}</p>
      </div>
    </template>
  </edition-container>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
import { useRoute } from 'vue-router';

import AssociationsInputRow from './utils/AssociationsInputRow.vue';
import CotometerWindow from './utils/CotometerWindow.vue';
import EditionContainer from './utils/EditionContainer.vue';
import FormField from './utils/FormField.vue';
import FormSection from './utils/FormSection.vue';
import MapInputRow from './utils/MapInputRow.vue';
import QualityField from './utils/QualityField.vue';
import { useDocumentEdition } from './utils/document-edition';
import { trackFromHash } from './utils/prefill-from-query';
import { useRouteProposals } from './utils/route-proposals';

import OutingTracePicker from '@/components/tracking/OutingTracePicker.vue';
import c2c from '@/js/apis/c2c';
import type { Activity, Geometry } from '@/js/apis/tracking-service';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { CONFIDENT_FIT } from '@/js/geo/locate-images';
import { hasTimedTrack, locateOutingImages } from '@/js/locate-outing-images';
import { notify, toast } from '@/js/toast';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';
import { OFFLINE_MODE } from '@/pwa/offline-store';
import { giveBackTracePick, readTracePick, writeTracePick, type TracePick } from '@/pwa/outing-trace-pick';
import { useOfflineStore } from '@/stores/offline';

const { $documentUtils, $dateUtils, $user, $gettext, $language } = useGlobalProperties();
const pageRoute = useRoute();

const { fields, saving, mode, document, save, draftId, keepOnPhone, saveWithoutPublishing } = useDocumentEdition({
  afterLoad,
  beforeSave,
  afterSaved,
});
const offline = useOfflineStore();

const mapInput = useTemplateRef<InstanceType<typeof MapInputRow>>('mapInput');
const quality = useTemplateRef<{ beforeSave(): void }>('quality');
const cotometer = useTemplateRef<{ show(): void }>('cotometer');

const showBothDates = ref(false);
const currentDate = ref(getCurrentDateString());
const dataAvalancheLinks = computed(() => {
  if (
    !document.value?.avalanche_signs?.some((sign) => sign === 'natural_avalanche' || sign === 'accidental_avalanche')
  ) {
    return null;
  }

  const lang = ['fr', 'en', 'es', 'it'].includes($language.current ?? '') ? $language.current : 'en';
  return {
    report: `https://www.data-avalanche.org/ReportAnAvalanche?lang=${lang}`,
    home: `https://www.data-avalanche.org/?lang=${lang}`,
  };
});

// the routes saved offline in Favourites
const offlineRoutes = computed(() =>
  offline.savedDocs
    .filter((entry) => entry.type === 'route' && entry.mode === OFFLINE_MODE && entry.data)
    .map((entry) => entry.data as C2cDocument)
);

// an outing whose route cannot be linked: a note, and it waits on the phone. Offered at once without a network
const routeNote = ref('');
const routeNoteOpened = ref(false);
const showRouteNote = computed(() => !offline.online || routeNoteOpened.value);

function saveWithoutRoute() {
  const doc = document.value!;
  if (!doc.activities?.length || !doc.date_start) {
    toast({
      message: $gettext('Choose the activity and the date before saving.'),
      type: 'is-warning',
      position: 'center',
    });
    return;
  }
  handleDates();
  void keepOnPhone(
    $gettext('Outing saved on the phone. Link its route from Favourites to publish it.'),
    'is-success',
    routeNote.value
  );
}

// the tracker activity whose trace is in the form, as long as it is (src/pwa/outing-trace-pick.ts)
const trackerPick = ref<(TracePick & { geom?: string | null }) | null>(null);
const pickedActivityId = computed(() => {
  const geom = document.value?.geometry?.geom_detail;
  return geom && trackerPick.value?.geom === geom ? trackerPick.value.id : null;
});

async function useTrackerActivity({ activity, geometry }: { activity: Activity; geometry: Geometry }) {
  const doc = document.value!;
  if (doc.geometry?.geom_detail) {
    // through null, as clearing it: the previous pick gives back what it wrote
    doc.geometry.geom = null;
    doc.geometry.geom_detail = null;
    await nextTick();
  }
  const day = $dateUtils.toLocalizedString(activity.date, 'YYYY-MM-DD');
  const pick = readTracePick(doc, activity, day, showBothDates.value);
  mapInput.value!.setGeometry(geometry);
  showBothDates.value = false;
  writeTracePick(pick);
  trackerPick.value = { ...pick, geom: doc.geometry?.geom_detail };
}

const routes = () => document.value!.associations!.routes!;

// the routes proposed to associate (see route-proposals.ts)
const {
  text: routeTitle,
  bbox,
  routes: possibleRoutes,
  hidden: hiddenRoutes,
  moreResults: showMoreResultsBanner,
  showMore,
  moveMap,
  suggest,
} = useRouteProposals({
  associated: () => document.value?.associations?.routes ?? [],
  activities: () => document.value?.activities ?? [],
  title: (route) => $documentUtils.getDocumentTitle(route),
});

const initialExtent = computed(() => {
  if (pageRoute.query.initial_bbox) {
    return String(pageRoute.query.initial_bbox).split(',').map(parseFloat);
  } else if (routes().length) {
    return $documentUtils.getDocumentsBbox(routes());
  }

  return null;
});

// the users of the recent outings of the user, proposed first when adding participants, to a participant of the
// outing only: a moderator editing the outing of others would get their own partners
const proposePartners = ref(false);

async function loadRecentPartners(): Promise<C2cDocument[]> {
  const response = await c2c.userProfile.partners.get();
  return response.data.partners;
}

// the track when the form opened: a track added or replaced locates the images of the outing (#4259)
let loadedTrack: string | null | undefined;

function afterLoad() {
  const doc = document.value!;
  // a day given in the url alone (?date_start=): the outing lasts that day
  if (mode.value === 'add' && doc.date_start && !doc.date_end) {
    doc.date_end = doc.date_start;
  }
  loadedTrack = doc.geometry?.geom_detail;
  showBothDates.value = doc.date_start !== doc.date_end;
  // on creation, the user is already a participant
  proposePartners.value = (doc.associations?.users ?? []).some((user) => user.document_id === $user.id);
  const track = mode.value === 'add' ? trackFromHash(pageRoute.hash) : null;
  if (track !== null) {
    void setGeometryFromUrl(track);
  }
}

// the track given in the url (#geom=): what a GPS file holds, as its text (GeoJSON in degrees, GPX, KML), read as
// that file would be. With times, it gives the date when the url did not
async function setGeometryFromUrl(geom: string) {
  // the map is drawn with the document, after this hook
  await nextTick();
  mapInput.value?.setGeometry(geom);
}

function updateBbox(newBbox: number[]) {
  if (bbox.value === null && initialExtent.value === null && mode.value === 'add') {
    // IF it's the very first load
    // AND if there is no specific bbox expected in th URL
    // AND you are creating an outing
    // THEN the bbox will be the default one => do not load possible routes
    bbox.value = newBbox;
    return;
  }

  // the first box is where the editor placed the map, not a move of the user
  moveMap(newBbox, bbox.value !== null);
}

// placed by the editor: the search follows the new box
async function fitMapToDocuments() {
  moveMap((await mapInput.value!.fitMapToDocuments()) as number[], false);
}

// the activities of the tracking device activity whose track is used, unless already chosen
function prefillActivities(activities: string[]) {
  const doc = document.value!;
  if (!doc.activities?.length) {
    doc.activities = [...activities] as typeof doc.activities;
  }
}

function changeRouteAssociation(addRoute: boolean, route: C2cDocument) {
  // Adding a route still present, or removing a route not present?
  if ((!addRoute && !routeIsAssociated(route.document_id!)) || (addRoute && routeIsAssociated(route.document_id!))) {
    return;
  }

  const doc = document.value!;

  if (addRoute) {
    routes().push(route);

    if (routes().length === 1) {
      nextTick(async () => {
        // for first association, force the localization to be the route localization
        $documentUtils.propagateProperties(doc, route);
        // the search follows the map
        await fitMapToDocuments();
      });
    } else {
      $documentUtils.propagateProperties(doc, route);
    }
  } else {
    doc.associations!.routes = routes().filter((r) => r.document_id !== route.document_id);

    if (!routes().length) {
      // if there is no more route associated, the localization is obsolete
      doc.geometry!.geom = null;
    }
  }
}

function routeIsAssociated(routeId: number) {
  return routes().filter((route) => route.document_id === routeId).length !== 0;
}

function handleDates() {
  const doc = document.value!;
  if (!showBothDates.value) {
    doc.date_end = doc.date_start;
  } else if (doc.date_end! < doc.date_start!) {
    doc.date_end = doc.date_start;
  }
}

function setCurrentDate() {
  currentDate.value = getCurrentDateString();
}

function beforeSave() {
  handleDates();
  quality.value!.beforeSave();
}

// the images without a location of their own, on the new track: only when the times of their camera fit it
async function afterSaved(doc: C2cDocument) {
  if (doc.geometry?.geom_detail === loadedTrack || !doc.associations?.images?.length || !hasTimedTrack(doc)) {
    return;
  }
  const located = await locateOutingImages(
    doc,
    doc.locales![0]!.lang,
    $user,
    $gettext('Location computed from the GPS track of the outing'),
    { minFit: CONFIDENT_FIT }
  );
  if (located.length) {
    notify($gettext('Images located on the GPS track of the outing:') + ' ' + located.length, 'is-success');
  }
}

function showCotometer() {
  cotometer.value!.show();
}

function getCurrentDateString() {
  return $dateUtils.toLocalizedString(new Date(), 'YYYY-MM-DD');
}

watch(showBothDates, handleDates);

// the picked trace cleared, or replaced by another track (a GPS file, another activity): the date and figures it
// wrote go back, where not edited since, and the linked routes fill what is empty again. Not for an edit of the
// trace on the map: it is still the outing of that activity
function giveBackTrackerPick() {
  const pick = trackerPick.value;
  if (!pick) {
    return;
  }
  const doc = document.value;
  if (doc === pick.doc) {
    showBothDates.value = giveBackTracePick(pick, showBothDates.value);
    for (const route of routes()) {
      $documentUtils.propagateProperties(doc!, route);
    }
  }
  trackerPick.value = null;
}

// the routes the track followed: for the track of the loaded outing, a track added, changed or removed
watch(
  () => document.value?.geometry?.geom_detail,
  (to, from) => {
    if (to === from) {
      return;
    }
    if (!to) {
      giveBackTrackerPick();
    }
    suggest(to);
    if (from === null && to) {
      // a track added: the map shows it
      nextTick(fitMapToDocuments);
    }
  }
);
</script>

<style scoped>
.keep-on-phone {
  margin: 1.5rem 0 0.5rem;
}
</style>
