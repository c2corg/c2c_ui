<template>
  <div class="plan-trip-section">
    <div class="plan-trip-info">
      <!-- the trip tabs -->
      <div class="trip-tabs" v-if="hasReturnTrip">
        <button class="tab-button" :class="{ active: activeTab === 'outbound' }" @click="switchTab('outbound')">
          {{ $gettext('Outbound trip') }}
        </button>
        <button
          class="tab-button"
          :class="{
            active: activeTab === 'return',
            disabled: !canAccessReturnTab,
          }"
          :disabled="!canAccessReturnTab"
          @click="switchTab('return')"
        >
          {{ $gettext('Return trip') }}
        </button>
      </div>
      <div class="plan-trip-content">
        <div class="plan-trip-details">
          <!-- the several inputs in the form -->
          <plan-a-trip-form
            :active-tab="activeTab"
            :current-data="currentData"
            :access-waypoints="accessWaypoints"
            :loading-reachable="loadingReachable"
            :limit-transfers="limitTransfers"
            :max-transfers="maxTransfers"
            :document="document"
            @update-from-address="handleUpdateFromAddress"
            @update-selected-waypoint="handleUpdateSelectedWaypoint"
            @update-selected-date="handleUpdateSelectedDate"
            @update-time-preference="handleUpdateTimePreference"
            @update-selected-time="handleUpdateSelectedTime"
            @update-limit-transfers="handleUpdateLimitTransfers"
            @update-max-transfers="handleUpdateMaxTransfers"
            @swap-addresses="swapAddresses"
          />

          <!-- the calculate my trip buttons -->
          <button class="button is-primary plan-trip-search-button" @click="calculateRoute">
            <img class="" src="@/assets/img/boxes/itineraire.svg" alt="itinerary" />
            <p class="plan-trip-search-button-text" v-if="activeTab === 'outbound'">
              {{ hasReturnTrip ? $gettext('Calculate my outbound trip') : $gettext('Calculate my trip') }}
            </p>
            <p class="plan-trip-search-button-text" v-else>
              {{ hasReturnTrip ? $gettext('Calculate my return trip') : $gettext('Calculate my trip') }}
            </p>
          </button>

          <!-- the message regarding the duration of routes (only when document is a route) -->
          <div class="calculated-duration" v-if="activeTab === 'return' && hasReturnTrip">
            <div class="calculated-duration-number">
              {{ $gettext('This route guide has an estimated theoretical duration of') }}
              {{ formatDurationForDisplay() }}.
            </div>
            <div class="calculated-duration-vigilant">
              {{ $gettext('Be mindful of the departure time for your return trip!') }}
            </div>
          </div>

          <!-- the results journey, with their details -->
          <plan-a-trip-results
            :active-tab="activeTab"
            :current-data="currentData"
            :is-updating="currentData.isUpdating"
            :no-result="currentData.noResult"
            :displayed-from-address="displayedFromAddress"
            :displayed-to-address="displayedToAddress"
            @select-journey="setSelectedRouteJourney"
          />

          <!-- the messages displayed when no itineraries were found -->
          <div
            class="no-itineraries-container"
            :class="{ updating: currentData.isUpdating }"
            v-if="currentData.noResult"
          >
            <div class="no-itineraries" v-if="queryError === 'no_solution' || queryError === 'unknown_object'">
              <img
                class="no-itineraries-img"
                src="@/assets/img/boxes/transport_not_found.svg"
                alt="transport not found"
              />
              <div class="no-itineraries-text">
                <div class="no-itineraries-found">{{ $gettext('No public transport found') }}</div>
                <div class="no-itineraries-detail">
                  {{ queryErrorMessage }}
                  <br /><br />
                  {{ $gettext('If you know of a line serving this access point, you can indicate it in this') }}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    :href="$gettext('https://form.typeform.com/to/xRZnnp6u', 'lineMissingFormUrl')"
                  >
                    {{ $gettext('form.') }}
                  </a>
                </div>
              </div>
            </div>

            <!-- the messages displayed when error 500 is returned by /journeys route -->
            <div
              class="navitia-unknown-error"
              v-if="queryError !== null && queryError !== 'no_solution' && queryError !== 'unknown_object'"
            >
              <img
                class="navitia-unknown-error-img"
                src="@/assets/img/boxes/navitia_api_error.svg"
                alt="navitia unknown error"
              />
              <div class="navitia-unknown-error-text">
                <div class="navitia-unknown-error-title">
                  {{ queryErrorMessage }}
                </div>
                <div class="navitia-unknown-error-detail">
                  {{ $gettext('Try again later or') }}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    :href="
                      $gettext(
                        'https://forum.camptocamp.org/c/site-et-association/site-c2c-suggestions-bugs-et-problemes',
                        'urlWhenNavitiaUnknownError'
                      )
                    "
                  >
                    {{ $gettext('contact us.') }}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- the shortcut buttons that update day or time -->
          <div class="time-modification-buttons" v-if="currentData.showTimeButton">
            <button class="modification-buttons" @click="departEarlier">
              <img src="@/assets/img/boxes/before.svg" alt="earlier" />
              <span>{{ $gettext('Leave earlier') }}</span>
            </button>

            <button class="modification-buttons" @click="departLater">
              <img src="@/assets/img/boxes/after.svg" alt="later" />
              <span>{{ $gettext('Leave later') }}</span>
            </button>

            <button class="modification-buttons" @click="nextDay">
              <img src="@/assets/img/boxes/next_day.svg" alt="next day" />
              <span>{{ $gettext('Next day') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- the map on which documents are displayed -->
    <div class="plan-trip-map">
      <map-view
        ref="olMap"
        :documents="filteredDocuments"
        :show-protection-areas="!!document.type && ['r', 'w'].includes(document.type)"
        :biodiv-sports-activities="document.activities"
        :full-screen-element-id="
          !$screen.isMobile && showElevationProfile && elevationProfileHasData ? 'fullscreen-map-container' : null
        "
        @has-protection-area="$emit('has-protection-area')"
        @waypoint-clicked="handleWaypointClicked"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { transform } from 'ol/proj';
import { computed, nextTick, onMounted, ref, useTemplateRef, watch, type PropType } from 'vue';

import PlanATripForm from './PlanATripForm.vue';
import PlanATripResults from './PlanATripResults.vue';

import start from '@/assets/img/boxes/geoloc-2.svg';
import type OlMap from '@/components/map/OlMap.vue';
import NavitiaService, { type DatetimeRepresents, type Journey, type JourneyOptions } from '@/js/apis/navitia-service';
import transportService from '@/js/apis/transport-service';
import { useGlobalProperties } from '@/js/composables/global-properties';
import ol from '@/js/libs/ol';
import planATripUtils, { type Section } from '@/js/plan-a-trip-utils';
import { documentProperty, useDocumentType } from '@/js/properties';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

type Waypoint = { id: number; title: string; coordinates: number[] };
type Address = { address?: string; geometry?: { coordinates?: number[] } };
type RouteJourney = Omit<Journey, 'sections'> & {
  departure_date_time: string;
  arrival_date_time: string;
  sections: RouteSection[];
};
type RouteSection = Section & { geojson?: { coordinates: number[][] } };
type TripData = {
  fromAddress: Address | '';
  selectedAddress: null;
  addressPropositions: never[];
  showAddressPropositions: boolean;
  selectedDate: string;
  selectedTime: string;
  timePreference: string;
  fromCoordinates: number[] | null | undefined;
  selectedWaypoint: Waypoint | null;
  journeys: RouteJourney[];
  selectedJourney: RouteJourney | null;
  noResult: boolean;
  selectedRouteJourney: RouteJourney | null;
  showTimeButton: boolean;
  isUpdating: boolean;
  missingDepartureAddress: boolean;
  missingDestinationAddress: boolean;
};
// a document shown on the map
type MapDocument = Record<string, any>;

const props = defineProps({
  ...documentProperty,
  showElevationProfile: {
    type: Boolean,
    default: false,
  },
  elevationProfileHasData: {
    type: Boolean,
    default: false,
  },
  // the route of a document, for its durations
  document: {
    type: Object as PropType<C2cDocument & { calculated_duration?: number | null; durations?: string[] | null }>,
    required: true,
  },
});

const emit = defineEmits(['calculate-route', 'has-protection-area']);

const { $gettext, $language } = useGlobalProperties();
const { documentType } = useDocumentType(props);

const olMap = useTemplateRef<InstanceType<typeof OlMap>>('olMap');

/** The local date, YYYY-MM-DD: toISOString() gives the UTC one, the day before after midnight in Europe */
function localDate(date: Date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => part.toString().padStart(2, '0'))
    .join('-');
}

/** A YYYY-MM-DD date some days later (or earlier), on the calendar: a day is not 24 hours when the clocks change */
function addDays(date: string, days: number) {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + days);
  return day.toISOString().slice(0, 10);
}

