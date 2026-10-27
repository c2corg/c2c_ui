<template>
  <section>
    <div class="columns">
      <div class="column is-12-mobile">
        <!-- FORM -->
        <div class="centered" v-if="view === 'form'">
          <!-- input for searchKind (route / waypoint) -->
          <div class="form-input">
            <p class="input-label">
              {{ $gettext('You are looking for ____ accessible by public transport') }}
            </p>
            <input-radio-button
              v-model="formData.searchKind.selected"
              :options="formData.searchKind.options"
              :default-value="formData.searchKind.selected ? formData.searchKind.selected : formData.searchKind.default"
              :display-vertically="true"
            />
          </div>
          <div v-if="formData.searchKind.selected === 'route'" class="form-input">
            <!-- input for activities (only for routes) -->
            <p class="input-label" v-translate>What activity(ies) would you like to do?</p>
            <input-activity :document-type="'r'" :show-labels="false" v-model="formData.activities"></input-activity>
          </div>
          <div class="form-input">
            <!-- input for starting point -->
            <p class="input-label" v-translate>What is your starting point?</p>
            <input-address
              :fullwidth="true"
              :placeholder="$gettext('Enter an address')"
              :show-address-propositions="true"
              :default-address="formData.startingPoint.selectedAddress"
              @update:props="updateStartingPointAddress"
            ></input-address>
            <span v-show="coverageDifferent" class="coverage-different" v-translate>
              Make sure your starting point is close enough to a train station
            </span>
          </div>
          <div class="form-input">
            <!-- input for destination kind -->
            <p class="input-label" v-translate>To define your destination, choose one of these 2 approaches</p>
            <input-radio-button
              v-model="formData.destinationKind.selected"
              :options="formData.destinationKind.options"
              :disabled-options="formData.destinationKind.disabledOptions"
              :default-value="
                formData.destinationKind.selected ? formData.destinationKind.selected : formData.destinationKind.default
              "
              :display-vertically="true"
            />
          </div>
          <div v-if="formData.destinationKind.selected === 'mountain range'" class="form-input">
            <!-- input for destination by 'mountain range' -->
            <p class="input-label">{{ $gettext('Choice of massif') }}</p>
            <input-autocomplete
              :fullwidth="true"
              :placeholder="$gettext('Enter a massif name')"
              :default-value="formData.mountainRange.selected ?? undefined"
              :format-suggestion="getTitle"
              :fetch-suggestions="fetchMountainRanges"
              :limit="10"
              @update:props="updateSelectedMountainRange"
            ></input-autocomplete>
          </div>
          <div v-if="formData.destinationKind.selected === 'duration'" class="form-input">
            <!-- input for destination by 'duration' -->
            <div>
              <p class="input-label">
                {{ $gettext('Set a maximum time to reach the access point (from the selected departure time)') }}
              </p>
            </div>
            <span>
              <input
                type="number"
                class="maxTripDurationInput"
                v-model="formData.maxTripDuration"
                :min="minTripDuration"
                :max="maxTripDuration"
                :step="tripDurationIncrement"
                @blur="formatTripDuration"
              />
              {{ $gettext('minutes') }}
            </span>
          </div>
          <div class="form-input">
            <!-- input for date and time of departure -->
            <p class="input-label" v-translate>What date and time would you like to leave?</p>
            <div class="select-date-container">
              <div class="date-picker-container">
                <label for="date-input">{{ $gettext('Date') }}</label>
                <div class="input-container">
                  <input
                    type="date"
                    id="date-input"
                    class="date-input"
                    :min="twoDaysAgo"
                    v-model="formData.departure.selectedDate"
                  />
                  <div class="calendar-icon">
                    <img class="geolocalisation-img" src="@/assets/img/boxes/date.svg" alt="date" />
                  </div>
                </div>
              </div>

              <div class="date-picker-container preference-container">
                <label for="date-input">{{ $gettext('Preference') }}</label>
                <div class="input-container">
                  <select
                    name="preference"
                    class="date-input"
                    id="preference"
                    v-model="formData.departure.timePreference"
                  >
                    <option value="leave-after">{{ $gettext('Leave after') }}</option>
                    <option value="arrive-before">{{ $gettext('Arrive before') }}</option>
                  </select>
                </div>
              </div>

              <div class="date-picker-container hour-picker-container">
                <label for="date-input">{{ $gettext('Time') }}</label>
                <div class="input-container">
                  <input type="time" id="hour-input" class="hour-input" v-model="formData.departure.selectedTime" />
                </div>
              </div>
            </div>
          </div>
          <div class="searchButton">
            <button class="button is-primary" :disabled="!isSearchEnabled" @click="formSearch">
              <fa-icon class="search-icon" icon="search" aria-hidden="true" />
              {{ $gettext('Search') }}
              {{
                missingField > 0
                  ? missingField == 1
                    ? '(' + missingField + ' ' + $gettext('missing field') + ')'
                    : '(' + missingField + ' ' + $gettext('missing fields') + ')'
                  : ''
              }}
            </button>
          </div>
        </div>
        <!-- LIST OF FILTERS WHEN TOO MUCH ROUTE -->
        <itinevert-filter-view
          class="centered filter-view"
          v-if="view === 'filter'"
          :filtered-routes="filteredRoutes"
          :is-search-enabled="isSearchEnabled"
          @search="filterSearch"
          @compute-journey-reachable-routes="computeJourneyReachableRoutes"
        ></itinevert-filter-view>
        <!-- RESULT VIEW -->
        <div v-if="view === 'result' && !noResultsFound">
          <itinevert-result-view
            :base-query="filterQuery"
            :documents="
              (formData.searchKind.selected === 'route' ? filteredRoutes : filteredWaypoints) as ResultDocuments
            "
            :document-type="formData.searchKind.selected"
            :polygon-geometry="polygonGeometry ?? undefined"
            :isochrone-bbox="isochroneBbox"
          ></itinevert-result-view>
        </div>
        <!-- NO RESULTS FOUND VIEW -->
        <itinevert-no-result-view class="centered" :error="queryError" v-show="view === 'result' && noResultsFound" />
        <!-- LOADING VIEW -->
        <itinevert-loading-view v-show="view === 'loading'" :progress="progress" :total="total" :is-spinner="isSpinner">
        </itinevert-loading-view>
      </div>
      <div class="column is-3" v-if="view !== 'result' || noResultsFound">
        <div class="banner-img" :style="{ backgroundImage: `url(${bannerImage ?? ''})` }"></div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router';

