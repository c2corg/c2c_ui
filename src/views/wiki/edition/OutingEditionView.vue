<template>
  <edition-container v-if="document" :mode="mode" :document="document" :is-loading="saving" @save="save">
    <!-- shown once loaded, as the container is -->
    <template v-if="document">
      <form-section
        :title="$gettext('general informations')"
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

      <form-section
        :title="$gettext('Weather & conditions')"
        :sub-title="$gettext('Describe the conditions you encountered during your outing')"
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
import { useRouteProposals } from './utils/route-proposals';

import c2c from '@/js/apis/c2c';
import { useGlobalProperties } from '@/js/composables/global-properties';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const { $documentUtils, $dateUtils, $user } = useGlobalProperties();
const pageRoute = useRoute();

const { fields, saving, mode, document, save } = useDocumentEdition({ afterLoad, beforeSave });

const mapInput = useTemplateRef<InstanceType<typeof MapInputRow>>('mapInput');
const quality = useTemplateRef<{ beforeSave(): void }>('quality');
const cotometer = useTemplateRef<{ show(): void }>('cotometer');

const showBothDates = ref(false);
const currentDate = ref(getCurrentDateString());

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

function afterLoad() {
  showBothDates.value = document.value!.date_start !== document.value!.date_end;
  // on creation, the user is already a participant
  proposePartners.value = (document.value!.associations?.users ?? []).some((user) => user.document_id === $user.id);
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

function showCotometer() {
  cotometer.value!.show();
}

function getCurrentDateString() {
  return $dateUtils.toLocalizedString(new Date(), 'YYYY-MM-DD');
}

watch(showBothDates, handleDates);

// the routes the track followed: for the track of the loaded outing, a track added, changed or removed
watch(
  () => document.value?.geometry?.geom_detail,
  (to, from) => {
    if (to === from) {
      return;
    }
    suggest(to);
    if (from === null && to) {
      // a track added: the map shows it
      nextTick(fitMapToDocuments);
    }
  }
);
</script>