const tripData = (): TripData => ({
  fromAddress: '',
  selectedAddress: null,
  addressPropositions: [],
  showAddressPropositions: false,
  selectedDate: localDate(new Date()),
  selectedTime: new Date().toTimeString().slice(0, 5),
  timePreference: 'leave-after',
  fromCoordinates: null,
  selectedWaypoint: null,
  journeys: [],
  selectedJourney: null,
  noResult: false,
  selectedRouteJourney: null,
  showTimeButton: false,
  isUpdating: false,
  missingDepartureAddress: false,
  missingDestinationAddress: false,
});

const activeTab = ref('outbound');

// Data for the outbound journey
const outboundData = ref(tripData());

// Data for return journey
const returnData = ref(tripData());

const displayedFromAddress = ref('');
const displayedToAddress = ref('');
const reachableWaypoints = ref<Waypoint[]>([]);
const loadingReachable = ref(false);
const limitTransfers = ref(false);
const maxTransfers = ref(0);
// undefined for an error without a description: an unknown error
const queryError = ref<string | null | undefined>(null);
const errorMessages: Record<string, string> = {
  // no solution found
  no_solution: $gettext('It seems your trip can not be completed on the selected date and time'),
  unknown_object: $gettext(
    "The start and finish points are too far apart to find a route. Choose a start in a city closer to the route's access point."
  ),
  // internal server error
  unknown_error: $gettext('An unknown error occurred.'),
  navitia_internal_error: $gettext('Public transport data is currently unavailable.'),
  auth_error: $gettext('Authentication to public transport data service error.'),
  invalid_param: $gettext('Invalid parameters were sent to public transport data service.'),
};