import InputAutocomplete from '../generics/inputs/InputAutocomplete.vue';

import ItinevertFilterView from './ItinevertFilterView.vue';
import ItinevertLoadingView from './ItinevertLoadingView.vue';
import ItinevertNoResultView from './ItinevertNoResultView.vue';
import ItinevertResultView from './ItinevertResultView.vue';

import { default as c2c } from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import itinevertService, {
  MIN_TRIP_DURATION,
  MAX_TRIP_DURATION,
  TRIP_DURATION_INCREMENT,
  MAX_NAVITIA_ISOCHRONES_REQUEST_REACHED,
  MAX_ROUTE_THRESHOLD,
  DEFAULT_TRIP_DURATION,
  projectCoordinates,
  createBboxString,
  type Query,
  type StartingPoint,
} from '@/js/apis/itinevert-service';
import navitiaService from '@/js/apis/navitia-service';
import { itinevertBanners } from '@/js/asset-urls';
import { useGlobalProperties } from '@/js/composables/global-properties';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

type Documents = { documents?: C2cDocument[]; total?: number };
// once loaded: what the result view shows
type ResultDocuments = { documents: C2cDocument[]; total: number };

const props = defineProps({
  view: {
    type: String,
    default: 'form',
  },
});

const emit = defineEmits(['change-view']);

const route = useRoute();
const router = useRouter();
const { $documentUtils, $gettext, $language } = useGlobalProperties();

// the departure time proposed: today, 7:30
const departureTime = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 7, 30, 0, 0);