/** Returns the outbound or return data */
const currentData = computed(() => (activeTab.value === 'outbound' ? outboundData.value : returnData.value));

/** Removes access points natively in routes, to code specific behaviors */
const filteredDocuments = computed(() => {
  const filteredWaypoints =
    props.document.associations?.waypoints?.filter((waypoint: MapDocument) => waypoint.waypoint_type !== 'access') ||
    [];

  const mainDocument = {
    ...props.document,
    associations: {
      ...props.document.associations,
      waypoints: filteredWaypoints,
    },
  };

  return mapDocuments.value.concat([mainDocument]);
});
const hasReturnTrip = computed(() => documentType.value === 'route');
/** Determines if a waypoint is accessible by public transport */
const accessWaypoints = computed(() => (reachableWaypoints.value.length > 0 ? reachableWaypoints.value : []));

const queryErrorMessage = computed(() => {
  if (currentData.value.noResult) {
    if (queryError.value !== null) {
      if (queryError.value && queryError.value in errorMessages) {
        return errorMessages[queryError.value];
      } else {
        return $gettext('An unknown error occured.');
      }
    }
  }
  return '';
});

/** Customizes access points: clicking makes a selection instead of redirecting to a page, and the color is green */
const mapDocuments = computed<MapDocument[]>(() => {
  // This computed property depends on the selectedRouteJourney to ensure
  // route documents update when a journey is selected
  void currentData.value.selectedRouteJourney;

  const baseDocuments = props.document.associations?.waypoints ? [props.document.associations.waypoints] : [];
  const accessWaypointDocuments = accessWaypoints.value.map((waypoint) => {
    return {
      document_id: waypoint.id,
      type: 'w',
      waypoint_type: 'access',
      geometry: {
        version: 1,
        geom: JSON.stringify({
          type: 'Point',
          coordinates: ol.proj.transform(waypoint.coordinates, 'EPSG:4326', 'EPSG:3857'),
        }),
      },
      properties: {
        nonInteractive: true,
        color: 'green',
      },
      locales: [{ title: waypoint.title, lang: $language.current }],
    };
  });

  const routeDocuments = prepareRouteDocuments(false);

  return [...baseDocuments, ...accessWaypointDocuments, ...routeDocuments];
});

const canAccessReturnTab = computed(() => outboundData.value.journeys.length > 0);

const maxNbTransfers = computed(() => (limitTransfers.value ? maxTransfers.value : undefined));

watch(
  () => currentData.value.selectedRouteJourney,
  () => {
    // Trigger recenter when selectedRouteJourney changes
    recenterMapOnDocuments();
  },
  { deep: true }
);

onMounted(() => {
  // Firefox's date picker calendar has a specific design
  if (navigator.userAgent.toLowerCase().includes('firefox')) {
    window.document.documentElement.classList.add('is-firefox');
  }
});

// Load the waypoints served when mounting the component
loadReachableWaypoints().then(() => {
  // If only one waypoint served, select it automatically
  if (reachableWaypoints.value.length === 1) {
    currentData.value.selectedWaypoint = reachableWaypoints.value[0];
  }
});

function handleUpdateFromAddress(address: Address) {
  const data = activeTab.value === 'outbound' ? outboundData.value : returnData.value;
  data.fromAddress = address;
  data.fromCoordinates = address?.geometry?.coordinates;
}
function handleUpdateSelectedWaypoint(waypoint: Waypoint | null) {
  currentData.value.selectedWaypoint = waypoint;
}
function handleUpdateSelectedDate(date: string) {
  currentData.value.selectedDate = date;
}
function handleUpdateTimePreference(preference: string) {
  currentData.value.timePreference = preference;
}
function handleUpdateSelectedTime(time: string) {
  currentData.value.selectedTime = time;
}
function handleUpdateLimitTransfers(limit: boolean) {
  limitTransfers.value = limit;
}
function handleUpdateMaxTransfers(max: number) {
  maxTransfers.value = max;
}
function swapAddresses() {
  if (activeTab.value === 'outbound') {
    switchTab('return');
  } else if (activeTab.value === 'return') {
    switchTab('outbound');
  }
}
function setSelectedRouteJourney(journey: RouteJourney) {
  currentData.value.selectedRouteJourney = journey;
}

/** The options of the Navitia query, without the limit of transfers when there is none */
function journeyOptions(options: JourneyOptions) {
  return maxNbTransfers.value === undefined ? options : { ...options, max_nb_transfers: maxNbTransfers.value };
}

/** Call Navitia and store the results */
async function calculateRoute() {
  const data = currentData.value;
  queryError.value = null;
  data.missingDepartureAddress = false;
  data.missingDestinationAddress = false;

  if (
    (activeTab.value === 'outbound' && !data.fromAddress) ||
    (activeTab.value === 'return' && !data.selectedWaypoint)
  ) {
    data.missingDepartureAddress = true;
  }

  if (
    (activeTab.value === 'outbound' && !data.selectedWaypoint) ||
    (activeTab.value === 'return' && !data.fromAddress)
  ) {
    data.missingDestinationAddress = true;
  }

  if (data.missingDepartureAddress || data.missingDestinationAddress) {
    return;
  }
  let fromCoords, toCoords;

  if (activeTab.value === 'outbound') {
    // OUTBOUND: From address to waypoint
    fromCoords = NavitiaService.formatCoordinates(data.fromCoordinates);
    toCoords = NavitiaService.formatCoordinates(data.selectedWaypoint!.coordinates);
    displayedFromAddress.value = (data.fromAddress as Address).address!;
  } else {
    // RETURN: From waypoint to address
    fromCoords = NavitiaService.formatCoordinates(data.selectedWaypoint!.coordinates);
    toCoords = NavitiaService.formatCoordinates(data.fromCoordinates);
    displayedToAddress.value = (data.fromAddress as Address).address!;
  }

  data.isUpdating = true;

  // Format datetime for Navitia API minus 15 minutes
  const originalDateTime = new Date(`${data.selectedDate}T${data.selectedTime}:00`);
  const adjustedDateTime = new Date(originalDateTime);

  if (originalDateTime.getHours() === 0 && originalDateTime.getMinutes() < 15) {
    adjustedDateTime.setTime(originalDateTime.getTime());
  } else {
    adjustedDateTime.setTime(originalDateTime.getTime() - 15 * 60 * 1000);
  }

  const year = adjustedDateTime.getFullYear();
  const month = String(adjustedDateTime.getMonth() + 1).padStart(2, '0');
  const day = String(adjustedDateTime.getDate()).padStart(2, '0');
  const hours = String(adjustedDateTime.getHours()).padStart(2, '0');
  const minutes = String(adjustedDateTime.getMinutes()).padStart(2, '0');

  const dateTimeFormat = `${year}${month}${day}T${hours}${minutes}00`;
  const dateTimeRepresents: DatetimeRepresents = data.timePreference === 'arrive-before' ? 'arrival' : 'departure';

  try {
    const response = await NavitiaService.getJourneys(
      {
        from: fromCoords,
        to: toCoords,
        datetime: dateTimeFormat,
        datetime_represents: dateTimeRepresents,
      },
      journeyOptions({
        walking_speed: 1.12,
        max_walking_duration_to_pt: 4464,
        min_nb_journeys: 3,
      })
    );

    const responseData = response.data as { journeys?: RouteJourney[] };
    data.showTimeButton = true;
    const selectedDateFormatted = data.selectedDate.replace(/-/g, '');

    if (responseData?.journeys) {
      const filteredJourneys = responseData.journeys.filter((journey) => {
        const journeyDate = journey.departure_date_time.split('T')[0];
        return journeyDate === selectedDateFormatted;
      });

      if (filteredJourneys.length === 0) {
        await fetchExtendedTimeframeJourney(fromCoords, toCoords, dateTimeFormat, dateTimeRepresents);
        return;
      }

      data.journeys = responseData.journeys.slice(0, 3);
      data.noResult = false;
      data.selectedRouteJourney = data.journeys[0];

      if (activeTab.value === 'outbound') {
        calculateReturnParameters();
        await determineReturnWaypoint();
      }

      // Trigger recenter after journey selection
      recenterMapOnDocuments();
    } else {
      await fetchExtendedTimeframeJourney(fromCoords, toCoords, dateTimeFormat, dateTimeRepresents);
    }
  } catch (error) {
    queryError.value = (error as NavitiaError)?.response?.data?.errors?.[0]?.description;
    if (!(queryError.value && queryError.value in errorMessages)) {
      console.error('Error retrieving routes:', error);
    }
    if (queryError.value === 'no_solution' || queryError.value === 'unknown_object') {
      await fetchExtendedTimeframeJourney(fromCoords, toCoords, dateTimeFormat, dateTimeRepresents);
    } else {
      data.noResult = true;
      data.journeys = [];
    }
  } finally {
    data.isUpdating = false;

    // Trigger recenter after processing
    recenterMapOnDocuments();
  }
}

type NavitiaError = { response?: { data?: { errors?: { description?: string }[] } } };