// data used in form view and filter view
const formData = reactive({
  searchKind: {
    selected: 'route',
    default: 'route',
    options: [
      { value: 'route', text: $gettext('Route') + 's' },
      { value: 'waypoint', text: $gettext('Access points') },
    ],
  },
  activities: [] as string[],
  startingPoint: {
    selectedAddress: null as StartingPoint | '' | null,
    coverage: '',
  },
  destinationKind: {
    selected: 'mountain range',
    default: 'mountain range',
    options: [
      {
        value: 'mountain range',
        text: $gettext('Define the mountain range I wish to travel to by public transport'),
      },
      {
        value: 'duration',
        text: $gettext('Set a maximum time to reach the access point (from the selected departure time)'),
      },
    ],
    disabledOptions: [] as { value: string; reason: string }[],
  },
  mountainRange: {
    selected: null as C2cDocument | null,
    coverages: [] as string[],
  },
  departure: {
    selectedDate: departureTime.toISOString().slice(0, 10),
    selectedTime: departureTime.toTimeString().slice(0, 5),
    timePreference: 'leave-after',
  },
  // in minutes
  maxTripDuration: DEFAULT_TRIP_DURATION,
});
const filteredRoutes = ref<Documents>({});
const filteredWaypoints = ref<Documents>({});
const polygonGeometry = ref<{ type: string; coordinates: unknown } | null>(null);
const progress = ref(0);
const total = ref(0);
const queryError = ref<Record<string, unknown>>({});
const isochroneBbox = ref('');
const bannerImage = ref<string | null>(null);

const maxTripDuration = MAX_TRIP_DURATION;
const minTripDuration = MIN_TRIP_DURATION;
const tripDurationIncrement = TRIP_DURATION_INCREMENT;

// number of missing field for searchs
const missingField = computed(() => {
  let count = 0;
  if (formData.searchKind.selected === 'route' && formData.activities.length < 1) {
    count++;
  }

  if (formData.destinationKind.selected === 'mountain range' && formData.mountainRange.selected === null) {
    count++;
  }

  if (formData.startingPoint.selectedAddress === null || formData.startingPoint.selectedAddress === '') {
    count++;
  }

  return count;
});

const twoDaysAgo = computed(() => {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  return formatYMD(twoDaysAgo);
});

// the query based on formData
const formQuery = computed(() => {
  const query: Query = {};
  query.documentType = formData.searchKind.selected;
  if (formData.searchKind.selected === 'route' && formData.activities.length > 0) {
    query.act = formData.activities.join(',');
  }

  if (formData.destinationKind.selected === 'mountain range') {
    query.a = formData.mountainRange.selected!.document_id;
  }
  return query;
});

// filter query based on URL
const filterQuery = computed(() => {
  return route.query;
});

const coverageDifferent = computed(() => {
  // only check if we are selecting a massif
  if (formData.destinationKind.selected === 'mountain range' && formData.startingPoint.selectedAddress !== null) {
    let destCoverage = formData.mountainRange.coverages;
    if (destCoverage.length > 1) {
      // N destination coverages
      return true;
    } else if (destCoverage.length === 1) {
      // 1 destination coverage
      return destCoverage[0] !== formData.startingPoint.coverage;
    } else {
      // 0 destination coverages
      return false;
    }
  } else {
    return false;
  }
});

const noResultsFound = computed(() => {
  if (formData?.searchKind?.selected === 'route') {
    return !filteredRoutes.value?.documents?.length;
  } else if (formData?.searchKind?.selected === 'waypoint') {
    return !filteredWaypoints.value?.documents?.length;
  } else {
    return false;
  }
});

/** Return true if search is enabled (all required form fields are set) */
const isSearchEnabled = computed(() => {
  if (formData.searchKind.selected === 'route' && formData.activities.length < 1) {
    return false;
  }

  if (formData.destinationKind.selected === 'mountain range' && formData.mountainRange.selected === null) {
    return false;
  }

  if (formData.startingPoint.selectedAddress === null || formData.startingPoint.selectedAddress === '') {
    return false;
  }

  return true;
});

const isSpinner = computed(() => {
  if (formData.destinationKind.selected === 'mountain range') {
    if (formData.searchKind.selected === 'route') {
      return (
        !Object.prototype.hasOwnProperty.call(filteredRoutes.value, 'total') ||
        filteredRoutes.value.total === 0 ||
        (filteredRoutes.value.total ?? 0) > MAX_ROUTE_THRESHOLD
      );
    } else {
      return false;
    }
  } else if (formData.destinationKind.selected === 'duration') {
    return true;
  }
  return true;
});

/**
 * Fetch mountain ranges for autocomplete
 *
 * @param value The value entered by user to filter
 * @param limit The limit set for this autocomplete
 */