async function fetchExtendedTimeframeJourney(
  fromCoords: string,
  toCoords: string,
  dateTimeFormat: string,
  dateTimeRepresents: DatetimeRepresents
) {
  const data = currentData.value;
  try {
    const datePart = dateTimeFormat.substring(0, 8);
    const dateTimeAtStartOfDay = datePart + 'T000100'; // Format: YYYYMMDDT000100
    const response = await NavitiaService.getJourneys(
      {
        from: fromCoords,
        to: toCoords,
        datetime: dateTimeAtStartOfDay,
        datetime_represents: dateTimeRepresents,
      },
      journeyOptions({
        walking_speed: 1.12,
        max_walking_duration_to_pt: 4464,
        min_nb_journeys: 3,
        timeframe_duration: 86400,
      })
    );

    const responseData = response.data as { journeys?: RouteJourney[] };
    const selectedDateFormatted = data.selectedDate.replace(/-/g, '');

    if (responseData?.journeys && responseData.journeys.length > 0) {
      const filteredJourneys = responseData.journeys.filter((journey) => {
        const journeyDate = journey.departure_date_time.split('T')[0];
        return journeyDate === selectedDateFormatted;
      });

      if (filteredJourneys.length > 0) {
        const lastDepartureTime = filteredJourneys.reduce((latest, journey) => {
          const depTime = journey.departure_date_time.substring(9); // HHMMSS
          return depTime > latest ? depTime : latest;
        }, '000000');

        const bestLastJourney = filteredJourneys.find(
          (journey) => journey.departure_date_time.substring(9) === lastDepartureTime
        )!;

        data.journeys = [bestLastJourney];
        data.noResult = true;
        data.selectedRouteJourney = bestLastJourney;
        if (activeTab.value === 'outbound') {
          calculateReturnParameters();
          await determineReturnWaypoint();
        }
        data.showTimeButton = true;

        emit('calculate-route', {
          from: {
            address: activeTab.value === 'outbound' ? data.fromAddress : data.selectedWaypoint?.title,
            coordinates: activeTab.value === 'outbound' ? data.fromCoordinates : data.selectedWaypoint?.coordinates,
          },
          to: {
            address: activeTab.value === 'outbound' ? data.selectedWaypoint?.title : data.fromAddress,
            coordinates: activeTab.value === 'outbound' ? data.selectedWaypoint?.coordinates : data.fromCoordinates,
          },
          date: data.selectedDate,
          time: data.selectedTime,
          preference: data.timePreference,
          journeys: data.journeys,
          isExtendedTimeframe: true,
        });

        return;
      }
    }

    data.noResult = true;
    data.journeys = [];
  } catch (error) {
    queryError.value = (error as NavitiaError)?.response?.data?.errors?.[0]?.description;
    if (!(queryError.value && queryError.value in errorMessages)) {
      console.error('Error retrieving extended timeframe routes:', error);
    }
    data.noResult = true;
    data.journeys = [];
  }
}

/** Get the selected access waypoint on the map */
function handleWaypointClicked(document: { document_id: number }) {
  const waypoint = accessWaypoints.value.find((w) => w.id === document.document_id);
  if (waypoint) {
    currentData.value.selectedWaypoint = waypoint;
  }
}

/** Displays the routes of different transport on the map */
function prepareRouteDocuments(scheduleRecenter = true) {
  const data = currentData.value;
  if (!data.selectedRouteJourney || !data.journeys || data.journeys.length === 0) return [];
  const routeDocuments: MapDocument[] = [];
  const journey = data.selectedRouteJourney;

  journey.sections.forEach((section, index) => {
    if (section.geojson) {
      const isWalkingSection =
        section.type === 'street_network' || section.type === 'transfer' || section.mode === 'walking';

      const routeDocument = {
        document_id: `route-section-${index}`,
        type: 'r',
        geometry: {
          version: 1,
          geom: null,
          geom_detail: JSON.stringify({
            type: 'LineString',
            coordinates: section.geojson.coordinates.map((coord) => {
              const mercatorCoord = ol.proj.transform([coord[0], coord[1]], 'EPSG:4326', 'EPSG:3857');
              return [...mercatorCoord, 0.0, 0.0];
            }),
          }),
        },
        properties: {
          name: section.display_informations?.code,
          duration: section.duration,
          color: planATripUtils.getRouteColor(section),
          isWalking: isWalkingSection,
          nonInteractive: true,
        },
      };

      routeDocuments.push(routeDocument);

      if (index === 0) {
        const startCoord = section.geojson.coordinates[0];
        const startMercatorCoord = ol.proj.transform([startCoord[0], startCoord[1]], 'EPSG:4326', 'EPSG:3857');

        const startPointDocument = {
          document_id: `route-start-origin`,
          type: 'start',
          geometry: {
            version: 1,
            geom: JSON.stringify({
              type: 'Point',
              coordinates: [...startMercatorCoord, 0.0, 0.0],
            }),
          },
          properties: {
            name: 'Départ',
            color: '#4CAF50',
            radius: 12,
            image_url: start,
            nonInteractive: true,
          },
        };

        routeDocuments.push(startPointDocument);
      }

      if (!isWalkingSection) {
        if (index > 0) {
          const startCoord = section.geojson.coordinates[0];
          const startMercatorCoord = ol.proj.transform([startCoord[0], startCoord[1]], 'EPSG:4326', 'EPSG:3857');

          const startPointDocument = {
            document_id: `route-start-point-${index}`,
            type: 'p',
            geometry: {
              version: 1,
              geom: JSON.stringify({
                type: 'Point',
                coordinates: [...startMercatorCoord, 0.0, 0.0],
              }),
            },
            properties: {
              name: `Début section ${index + 1}`,
              color: '#FFFFFF',
              border_color: '#000000',
              radius: 5,
            },
          };

          routeDocuments.push(startPointDocument);
        }

        const endCoord = section.geojson.coordinates[section.geojson.coordinates.length - 1];
        const endMercatorCoord = ol.proj.transform([endCoord[0], endCoord[1]], 'EPSG:4326', 'EPSG:3857');

        const endPointDocument = {
          document_id: `route-end-point-${index}`,
          type: 'p',
          geometry: {
            version: 1,
            geom: JSON.stringify({
              type: 'Point',
              coordinates: [...endMercatorCoord, 0.0, 0.0],
            }),
          },
          properties: {
            name: `Fin section ${index + 1}`,
            color: '#FFFFFF',
            border_color: '#000000',
            radius: 5,
          },
        };

        routeDocuments.push(endPointDocument);
      }
    }
  });

  if (scheduleRecenter && olMap.value) {
    recenterMapOnDocuments();
  }

  return routeDocuments;
}

/** Leaves earlier button */
function departEarlier() {
  const data = currentData.value;
  const [hours, minutes] = data.selectedTime.split(':').map(Number);
  let newHours = hours - 1;
  let newDate = data.selectedDate;

  if (newHours < 0) {
    newHours = 23;
    newDate = addDays(data.selectedDate, -1);
  }

  data.selectedTime = `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  data.selectedDate = newDate;

  calculateRoute();
}

/** Leaves later button */
function departLater() {
  const data = currentData.value;
  const [hours, minutes] = data.selectedTime.split(':').map(Number);
  let newHours = hours + 1;
  let newDate = data.selectedDate;

  if (newHours > 23) {
    newHours = 0;
    newDate = addDays(data.selectedDate, 1);
  }

  data.selectedTime = `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  data.selectedDate = newDate;

  calculateRoute();
}

/** Next day button */
function nextDay() {
  currentData.value.selectedDate = addDays(currentData.value.selectedDate, 1);

  calculateRoute();
}

/** Switch between outbound and return tabs */
function switchTab(tab: string) {
  if (tab === 'return' && hasReturnTrip.value && !canAccessReturnTab.value) {
    return;
  }

  activeTab.value = tab;

  const isReturnTab = tab === 'return';
  const source = isReturnTab ? outboundData.value : returnData.value;
  const target = isReturnTab ? returnData.value : outboundData.value;

  if (!hasReturnTrip.value) {
    // One-way trip: keep both tabs in sync.
    target.fromAddress = source.fromAddress;
    target.fromCoordinates = source.fromCoordinates;
    target.selectedWaypoint = source.selectedWaypoint;
    return;
  }

  // Return trip: only initialize the return tab if it hasn't been set yet.
  if (!target.fromAddress && source.selectedWaypoint) {
    target.selectedWaypoint = source.selectedWaypoint;

    if (source.fromAddress && source.fromCoordinates) {
      target.fromAddress = source.fromAddress;
      target.fromCoordinates = source.fromCoordinates;
    }
  }
}

/** The shortest duration of the route, in days: '10+' gives NaN */
function shortestDuration() {
  return props.document.durations?.length ? Math.min(...props.document.durations.map(Number)) : null;
}

/** Calculation of return fields, according to the available or calculated duration */
function calculateReturnParameters() {
  const outbound = outboundData.value;
  const back = returnData.value;
  if (!outbound.journeys || outbound.journeys.length === 0) {
    return;
  }
  const outboundJourney = outbound.journeys[0];
  const arrivalTime = outboundJourney.arrival_date_time;

  // Recovery of the theoretical duration or the duration entered
  const theoreticalDuration = props.document.calculated_duration; // in days (float)
  const itineraryDuration = shortestDuration(); // in days (integer)

  // Case 1: Duration <= 1 day with valid theoretical duration
  if (theoreticalDuration && theoreticalDuration <= 1 && itineraryDuration && itineraryDuration <= 1) {
    const returnDate = outbound.selectedDate;

    // Calculation of return time (arrival time + theoretical duration)
    const arrivalHour = parseInt(arrivalTime.substring(9, 11));
    const arrivalMinute = parseInt(arrivalTime.substring(11, 13));

    const additionalHours = Math.floor(theoreticalDuration * 24);
    const additionalMinutes = Math.round((theoreticalDuration * 24 - additionalHours) * 60);

    let returnHour = arrivalHour + additionalHours;
    let returnMinute = arrivalMinute + additionalMinutes;

    // Minutes management > 60
    if (returnMinute >= 60) {
      returnHour += Math.floor(returnMinute / 60);
      returnMinute = returnMinute % 60;
    }

    // Time management > 24
    if (returnHour >= 24) {
      // Case 2: Return impossible on the same day
      returnHour = 17;
      returnMinute = 0;
    }

    back.selectedDate = returnDate;
    back.selectedTime = `${returnHour.toString().padStart(2, '0')}:${returnMinute.toString().padStart(2, '0')}`;
  }
  // Case 3: Duration > 1 day
  else if (itineraryDuration && itineraryDuration > 1) {
    back.selectedDate = addDays(outbound.selectedDate, Math.ceil(itineraryDuration));
    back.selectedTime = '17:00';
  }
  // Case 4: Other cases (theoretical duration not available or inconsistent)
  else {
    back.selectedDate = outbound.selectedDate;
    back.selectedTime = '17:00';
  }
}