async function fetchMountainRanges(value: string, limit: number) {
  const promise = (c2c.area as DocumentService).getAll({
    atyp: 'range',
    q: value,
    offset: 0,
    limit: limit,
  });

  const areas = (await promise)?.data?.documents;

  return areas?.length > 0
    ? areas?.sort((a: C2cDocument, b: C2cDocument) => getTitle(a).localeCompare(getTitle(b)))
    : [];
}
function formatTripDuration(event: Event) {
  const tripDuration = Number((event.target as HTMLInputElement).value);
  // make sure trip duration is between limits
  if (tripDuration > MAX_TRIP_DURATION) {
    formData.maxTripDuration = MAX_TRIP_DURATION;
  } else {
    if (tripDuration < MIN_TRIP_DURATION) {
      formData.maxTripDuration = MIN_TRIP_DURATION;
    } else {
      formData.maxTripDuration = tripDuration;
    }
  }
}
// callback passed to input address
function updateStartingPointAddress(selectedAddress: StartingPoint | '') {
  formData.startingPoint.selectedAddress = selectedAddress;
  if (selectedAddress && selectedAddress.geometry?.coordinates) {
    const coordinates = selectedAddress.geometry.coordinates;
    itinevertService.getCoverage(coordinates[0], coordinates[1]).then((resp) => {
      formData.startingPoint.coverage = resp.data;
    });
  }
}
// callback passed to input autocomplete
async function updateSelectedMountainRange(selectedMountainRange: C2cDocument) {
  // requery choosen area to get its geometry
  let area = (await (c2c.area as DocumentService).get(selectedMountainRange.document_id!)).data;
  formData.mountainRange.selected = area;
  let coverages = (await itinevertService.getPolygonCoverage(area.geometry!.geom_detail!)).data;
  formData.mountainRange.coverages = coverages;
}
/** Get the title of a document in the current language */
function getTitle(document: C2cDocument) {
  return $documentUtils.getDocumentTitle(document, c2c.getApiLang($language.current ?? undefined));
}
async function computeJourneyReachableRoutes() {
  emit('change-view', 'loading');
  // start job, ID is stored in itinevert Service
  await itinevertService.startJourneyReachableRoutesJob(
    filterQuery.value,
    formData.departure,
    formData.startingPoint.selectedAddress as StartingPoint
  );

  // monitor progress
  itinevertService.monitorProgress(
    (res) => {
      let obj = JSON.parse(res);
      progress.value = obj.progress;
      total.value = obj.total;
      // cancel progress if somehow we are no longer waiting for load
      if (props.view !== 'loading') {
        itinevertService.cancelProgress();
      }
    },
    async () => {
      const result = await itinevertService.getJourneyReachableRoutes();
      filteredRoutes.value = result.data.result;
      polygonGeometry.value = JSON.parse(formData.mountainRange.selected!.geometry!.geom_detail!);
      total.value = 0;
      progress.value = 0;
      emit('change-view', 'result');
    },
    (data) => {
      queryError.value = navitiaService.handleQueryError(data) as Record<string, unknown>;
      filteredRoutes.value = {};
      filteredWaypoints.value = {};
      emit('change-view', 'result');
    },
    'routes'
  );
}
async function formSearch() {
  let query = Object.fromEntries(Object.entries(formQuery.value).filter(([, v]) => v !== undefined));
  // compute filter for routes
  if (formData.searchKind.selected === 'route') {
    // using Journey API
    if (formData.destinationKind.selected === 'mountain range') {
      emit('change-view', 'loading');
      filteredRoutes.value = (await itinevertService.getReachableRoutes(formQuery.value)).data as Documents;
      if ((filteredRoutes.value.total ?? 0) > MAX_ROUTE_THRESHOLD) {
        emit('change-view', 'filter');
      } else {
        router.replace({ path: route.path, query: query as LocationQueryRaw });
        await computeJourneyReachableRoutes();
      }
    }
    // using Isochrones API
    else if (formData.destinationKind.selected === 'duration') {
      emit('change-view', 'loading');
      let data;
      try {
        data = (
          await itinevertService.getIsochronesReachableRoutes(
            formQuery.value,
            formData.departure,
            formData.maxTripDuration,
            formData.startingPoint.selectedAddress as StartingPoint
          )
        ).data;
      } catch (e) {
        queryError.value = { message: (e as Error).message || $gettext('Error while loading data') };
        filteredRoutes.value = {};
        filteredWaypoints.value = {};
        if (props.view === 'loading') {
          emit('change-view', 'result');
        }
        return;
      }

      if (data && data.hasOwnProperty('documents')) {
        filteredRoutes.value = {
          documents: data.documents,
          total: data.total,
        };
        // add area that intersects isochrone geometry to the base query to reduce time of request
        let coordinates = projectCoordinates(data.isochron_geom.coordinates);
        polygonGeometry.value = { type: data.isochron_geom.type, coordinates: coordinates };
        isochroneBbox.value = createBboxString(coordinates);

        if (props.view === 'loading') {
          router.replace({ path: route.path, query: query as LocationQueryRaw });
          emit('change-view', 'result');
        }
      } else {
        queryError.value = navitiaService.handleQueryError(data) as Record<string, unknown>;
        filteredRoutes.value = {};
        filteredWaypoints.value = {};
        if (props.view === 'loading') {
          emit('change-view', 'result');
        }
      }
    }
  }

  // compute filter for waypoints
  if (formData.searchKind.selected === 'waypoint') {
    emit('change-view', 'loading');
    // using Journey API
    if (formData.destinationKind.selected === 'mountain range') {
      // start job, ID is stored in itinevert Service
      await itinevertService.startJourneyReachableWaypointsJob(
        formQuery.value,
        formData.departure,
        formData.startingPoint.selectedAddress as StartingPoint
      );

      // monitor progress
      itinevertService.monitorProgress(
        (res) => {
          let obj = JSON.parse(res);
          progress.value = obj.progress;
          total.value = obj.total;
          // cancel progress if somehow we are no longer waiting for load
          if (props.view !== 'loading') {
            itinevertService.cancelProgress();
          }
        },
        async () => {
          const result = await itinevertService.getJourneyReachableWaypoints();
          filteredWaypoints.value = result.data.result;
          polygonGeometry.value = JSON.parse(formData.mountainRange.selected!.geometry!.geom_detail!);
          total.value = 0;
          progress.value = 0;
          router.replace({ path: route.path, query: query as LocationQueryRaw });
          emit('change-view', 'result');
        },
        (data) => {
          queryError.value = navitiaService.handleQueryError(data) as Record<string, unknown>;
          filteredRoutes.value = {};
          filteredWaypoints.value = {};
          emit('change-view', 'result');
        },
        'waypoints'
      );
    }
    // using Isochrones API
    else if (formData.destinationKind.selected === 'duration') {
      let data;
      try {
        data = (
          await itinevertService.getIsochronesReachableWaypoints(
            formQuery.value,
            formData.departure,
            formData.maxTripDuration,
            formData.startingPoint.selectedAddress as StartingPoint
          )
        ).data;
      } catch (e) {
        queryError.value = { message: (e as Error).message || $gettext('Error while loading data') };
        filteredRoutes.value = {};
        filteredWaypoints.value = {};
        if (props.view === 'loading') {
          emit('change-view', 'result');
        }
        return;
      }

      if (data && data.hasOwnProperty('documents')) {
        filteredWaypoints.value = {
          documents: data.documents,
          total: data.total,
        };
        // add area that intersects isochrone geometry to the base query to reduce time of request
        let coordinates = projectCoordinates(data.isochron_geom.coordinates);
        polygonGeometry.value = { type: data.isochron_geom.type, coordinates: coordinates };
        isochroneBbox.value = createBboxString(coordinates);

        if (props.view === 'loading') {
          router.replace({ path: route.path, query: query as LocationQueryRaw });
          emit('change-view', 'result');
        }
      } else {
        queryError.value = navitiaService.handleQueryError(data) as Record<string, unknown>;
        filteredRoutes.value = {};
        filteredWaypoints.value = {};

        if (props.view === 'loading') {
          emit('change-view', 'result');
        }
      }
    }
  }
}
// only when searching for routes by massif
async function filterSearch() {
  // compute filter for routes
  if (formData.searchKind.selected === 'route') {
    // using Journey API
    if (formData.destinationKind.selected === 'mountain range') {
      let query = Object.fromEntries(Object.entries(filterQuery.value).filter(([, v]) => v !== undefined));

      filteredRoutes.value = (await itinevertService.getReachableRoutes(query)).data as Documents;
    }
  }
}
function formatYMD(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

watch(
  () => props.view,
  (newVal) => {
    const replaceQuery = (q: Query) => {
      router.replace({ path: route.path, query: q as Record<string, string> });
    };

    // clear storage + URL when entering form
    if (newVal === 'form') {
      filteredRoutes.value = {};
      filteredWaypoints.value = {};
      queryError.value = {};
      isochroneBbox.value = '';
      if (Object.keys(route.query).length > 0) {
        replaceQuery({});
      }
      return;
    }
    if (newVal === 'filter') {
      replaceQuery(formQuery.value);
    }
  }
);

onMounted(() => {
  // handle banner images
  if (itinevertBanners.length) {
    const randomIndex = Math.floor(Math.random() * itinevertBanners.length);
    bannerImage.value = itinevertBanners[randomIndex];
  }

  // reset url parameters
  if (Object.keys(route.query)?.length > 0) {
    router.replace({
      path: route.path,
      query: {},
    });
  }

  if (MAX_NAVITIA_ISOCHRONES_REQUEST_REACHED) {
    formData.destinationKind.disabledOptions.push({
      value: 'duration',
      reason: $gettext('Feature temporarily unavailable'),
    });
  }
});
</script>

<style scoped lang="scss">
.centered {
  margin: auto;
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
  width: 60%;
}

.filter-view {
  padding-top: 16px;
  justify-content: flex-start !important;
}

.searchButton {
  display: flex;
  font-weight: bold;
  margin-top: 5%;
  align-items: center;
  gap: 16px;
  .button {
    min-width: 40%;
  }
  .search-icon {
    padding-right: 1rem;
  }
}

.form-input {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;

  .preference-container {
    align-self: flex-end;
  }

  p {
    font-weight: bold;
  }

  .mountainRangeSelector {
    width: 100%;
    border: 1px solid lightgray;
    padding: 5px;
    border-radius: 4px;
  }

  .maxTripDurationInput {
    width: 50px;
    margin-right: 8px;
  }

  .select-date-container {
    width: 100%;
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
    .date-picker-container {
      align-self: flex-end;
      width: 100%;
      max-width: 150px;
      position: relative;

      label {
        position: absolute;
        font-size: 12px;
        color: #333;
        padding-left: 5px;
        padding-right: 5px;
        left: 0px;
        background-color: white;
        z-index: 1;
        margin-left: 20px;
        margin-top: -10px;
      }
      .input-container-mobile {
        margin-left: auto;
      }
      .input-container {
        position: relative;
        width: 100%;
        border: 1px solid #ccc;
        border-radius: 10px;
        overflow: hidden;
        display: flex;

        .date-input {
          flex: 1;
          padding: 11px 13px;
          padding-right: 8px;
          border: none;
          outline: none;
          font-size: 15px;
          color: #333;
          background-color: white;
          margin-right: 10px;

          &::-webkit-calendar-picker-indicator {
            opacity: 0;
            position: absolute;
            width: 100%;
            height: 100%;
            cursor: pointer;
          }
        }

        .hour-input {
          flex: 1;
          padding: 11px 8px;
          max-width: 90px;
          margin-left: 5px;
          border: none;
          outline: none;
          font-size: 15px;
          color: #333;

          &::-webkit-calendar-picker-indicator {
            cursor: pointer;
          }
        }

        .hour-input-mobile {
          flex: 1;
          max-width: 90px;
          margin-left: auto;
          margin-right: auto;
          border: none;
          outline: none;
          font-size: 15px;
          color: #333;
          padding: 4px 6px;

          &::-webkit-calendar-picker-indicator {
            cursor: pointer;
          }
        }

        .calendar-icon {
          display: flex;
          align-items: center;
          padding-right: 10px;
          width: 20px;
          color: #666;
          pointer-events: none;
        }
      }
    }
    .hour-picker-container {
      width: 107px;
    }
  }
}

.banner-img {
  height: 100%;
  width: 100%;
  margin-left: auto;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
}

@media screen and (max-width: 528px) {
  .select-date-container {
    width: 100%;
    flex-wrap: wrap;
    justify-content: space-between;
    .date-picker-container:first-child {
      max-width: none !important;
    }
  }
}

@media screen and (max-width: $tablet) {
  .centered {
    margin-left: auto;
    margin-right: auto;
    display: flex;
    flex-direction: column;
    gap: 24px;
    width: 90%;
    min-height: 100%;
  }

  .searchButton {
    width: 100%;
  }

  .banner-img {
    display: none !important;
  }
}
.coverage-different {
  color: rgb(225, 146, 0);
  font-size: 12px;
  font-style: italic;
  font-weight: bold;
}
</style>