/** Loads waypoints that are accessible by public transport */
async function loadReachableWaypoints() {
  loadingReachable.value = true;
  reachableWaypoints.value = [];
  let accessPoints: MapDocument[] = [];
  if (documentType.value === 'waypoint' && props.document.waypoint_type === 'access') {
    // access waypoint
    accessPoints = [props.document];
  } else {
    // for other types of documents, return the waypoints of type access associated (if any)
    accessPoints =
      props.document?.associations?.waypoints?.filter((doc: MapDocument) => doc && doc.waypoint_type === 'access') ??
      [];
  }
  const reachableChecks = [];

  // Check the accessibility of each waypoint
  for (const waypoint of accessPoints) {
    reachableChecks.push(
      transportService
        .isReachable(waypoint.document_id)
        .then((isReachable) => ({ waypoint, isReachable }))
        .catch(() => ({ waypoint, isReachable: false }))
    );
  }

  const results = await Promise.all(reachableChecks);

  // Filter served waypoints
  for (const result of results) {
    if (result.isReachable) {
      const locale =
        result.waypoint.locales.find((l: { lang: string }) => l.lang === $language.current) ||
        result.waypoint.locales[0];
      const geom = JSON.parse(result.waypoint.geometry.geom);
      reachableWaypoints.value.push({
        id: result.waypoint.document_id,
        title: locale.title,
        coordinates: transform(geom.coordinates, 'EPSG:3857', 'EPSG:4326'),
      });
    }
  }

  loadingReachable.value = false;
}

/** Method to determine the return waypoint automatically */
async function determineReturnWaypoint() {
  const outbound = outboundData.value;
  const back = returnData.value;
  const reachable = reachableWaypoints.value;
  if (!outbound.journeys || outbound.journeys.length === 0) {
    return;
  }

  // Case 1: No waypoint served
  if (reachable.length === 0) {
    back.selectedWaypoint = null;
    return;
  }

  // Case 2: Only one waypoint served (loop route)
  if (reachable.length === 1) {
    back.selectedWaypoint = reachable[0];
    return;
  }

  // Case 3: Two waypoints served (crossing)
  if (reachable.length === 2) {
    const outboundWaypointId = outbound.selectedWaypoint?.id;
    const returnWaypoint = reachable.find((w) => w.id !== outboundWaypointId);

    back.selectedWaypoint = returnWaypoint || reachable[1];
    return;
  }

  // Case 4: More than two waypoints served - let the user choose
  back.selectedWaypoint = null; // Reset to force manual selection
}

/** Displays the duration of the route in days or hours depending on the source */
function formatDurationForDisplay() {
  const durations = props.document.durations;
  const calculatedDuration = props.document.calculated_duration;
  if (durations?.length === 1 && durations[0] === '10+') {
    return '10+ ' + $gettext('Day(s)').toLowerCase();
  }

  const shouldUseCalculated = durations?.length && shortestDuration() === 1 && calculatedDuration;

  const durationInDays = (shouldUseCalculated ? calculatedDuration : (shortestDuration() ?? calculatedDuration)) ?? 0;

  if (durationInDays < 1) {
    const hours = durationInDays * 24;
    let hoursInt = Math.floor(hours);
    let minutes = Math.round((hours - hoursInt) * 60);

    if (minutes === 60) {
      hoursInt += 1;
      minutes = 0;
    }

    return `${hoursInt}h${minutes.toString().padStart(2, '0')}`;
  }

  if (durationInDays === 1) {
    return `1 ${$gettext('Day(s)').toLowerCase()}`;
  }

  return `${durationInDays} ${$gettext('Day(s)').toLowerCase()}`;
}

/** Helper method to recenter the map on documents if available */
function recenterMapOnDocuments() {
  nextTick(() => {
    // Only recenter if there are documents to recenter on
    if (olMap.value && currentData.value.journeys && currentData.value.journeys.length > 0) {
      olMap.value.recenterOnDocuments();
    }
  });
}
</script>

<style scoped lang="scss">
.plan-trip-section {
  margin-top: 20px;
  display: flex;
  gap: 20px;
  min-height: 650px;

  .plan-trip-info {
    flex: 1;
    flex-direction: column;
    display: flex;

    .trip-tabs {
      display: flex;
      .tab-button {
        color: #337ab7;
        padding-left: 60px;
        padding-right: 60px;
        padding-top: 10px;
        padding-bottom: 10px;
        background-color: white;
        border: 1px solid lightgray;
        border-top-right-radius: 10px;
        border-top-left-radius: 10px;
        font-weight: bold;
        margin-bottom: 20px;
      }
      .tab-button.disabled {
        color: #ccc !important;
        cursor: not-allowed !important;
        background-color: #f9f9f9 !important;
      }

      .tab-button:disabled {
        pointer-events: none;
      }
      .tab-button:hover {
        background-color: rgb(232, 232, 232);
        cursor: pointer;
      }
      .tab-button.active:hover {
        background-color: #337ab7;
        cursor: auto;
      }
      .tab-button.active {
        color: white;
        background-color: #337ab7;
      }
    }

    .plan-trip-content {
      display: flex;
      flex-direction: column;
      height: 100%;
      .plan-trip-title {
        font-size: 15px;
        font-weight: bold;
        margin-bottom: 15px;
      }

      .plan-trip-details {
        display: flex;
        flex-direction: column;
        gap: 15px;
        height: 84%;

        > p {
          margin-bottom: 10px;
        }
      }

      .plan-trip-search-button {
        margin-top: 10px;
        padding: 16px;
        display: flex;
        max-width: 220px;
        .plan-trip-search-button-text {
          font-weight: 600;
          margin-left: 12px;
        }
      }

      .non-valid-address {
        color: red;
      }

      .calculated-duration {
        max-width: 450px;
        padding: 10px;
        border: 1px solid #fdc42c;
        background-color: #ffe089;
        border-radius: 4px;
        .calculated-duration-number {
          font-weight: bold;
        }
      }
      .no-itineraries-container {
        border: 1px solid lightgrey;
        position: relative;
        border-radius: 4px;
        max-width: 450px;
        .no-itineraries {
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          .no-itineraries-img {
            width: 70px;
            height: 70px;
          }
          .no-itineraries-text {
            .no-itineraries-found {
              font-weight: bold;
            }
          }
        }
        .itineraries-container {
          max-width: 490px;
          flex: 1;
          padding-right: 16px;
          transition: background-color 0.3s ease;
          position: relative;

          .itinerary-header {
            border: 1px solid lightgrey;
            border-left: 4px solid #337ab7;
            border-radius: 4px;
            padding: 10px;
            margin-top: 12px;
            cursor: pointer;
            .itinerary-time {
              display: flex;
              .journey-duration {
                margin-left: auto;
                margin-right: 5px;
                font-weight: bold;
              }
            }

            .journey-steps {
              display: flex;
              margin-top: 8px;
              flex-wrap: wrap;

              .step-wrapper {
                display: flex;
                gap: 15px;

                .journey-step {
                  .transport-icon {
                    margin-left: 8px;
                  }
                }
              }
            }
          }
          .selected {
            border-left: 4px solid #4baf50;
            background-color: #fbfaf6;
          }
        }
      }
      .navitia-unknown-error {
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 10px;
        .navitia-unknown-error-img {
          width: 100px;
          height: 100px;
          margin-right: 8px;
        }
        .navitia-unknown-error-text {
          .navitia-unknown-error-title {
            font-weight: bold;
          }
        }
      }
      .itineraries-container.updating::before,
      .no-itineraries-container.updating::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(255, 255, 255, 0.8);
        z-index: 10;
        pointer-events: none;
      }

      @keyframes fadeFlash {
        0% {
          opacity: 0;
        }
        50% {
          opacity: 1;
        }
        100% {
          opacity: 0;
        }
      }

      .time-modification-buttons {
        display: flex;
        justify-content: space-between;
        margin-top: 16px;
        position: sticky;

        .modification-buttons {
          padding: 8px;
          border: 1px solid lightgray;
          align-items: center;
          display: flex;
          background-color: white;
          gap: 6px;
          border-radius: 3px;

          span {
            color: #337ab7;
            font-weight: bold;
          }
        }
        .modification-buttons:hover {
          background-color: #f1f0f0;
          cursor: pointer;
        }
      }
    }
  }

  .plan-trip-map {
    height: auto;
    width: 600px;
    max-height: 650px;
    border: 1px solid lightgray;
    border-radius: 4px;
  }
}

@media only screen and (max-width: 600px) {
  .plan-trip-section {
    display: inline !important;

    .plan-trip-info {
      margin-bottom: 20px;
    }

    .plan-trip-map {
      height: 275px !important;
      width: auto !important;
      margin-left: auto;
      margin-right: auto;
    }
  }
  .from-to-container {
    width: 100% !important;
  }
}
.is-firefox .calendar-icon {
  display: none !important;
}

.fullwidth {
  width: 100% !important;
}
</style>
