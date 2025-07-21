<template>
  <div class="plan-trip-section">
    <div class="plan-trip-info">
      <div class="trip-tabs">
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
          <div class="plan-trip-from-to">
            <div class="from-to-container">
              <!-- Trajet ALLER : De = adresse, À = waypoint -->
              <template v-if="activeTab === 'outbound'">
                <div class="from-container">
                  <div class="from-text">{{ $gettext('From') }}</div>
                  <div class="autocomplete-container">
                    <input
                      class="from-address"
                      v-model="fromAddress"
                      @input="searchAddressPropositions"
                      @focus="showAddressPropositions = true"
                      @blur="handleBlur"
                      :placeholder="$gettext('Enter a departure address')"
                      autocomplete="address-line1"
                    />
                    <div class="autocomplete-results" v-if="showAddressPropositions && addressPropositions.length > 0">
                      <ul>
                        <li
                          v-for="(proposition, index) in addressPropositions"
                          :key="index"
                          @mousedown="selectAddress(proposition)"
                        >
                          {{ formatProposition(proposition) }}
                        </li>
                      </ul>
                    </div>
                  </div>
                  <button class="geolocalisation" @click="useCurrentLocation">
                    <img class="geolocalisation-img" src="@/assets/img/boxes/geoloc.svg" alt="geoloc" />
                  </button>
                </div>
                <div class="to-container">
                  <div class="to-text">{{ $gettext('To') }}</div>
                  <template v-if="accessWaypoints.length > 1">
                    <select name="chose-waypoint" class="chose-waypoint" id="chose-waypoint" v-model="selectedWaypoint">
                      <option v-for="waypoint in accessWaypoints" :key="waypoint.id" :value="waypoint">
                        {{ waypoint.title }}
                      </option>
                    </select>
                  </template>
                  <template v-else-if="accessWaypoints.length === 1">
                    <div class="single-waypoint to-address">
                      {{ accessWaypoints[0].title }}
                    </div>
                  </template>
                  <template v-else>
                    <div class="no-waypoint" v-if="loadingReachable">{{ $gettext('Loading access points...') }}</div>
                    <div class="no-waypoint to-address" v-else>{{ $gettext('No access points available') }}</div>
                  </template>
                </div>
              </template>

              <!-- Trajet RETOUR : De = waypoint, À = adresse -->
              <template v-else>
                <div class="to-container-return">
                  <div class="to-text">{{ $gettext('From') }}</div>
                  <select
                    name="chose-waypoint"
                    class="chose-waypoint"
                    id="chose-waypoint-return"
                    v-model="selectedWaypoint"
                  >
                    <option v-for="waypoint in accessWaypoints" :key="waypoint.id" :value="waypoint">
                      {{ waypoint.title }}
                    </option>
                  </select>
                </div>
                <div class="from-container-return">
                  <div class="from-text">{{ $gettext('To') }}</div>
                  <div class="autocomplete-container">
                    <input
                      class="from-address"
                      v-model="fromAddress"
                      @input="searchAddressPropositions"
                      @focus="showAddressPropositions = true"
                      @blur="handleBlur"
                      placeholder="Entrez une adresse de destination"
                    />
                    <div class="autocomplete-results" v-if="showAddressPropositions && addressPropositions.length > 0">
                      <ul>
                        <li
                          v-for="(proposition, index) in addressPropositions"
                          :key="index"
                          @mousedown="selectAddress(proposition)"
                        >
                          {{ formatProposition(proposition) }}
                        </li>
                      </ul>
                    </div>
                  </div>
                  <button class="geolocalisation geolocalisation-return" @click="useCurrentLocation">
                    <img class="geolocalisation-img" src="@/assets/img/boxes/geoloc.svg" alt="geoloc" />
                  </button>
                </div>
              </template>
            </div>
          </div>

          <div class="select-date-container">
            <div class="date-picker-container">
              <label for="date-input">{{ $gettext('Date') }}</label>
              <div class="input-container">
                <input type="date" id="date-input" class="date-input" v-model="selectedDate" />
                <div class="calendar-icon">
                  <img class="geolocalisation-img" src="@/assets/img/boxes/date.svg" alt="date" />
                </div>
              </div>
            </div>

            <div class="date-picker-container">
              <label for="date-input">{{ $gettext('Preference') }}</label>
              <div class="input-container">
                <select name="preference" class="date-input" id="preference" v-model="timePreference">
                  <option value="leave-after">{{ $gettext('Leave after') }}</option>
                  <option value="arrive-before">{{ $gettext('Arrive before') }}</option>
                </select>
              </div>
            </div>

            <div class="date-picker-container hour-picker-container">
              <label for="date-input">{{ $gettext('Time') }}</label>
              <div class="input-container">
                <input type="time" id="hour-input" class="hour-input" v-model="selectedTime" />
              </div>
            </div>
          </div>

          <div class="chose-transfer-limit">
            <div class="chose-if-transfer-wanted">
              <label for="limitTransfers" class="toggle-label">
                {{ $gettext('Limit the number of connections') }}
              </label>
              <label class="toggle">
                <input type="checkbox" id="btnToggle" name="btnToggle" v-model="limitTransfers" />
                <span class="slider"></span>
              </label>
            </div>
            <div v-if="limitTransfers" class="chose-nb-transfer" id="transferCountContainer">
              <select class="number-dd" id="number-dd" name="number" v-model="maxTransfers">
                <option value="0" :selected.attr="'selected'">0 (direct)</option>
                <option value="1">1 max</option>
                <option value="2">2 max</option>
                <option value="3">3 max</option>
                <option value="4">4 max</option>
                <option value="5">5 max</option>
              </select>
            </div>
          </div>

          <div v-if="missingDepartureAddress || missingDestinationAddress" class="non-valid-address">
            <div v-if="missingDepartureAddress">
              {{ $gettext('Please select a departure address.') }}
            </div>
            <div v-if="missingDestinationAddress">
              {{ $gettext('Please select a destination.') }}
            </div>
          </div>

          <button class="button is-primary plan-trip-search-button" @click="calculateRoute">
            <img class="" src="@/assets/img/boxes/itineraire.svg" alt="itinerary" />
            <p class="plan-trip-search-button-text" v-if="activeTab === 'outbound'">
              {{ $gettext('Calculate my outbound trip') }}
            </p>
            <p class="plan-trip-search-button-text" v-else>
              {{ $gettext('Calculate my return trip') }}
            </p>
          </button>

          <div class="calculated-duration" v-if="activeTab === 'return'">
            <div class="calculated-duration-number">
              {{ $gettext('This route guide has an estimated theoretical duration of') }}
              {{ formatDurationForDisplay() }}.
            </div>
            <div class="calculated-duration-vigilant">
              {{ $gettext('Be mindful of the departure time for your return trip!') }}
            </div>
          </div>

          <div class="no-itineraries-container" :class="{ updating: isUpdating }" v-if="noResult">
            <div class="no-itineraries">
              <img
                class="no-itineraries-img"
                src="@/assets/img/boxes/transport_not_found.svg"
                alt="transport not found"
              />
              <div class="no-itineraries-text">
                <div class="no-itineraries-found">{{ $gettext('No public transport found') }}</div>
                <div class="no-itineraries-detail">
                  {{ $gettext("It seems your trip can't be completed on the selected date and and time") }}
                </div>
              </div>
            </div>
          </div>

          <div class="itineraries-container" :class="{ updating: isUpdating }" v-if="journeys.length > 0">
            <div class="last-journey-message" v-if="noResult">
              {{ $gettext('Here is the last journey of the day :') }}
            </div>
            <div class="itinerary-card" v-for="(journey, index) in journeys" :key="index">
              <div
                class="itinerary-header"
                :class="{ selected: selectedRouteJourney === journey }"
                @click="selectRouteOnly(journey)"
              >
                <div class="itinerary-time">
                  {{ formatTime(journey.departure_date_time) }} — {{ formatTime(journey.arrival_date_time) }}
                  <span class="journey-duration">{{ formatJourneyDuration(journey.duration) }}</span>
                </div>

                <div class="itinerary-path">
                  <div class="journey-steps">
                    <div v-for="(section, sectionIndex) in journey.sections" :key="sectionIndex" class="step-wrapper">
                      <div
                        v-if="
                          section.type === 'public_transport' ||
                          section.type === 'transfer' ||
                          section.type === 'street_network' ||
                          section.type === 'on_demand_transport'
                        "
                        class="journey-step"
                      >
                        <div
                          v-if="section.type === 'public_transport' || section.type === 'on_demand_transport'"
                          class="transport-icon"
                          :class="getTransportClass(section)"
                        >
                          <img :src="require(`@/assets/img/boxes/${getTransportIcon(section)}.svg`)" alt="walking" />
                        </div>
                        <div
                          v-else-if="
                            section.type === 'street_network' ||
                            section.type === 'transfer' ||
                            section.mode === 'walking'
                          "
                          class="transport-icon walking"
                        >
                          <img src="@/assets/img/boxes/walk.svg" alt="walking" />
                        </div>
                      </div>
                      <div
                        v-if="sectionIndex < journey.sections.length - 1 && section.type !== 'waiting'"
                        class="connector"
                      >
                        <img src="@/assets/img/boxes/chevron_right.svg" alt="chevron" />
                      </div>
                    </div>
                  </div>
                </div>

                <div class="itinerary-details-button">
                  <button class="button is-info is-light" @click="showJourneyDetails(journey)">
                    {{ selectedJourney === journey ? $gettext('Hide details') : $gettext('View details') }}
                  </button>
                </div>
              </div>

              <div class="journey-details" v-if="selectedJourney === journey">
                <div class="journey-timeline">
                  <div class="timeline-item">
                    <div class="timeline-time">{{ formatTime(journey.departure_date_time) }}</div>
                    <div class="timeline-icon-beginning">
                      <img src="@/assets/img/boxes/start.svg" alt="start" />
                    </div>
                    <div class="timeline-content" v-if="activeTab === 'outbound'">
                      <div class="timeline-address">{{ displayedFromAddress }}</div>
                    </div>
                    <div class="timeline-content" v-else>
                      <div class="timeline-address">{{ selectedWaypoint?.title || 'Destination' }}</div>
                    </div>
                  </div>

                  <!-- Affichage des sections de l'itinéraire -->
                  <div v-for="(section, sectionIndex) in journey.sections" :key="sectionIndex">
                    <!-- Section marche à pied -->
                    <div
                      v-if="
                        section.type === 'street_network' || section.type === 'transfer' || section.mode === 'walking'
                      "
                      class="timeline-item walking"
                    >
                      <div class="timeline-time"></div>
                      <div class="timeline-icon walking">
                        <img src="@/assets/img/boxes/walk.svg" alt="walking" />
                      </div>
                      <div class="timeline-content">
                        <div class="timeline-walking-info">
                          {{ getDistance(section) }} {{ $gettext('Meter(s)').toLowerCase() }},
                          {{ formatDuration(section.duration) }}
                        </div>
                      </div>
                    </div>

                    <!-- Section transport en commun -->
                    <div v-else-if="section.type === 'public_transport' || section.type === 'on_demand_transport'">
                      <!-- Arrêt de départ -->
                      <div class="timeline-item">
                        <div class="timeline-time">{{ formatTime(section.departure_date_time) }}</div>
                        <div class="timeline-icon stop">
                          <i class="stop-circle"></i>
                        </div>
                        <div class="timeline-content">
                          <div class="timeline-stop-name">
                            <strong>{{ $gettext('Stop') }} : </strong> {{ section.from?.name || 'Départ' }}
                          </div>
                        </div>
                      </div>

                      <!-- Ligne de transport -->
                      <div
                        class="timeline-item transport"
                        :class="getTransportColorClass(section)"
                        :style="{
                          'border-left': section.display_informations?.color
                            ? `3px solid #${
                                section.display_informations.color === 'FFFFFF'
                                  ? '808080'
                                  : section.display_informations.color
                              }`
                            : '3px solid gray',
                        }"
                      >
                        <div class="timeline-content">
                          <div class="timeline-line">
                            <strong>{{ $gettext('Line') }} : </strong> {{ section.display_informations?.code || '' }}
                            <img
                              v-if="section.display_informations?.equipments?.includes('has_bike_accepted')"
                              src="@/assets/img/boxes/velo.svg"
                              alt="bike accepted"
                            />
                            <span v-if="section.type === 'on_demand_transport'" class="on-demand-text">
                              {{ $gettext('Warning, this transport is on demand ⚠') }}
                            </span>
                          </div>
                          <div class="timeline-direction">
                            <strong>{{ $gettext('Direction') }} : </strong
                            >{{ section.display_informations?.direction || '' }}
                          </div>
                          <div class="timeline-duration">
                            <strong>{{ $gettext('Duration') }} : </strong
                            >{{ formatJourneyDuration(calculateSectionDuration(section)) }}
                          </div>
                          <div class="timeline-accessibility" v-if="section.display_informations?.equipments?.length">
                            <img
                              v-if="section.display_informations.equipments.includes('has_bike_accepted')"
                              src="@/assets/img/boxes/velo.svg"
                              alt="bike"
                            />
                            <img
                              v-if="section.display_informations.equipments.includes('has_wheelchair')"
                              src="@/assets/img/boxes/handi_accessible.svg"
                              alt="wheelchair"
                            />
                          </div>
                        </div>
                      </div>

                      <!-- Arrêt d'arrivée -->
                      <div class="timeline-item">
                        <div class="timeline-time">{{ formatTime(section.arrival_date_time) }}</div>
                        <div class="timeline-icon stop">
                          <i class="stop-circle"></i>
                        </div>
                        <div class="timeline-content">
                          <div class="timeline-stop-name">
                            <strong>{{ $gettext('Stop') }} : </strong>{{ section.to?.name || 'Arrivée' }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Heure et adresse d'arrivée -->
                  <div class="timeline-item destination">
                    <div class="timeline-time">{{ formatTime(journey.arrival_date_time) }}</div>
                    <div class="timeline-icon-end">
                      <img src="@/assets/img/boxes/end.svg" alt="end" />
                    </div>
                    <div class="timeline-content" v-if="activeTab === 'outbound'">
                      <div class="timeline-address">{{ selectedWaypoint?.title || 'Destination' }}</div>
                    </div>
                    <div class="timeline-content" v-else>
                      <div class="timeline-address">{{ displayedToAddress }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="time-modification-buttons" v-if="showTimeButton">
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

    <div class="plan-trip-map">
      <map-view
        ref="mapView"
        :documents="filteredDocuments"
        :show-protection-areas="['r', 'w'].includes(document.type)"
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

<script>
import { transform } from 'ol/proj';

import start from '@/assets/img/boxes/geoloc-2.svg';
import { default as c2c } from '@/js/apis/c2c';
import UserProfileService from '@/js/apis/c2c/UserProfileService';
import NavitiaService from '@/js/apis/navitia-service';
import photon from '@/js/apis/photon';
import transportService from '@/js/apis/transport-service';
import ol from '@/js/libs/ol';

export default {
  name: 'PlanATripSection',
  props: {
    document: {
      type: Object,
      required: true,
    },
    showElevationProfile: {
      type: Boolean,
      default: false,
    },
    elevationProfileHasData: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      activeTab: 'outbound',

      // Data for the outbound journey
      outboundData: {
        fromAddress: '',
        selectedAddress: null,
        addressPropositions: [],
        showAddressPropositions: false,
        selectedDate: new Date().toISOString().slice(0, 10),
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
        limitTransfers: false,
        maxTransfers: 0,
      },

      // Data for return journey
      returnData: {
        fromAddress: '',
        selectedAddress: null,
        addressPropositions: [],
        showAddressPropositions: false,
        selectedDate: new Date().toISOString().slice(0, 10),
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
        limitTransfers: false,
        maxTransfers: 0,
      },

      userService: new UserProfileService(c2c),
      displayedFromAddress: '',
      displayedToAddress: '',
      showReturnWarning: false,
      calculatedDuration: this.document.calculated_duration,
      reachableWaypoints: [],
      loadingReachable: false,
      searchTimeout: null,
    };
  },

  async mounted() {
    // Loads a user's address to put it directly into the 'address' field
    await this.loadUserAddressIfLoggedIn();

    // Firefox's date picker calendar has a specific design
    if (navigator.userAgent.toLowerCase().includes('firefox')) {
      document.documentElement.classList.add('is-firefox');
    }
  },

  computed: {
    /** Removes access points natively in routes, to code specific behaviors */
    filteredDocuments() {
      const filteredWaypoints =
        this.document.associations.waypoints?.filter((waypoint) => waypoint.waypoint_type !== 'access') || [];

      const mainDocument = {
        ...this.document,
        associations: {
          ...this.document.associations,
          waypoints: filteredWaypoints,
        },
      };

      return this.mapDocuments.concat([mainDocument]);
    },

    /** Determines if a waypoint is accessible by public transport */
    accessWaypoints() {
      return this.reachableWaypoints.length > 0 ? this.reachableWaypoints : [];
    },

    /** Customizes access points: clicking makes a selection instead of redirecting to a page, and the color is green */
    mapDocuments() {
      const baseDocuments = this.document.associations.waypoints ? [this.document.associations.waypoints] : [];
      const accessWaypointDocuments = this.accessWaypoints.map((waypoint) => {
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
          locales: [{ title: waypoint.title, lang: this.$language.current }],
        };
      });

      const routeDocuments = this.prepareRouteDocuments();

      return [...baseDocuments, ...accessWaypointDocuments, ...routeDocuments];
    },

    /** Returns the outbound or return data */
    currentData() {
      return this.activeTab === 'outbound' ? this.outboundData : this.returnData;
    },

    fromAddress: {
      get() {
        return this.currentData.fromAddress;
      },
      set(value) {
        this.currentData.fromAddress = value;
      },
    },

    selectedAddress: {
      get() {
        return this.currentData.selectedAddress;
      },
      set(value) {
        this.currentData.selectedAddress = value;
      },
    },

    addressPropositions: {
      get() {
        return this.currentData.addressPropositions;
      },
      set(value) {
        this.currentData.addressPropositions = value;
      },
    },

    showAddressPropositions: {
      get() {
        return this.currentData.showAddressPropositions;
      },
      set(value) {
        this.currentData.showAddressPropositions = value;
      },
    },

    selectedDate: {
      get() {
        return this.currentData.selectedDate;
      },
      set(value) {
        this.currentData.selectedDate = value;
      },
    },

    selectedTime: {
      get() {
        return this.currentData.selectedTime;
      },
      set(value) {
        this.currentData.selectedTime = value;
      },
    },

    timePreference: {
      get() {
        return this.currentData.timePreference;
      },
      set(value) {
        this.currentData.timePreference = value;
      },
    },

    fromCoordinates: {
      get() {
        return this.currentData.fromCoordinates;
      },
      set(value) {
        this.currentData.fromCoordinates = value;
      },
    },

    selectedWaypoint: {
      get() {
        return this.currentData.selectedWaypoint;
      },
      set(value) {
        this.currentData.selectedWaypoint = value;
      },
    },

    journeys: {
      get() {
        return this.currentData.journeys;
      },
      set(value) {
        this.currentData.journeys = value;
      },
    },

    selectedJourney: {
      get() {
        return this.currentData.selectedJourney;
      },
      set(value) {
        this.currentData.selectedJourney = value;
      },
    },

    noResult: {
      get() {
        return this.currentData.noResult;
      },
      set(value) {
        this.currentData.noResult = value;
      },
    },

    selectedRouteJourney: {
      get() {
        return this.currentData.selectedRouteJourney;
      },
      set(value) {
        this.currentData.selectedRouteJourney = value;
      },
    },

    showTimeButton: {
      get() {
        return this.currentData.showTimeButton;
      },
      set(value) {
        this.currentData.showTimeButton = value;
      },
    },

    isUpdating: {
      get() {
        return this.currentData.isUpdating;
      },
      set(value) {
        this.currentData.isUpdating = value;
      },
    },

    missingDepartureAddress: {
      get() {
        return this.currentData.missingDepartureAddress;
      },
      set(value) {
        this.currentData.missingDepartureAddress = value;
      },
    },

    missingDestinationAddress: {
      get() {
        return this.currentData.missingDestinationAddress;
      },
      set(value) {
        this.currentData.missingDestinationAddress = value;
      },
    },

    limitTransfers: {
      get() {
        return this.currentData.limitTransfers;
      },
      set(value) {
        this.currentData.limitTransfers = value;
      },
    },

    maxTransfers: {
      get() {
        return this.limitTransfers ? this.currentData.maxTransfers : null;
      },
      set(value) {
        this.currentData.maxTransfers = value;
      },
    },

    canAccessReturnTab() {
      return this.outboundData.journeys.length > 0;
    },
  },

  async mounted() {
    // Loads a user's address to put it directly into the 'address' field
    await this.loadUserAddressIfLoggedIn();

    // Firefox's date picker calendar has a specific design
    if (navigator.userAgent.toLowerCase().includes('firefox')) {
      document.documentElement.classList.add('is-firefox');
    }
  },

  async created() {
    // Load the waypoints served when mounting the component
    await this.loadReachableWaypoints();

    // If only one waypoint served, select it automatically
    if (this.reachableWaypoints.length === 1) {
      this.selectedWaypoint = this.reachableWaypoints[0];
    }
  },

  methods: {
    /** Address auto-complete, launched when the user has not typed anything for 0.6 seconds */
    async searchAddressPropositions() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }

      if (this.fromAddress?.length < 3) {
        this.showAddressPropositions = false;
        this.addressPropositions = [];
        return;
      }

      this.searchTimeout = setTimeout(async () => {
        const center = this.$refs.mapView?.view?.getCenter();
        const centerWgs84 = center ? ol.proj.toLonLat(center) : null;

        try {
          const response = await photon.getPropositions(this.fromAddress, this.$language.current, centerWgs84);
          this.addressPropositions = response.data.features.slice(0, 6) || [];
          this.showAddressPropositions = this.addressPropositions.length > 0;
        } catch (error) {
          console.error('Error searching for addresses:', error);
          this.addressPropositions = [];
        }
      }, 600);
    },

    /** Takes selected address proposition */
    selectAddress(proposition) {
      this.selectedAddress = proposition;
      this.fromAddress = this.formatProposition(proposition);
      this.fromCoordinates = proposition.geometry.coordinates;
      this.showAddressPropositions = false;
    },

    /** Format address proposition rendered by Photon */
    formatProposition(proposition) {
      const props = proposition.properties;
      let formattedAddress = props.name || '';

      if (props.housenumber) {
        formattedAddress = `${formattedAddress} ${props.housenumber}`;
      }

      if (props.street) {
        formattedAddress = `${formattedAddress}${' '}${props.street}`;
      }

      if (props.city) {
        formattedAddress = `${formattedAddress}${formattedAddress ? ', ' : ''}${props.city}`;
      }

      if (props.postcode) {
        formattedAddress = `${formattedAddress} ${props.postcode}`;
      }

      if (props.country) {
        formattedAddress = `${formattedAddress}${formattedAddress ? ', ' : ''}${props.country}`;
      }

      return formattedAddress;
    },

    /** Short delay to allow selection before hiding suggestions */
    handleBlur() {
      setTimeout(() => {
        this.showAddressPropositions = false;
      }, 200);
    },

    /** Takes current location and use reverse query with Photon to get location name */
    useCurrentLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const coords = [position.coords.longitude, position.coords.latitude];
            this.fromCoordinates = coords;

            try {
              const response = await fetch(
                `https://photon.komoot.io/reverse?lon=${coords[0]}&lat=${coords[1]}&lang=${this.$language.current}`
              );
              const data = await response.json();

              if (data.features && data.features.length > 0) {
                const location = data.features[0];
                this.fromAddress = this.formatProposition(location);
              }
            } catch (error) {
              console.error('Error during reverse geolocation:', error);
              this.fromAddress = `${coords[1]}, ${coords[0]}`;
            }
          },
          (error) => {
            console.error('Geolocation error:', error);
            alert('Unable to get your current location.');
          }
        );
      } else {
        alert('Geolocation is not supported by your browser.');
      }
    },

    /** Call Navitia and store the results */
    async calculateRoute() {
      this.missingDepartureAddress = false;
      this.missingDestinationAddress = false;

      if (
        (this.activeTab === 'outbound' && !this.fromAddress) ||
        (this.activeTab === 'return' && !this.selectedWaypoint)
      ) {
        this.missingDepartureAddress = true;
      }

      if (
        (this.activeTab === 'outbound' && !this.selectedWaypoint) ||
        (this.activeTab === 'return' && !this.fromAddress)
      ) {
        this.missingDestinationAddress = true;
      }

      if (this.missingDepartureAddress || this.missingDestinationAddress) {
        return;
      }
      let fromCoords, toCoords, fromAddressDisplay;

      if (this.activeTab === 'outbound') {
        // OUTBOUND: From address to waypoint
        fromCoords = NavitiaService.formatCoordinates(this.fromCoordinates);
        toCoords = NavitiaService.formatCoordinates(this.selectedWaypoint.coordinates);
        this.displayedFromAddress = this.fromAddress;
      } else {
        // RETURN: From waypoint to address
        fromCoords = NavitiaService.formatCoordinates(this.selectedWaypoint.coordinates);
        toCoords = NavitiaService.formatCoordinates(this.fromCoordinates);
        this.displayedToAddress = this.fromAddress;
      }

      this.isUpdating = true;

      // Format datetime for Navitia API minus 15 minutes
      const originalDateTime = new Date(`${this.selectedDate}T${this.selectedTime}:00`);
      const adjustedDateTime = new Date(originalDateTime);

      if (originalDateTime.getHours() === 0 && originalDateTime.getMinutes() < 15) {
        adjustedDateTime.setTime(originalDateTime.getTime());
      } else {
        adjustedDateTime.setTime(originalDateTime.getTime() - 15 * 60 * 1000);
      }

      const dateTimeFormat =
        adjustedDateTime.toISOString().slice(0, 10).replace(/-/g, '') +
        'T' +
        adjustedDateTime.toTimeString().slice(0, 5).replace(':', '') +
        '00';
      const dateTimeRepresents = this.timePreference === 'arrive-before' ? 'arrival' : 'departure';

      try {
        const response = await NavitiaService.getJourneys(
          {
            from: fromCoords,
            to: toCoords,
            datetime: dateTimeFormat,
            datetime_represents: dateTimeRepresents,
          },
          {
            walking_speed: 1.12,
            max_walking_duration_to_pt: 4464,
            min_nb_journeys: 3,
            max_nb_transfers: this.maxTransfers,
          }
        );

        const data = response.data;
        this.showTimeButton = true;
        const selectedDateFormatted = this.selectedDate.replace(/-/g, '');

        if (data.journeys) {
          const filteredJourneys = data.journeys.filter((journey) => {
            const journeyDate = journey.departure_date_time.split('T')[0];
            return journeyDate === selectedDateFormatted;
          });

          if (filteredJourneys.length === 0) {
            if (this.activeTab === 'return') {
              await this.fetchExtendedTimeframeJourney(fromCoords, toCoords, dateTimeFormat, dateTimeRepresents);
              return;
            }

            this.noResult = true;
            this.journeys = [];
            return;
          }

          this.journeys = data.journeys.slice(0, 3);
          this.noResult = false;
          this.selectedRouteJourney = this.journeys[0];

          if (this.activeTab === 'outbound') {
            this.calculateReturnParameters();
            await this.determineReturnWaypoint();
          }
        } else {
          if (this.activeTab === 'return') {
            await this.fetchExtendedTimeframeJourney(fromCoords, toCoords, dateTimeFormat, dateTimeRepresents);
            return;
          }

          this.noResult = true;
          this.journeys = [];
        }
      } catch (error) {
        console.error('Error retrieving routes:', error);

        if (this.activeTab === 'return') {
          await this.fetchExtendedTimeframeJourney(fromCoords, toCoords, dateTimeFormat, dateTimeRepresents);
          return;
        }

        this.noResult = true;
        this.journeys = [];
      } finally {
        this.isUpdating = false;
      }
    },

    async fetchExtendedTimeframeJourney(fromCoords, toCoords, dateTimeFormat, dateTimeRepresents) {
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
          {
            walking_speed: 1.12,
            max_walking_duration_to_pt: 4464,
            min_nb_journeys: 3,
            max_nb_transfers: this.maxTransfers,
            timeframe_duration: 86400,
          }
        );

        const data = response.data;
        const selectedDateFormatted = this.selectedDate.replace(/-/g, '');

        if (data.journeys && data.journeys.length > 0) {
          const filteredJourneys = data.journeys.filter((journey) => {
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
            );

            this.journeys = [bestLastJourney];
            this.noResult = true;
            this.selectedRouteJourney = bestLastJourney;
            this.showTimeButton = true;

            this.$emit('calculate-route', {
              from: {
                address: this.activeTab === 'outbound' ? this.fromAddress : this.selectedWaypoint?.title,
                coordinates: this.activeTab === 'outbound' ? this.fromCoordinates : this.selectedWaypoint?.coordinates,
              },
              to: {
                address: this.activeTab === 'outbound' ? this.selectedWaypoint?.title : this.fromAddress,
                coordinates: this.activeTab === 'outbound' ? this.selectedWaypoint?.coordinates : this.fromCoordinates,
              },
              date: this.selectedDate,
              time: this.selectedTime,
              preference: this.timePreference,
              journeys: this.journeys,
              isExtendedTimeframe: true,
            });

            return;
          }
        }

        this.noResult = true;
        this.journeys = [];
      } catch (error) {
        console.error('Error retrieving extended timeframe routes:', error);
        this.noResult = true;
        this.journeys = [];
      }
    },

    /** Format time for displaying : YYYYMMDDTHHMMSS -> HH:MM */
    formatTime(dateTimeString) {
      if (!dateTimeString) return '';
      return dateTimeString.substring(9, 11) + ':' + dateTimeString.substring(11, 13);
    },

    /** Format duration for displaying : h / min */
    formatDuration(seconds) {
      if (!seconds && seconds !== 0) return '';
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);

      if (hours > 0) {
        return `${hours} h ${minutes > 0 ? minutes + ' min' : ''}`;
      }
      return `${minutes} min`;
    },

    /** Gets icons according to the nature of the transport */
    getTransportIcon(section) {
      if (!section.display_informations) return '';

      const mode = section.display_informations.commercial_mode?.toLowerCase() || '';
      if (mode.includes('bus')) return 'bus';
      if (mode.includes('tram')) return 'tram';
      if (mode.includes('métro') || mode.includes('metro')) return 'tram';
      if (mode.includes('train')) return 'train';
      if (mode.includes('car')) return 'bus';

      return 'bus';
    },

    /** Manage different spellings of transports */
    getTransportClass(section) {
      if (!section.display_informations) return '';

      const mode = section.display_informations.commercial_mode?.toLowerCase() || '';

      if (mode.includes('bus')) return 'bus';
      if (mode.includes('tram')) return 'tram';
      if (mode.includes('métro') || mode.includes('metro')) return 'tram';
      if (mode.includes('train')) return 'train';
      if (mode.includes('car')) return 'bus';

      return 'bus';
    },

    /** Get the selected access waypoint on the map */
    handleWaypointClicked(document) {
      const waypoint = this.accessWaypoints.find((w) => w.id === document.document_id);
      if (waypoint) {
        this.selectedWaypoint = waypoint;
      }
    },

    /** Method to calculate distance in meters */
    getDistance(section) {
      if (section.distance) {
        return Math.round(section.distance);
      }
      return section.path && section.path.length > 0
        ? Math.round(section.path.reduce((acc, step) => acc + (step.length || 0), 0))
        : 0;
    },

    /** Method to get accessibility icons */
    hasAccessibility(section) {
      if (!section.display_informations || !section.display_informations.equipments) {
        return {
          bike: false,
          wheelchair: false,
        };
      }

      return {
        bike: section.display_informations.equipments.includes('has_bike_accepted'),
        wheelchair: section.display_informations.equipments.includes('has_wheelchair'),
      };
    },

    /** Displays the routes of different transport on the map */
    prepareRouteDocuments() {
      if (!this.selectedRouteJourney || !this.journeys || this.journeys.length === 0) return [];

      const routeDocuments = [];
      const journey = this.selectedRouteJourney;

      journey.sections.forEach((section, index) => {
        if (section.geojson) {
          const isWalkingSection =
            section.type === 'street_network' || section.type === 'transfer' || section.mode === 'walking';

          const routeDocument = {
            document_id: `route-section-${index}`,
            type: 'r',
            geometry: {
              version: 1,
              geom: JSON.stringify({
                type: 'Point',
                coordinates: section.geojson.coordinates[0],
              }),
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
              color: this.getRouteColor(section),
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

      this.$nextTick(() => {
        if (this.$refs.mapView) {
          this.$refs.mapView.recenterOnDocuments();
        }
      });

      return routeDocuments;
    },

    /** Each route follows the same sequence of colors */
    getRouteColor(section) {
      if (section.mode === 'walking') return '00008B';
      if (section.type === 'public_transport' || section.type === 'on_demand_transport') {
        const color = section.display_informations?.color;
        return color === 'FFFFFF' ? '808080' : color || '808080';
      }
      return '808080';
    },

    /** Shows route details */
    showJourneyDetails(journey) {
      this.selectedRouteJourney = journey;

      if (this.selectedJourney === journey) {
        this.selectedJourney = null;
      } else {
        this.selectedJourney = journey;
      }
    },

    /** Retrieves the route position in the list */
    getTransportSectionIndex(currentSection) {
      if (!this.selectedRouteJourney) return 0;

      let index = 0;
      for (const section of this.selectedRouteJourney.sections) {
        if (section === currentSection) {
          return index;
        }
        if (section.type === 'public_transport') {
          index++;
        }
      }
      return 0;
    },

    /** Creates the class based on color */
    getTransportColorClass(section) {
      if (section.display_informations?.color) {
        return 'transport-color-' + section.display_informations.color.replace('#', '');
      }
      return 'transport-color-default';
    },

    /** Leaves earlier button */
    departEarlier() {
      const [hours, minutes] = this.selectedTime.split(':').map(Number);
      let newHours = hours - 1;
      let newDate = this.selectedDate;

      if (newHours < 0) {
        newHours = 23;
        const currentDate = new Date(this.selectedDate);
        currentDate.setDate(currentDate.getDate() - 1);
        newDate = currentDate.toISOString().slice(0, 10);
      }

      this.selectedTime = `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      this.selectedDate = newDate;

      this.calculateRoute();
    },

    /** Leaves later button */
    departLater() {
      const [hours, minutes] = this.selectedTime.split(':').map(Number);
      let newHours = hours + 1;
      let newDate = this.selectedDate;

      if (newHours > 23) {
        newHours = 0;
        const currentDate = new Date(this.selectedDate);
        currentDate.setDate(currentDate.getDate() + 1);
        newDate = currentDate.toISOString().slice(0, 10);
      }

      this.selectedTime = `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      this.selectedDate = newDate;

      this.calculateRoute();
    },

    /** Next day button */
    nextDay() {
      const currentDate = new Date(this.selectedDate);
      currentDate.setDate(currentDate.getDate() + 1);
      this.selectedDate = currentDate.toISOString().slice(0, 10);

      this.calculateRoute();
    },

    /** Selects a route without opening details */
    selectRouteOnly(journey) {
      this.selectedRouteJourney = journey;
    },

    /** Formats the journey time in minutes and hours */
    formatJourneyDuration(seconds) {
      if (!seconds && seconds !== 0) return '';

      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);

      if (hours > 0) {
        return `${hours}h${minutes.toString().padStart(2, '0')}`;
      }
      return `${minutes} min`;
    },

    /** Switch from the outbound tab to the return tab */
    switchTab(tab) {
      if (tab === 'return' && !this.canAccessReturnTab) {
        return;
      }
      this.activeTab = tab;

      if (tab === 'return' && !this.returnData.fromAddress && this.outboundData.selectedWaypoint) {
        this.returnData.selectedWaypoint = this.outboundData.selectedWaypoint;

        if (this.outboundData.fromAddress && this.outboundData.fromCoordinates) {
          this.returnData.fromAddress = this.outboundData.fromAddress;
          this.returnData.fromCoordinates = this.outboundData.fromCoordinates;
        }
      }
    },

    /** Calculation of return fields, according to the available or calculated duration */
    calculateReturnParameters() {
      if (!this.outboundData.journeys || this.outboundData.journeys.length === 0) {
        return;
      }

      const outboundJourney = this.outboundData.journeys[0];
      const arrivalTime = outboundJourney.arrival_date_time;

      // Recovery of the theoretical duration or the duration entered
      const theoreticalDuration = this.document.calculated_duration; // in days (float)
      const itineraryDuration = this.document.durations?.length ? Math.min(...this.document.durations) : null; // in days (integer)

      // Case 1: Duration <= 1 day with valid theoretical duration
      if (theoreticalDuration && theoreticalDuration <= 1 && itineraryDuration && itineraryDuration <= 1) {
        const returnDate = this.outboundData.selectedDate;

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
          this.showReturnWarning = true;
        }

        this.returnData.selectedDate = returnDate;
        this.returnData.selectedTime = `${returnHour.toString().padStart(2, '0')}:${returnMinute
          .toString()
          .padStart(2, '0')}`;
      }
      // Case 3: Duration > 1 day
      else if (itineraryDuration && itineraryDuration > 1) {
        const outboundDate = new Date(this.outboundData.selectedDate);
        const daysToAdd = itineraryDuration ? Math.ceil(itineraryDuration) : Math.ceil(theoreticalDuration);
        outboundDate.setDate(outboundDate.getDate() + daysToAdd);

        this.returnData.selectedDate = outboundDate.toISOString().slice(0, 10);
        this.returnData.selectedTime = '17:00';
      }
      // Case 4: Other cases (theoretical duration not available or inconsistent)
      else {
        this.returnData.selectedDate = this.outboundData.selectedDate;
        this.returnData.selectedTime = '17:00';
        this.showReturnWarning = true;
      }
    },

    /** Loads waypoints that are accessible by public transport */
    async loadReachableWaypoints() {
      this.loadingReachable = true;
      this.reachableWaypoints = [];

      const waypoints = this.document.associations.waypoints || [];
      const reachableChecks = [];

      // Check the accessibility of each waypoint
      for (const waypoint of waypoints) {
        if (waypoint.type === 'w' && waypoint.waypoint_type === 'access') {
          reachableChecks.push(
            transportService.isReachable(waypoint.document_id).then((isReachable) => ({ waypoint, isReachable }))
          );
        }
      }

      const results = await Promise.all(reachableChecks);

      // Filter served waypoints
      for (const result of results) {
        if (result.isReachable) {
          const locale =
            result.waypoint.locales.find((l) => l.lang === this.$language.current) || result.waypoint.locales[0];
          const geom = JSON.parse(result.waypoint.geometry.geom);
          this.reachableWaypoints.push({
            id: result.waypoint.document_id,
            title: locale.title,
            coordinates: transform(geom.coordinates, 'EPSG:3857', 'EPSG:4326'),
          });
        }
      }

      this.loadingReachable = false;
    },

    /** Method to determine the return waypoint automatically */
    async determineReturnWaypoint() {
      if (!this.outboundData.journeys || this.outboundData.journeys.length === 0) {
        return;
      }

      // Case 1: No waypoint served
      if (this.reachableWaypoints.length === 0) {
        this.returnData.selectedWaypoint = null;
        return;
      }

      // Case 2: Only one waypoint served (loop route)
      if (this.reachableWaypoints.length === 1) {
        this.returnData.selectedWaypoint = this.reachableWaypoints[0];
        return;
      }

      // Case 3: Two waypoints served (crossing)
      if (this.reachableWaypoints.length === 2) {
        const outboundWaypointId = this.outboundData.selectedWaypoint?.id;
        const returnWaypoint = this.reachableWaypoints.find((w) => w.id !== outboundWaypointId);

        this.returnData.selectedWaypoint = returnWaypoint || this.reachableWaypoints[1];
        return;
      }

      // Case 4: More than two waypoints served - let the user choose
      if (this.reachableWaypoints.length > 2) {
        this.returnData.selectedWaypoint = null; // Reset to force manual selection
        return;
      }

      // Case 5: Some waypoints not served - take the outward one if it is served
      if (this.outboundData.selectedWaypoint) {
        const isCurrentReachable = this.reachableWaypoints.some((w) => w.id === this.outboundData.selectedWaypoint.id);
        if (isCurrentReachable) {
          this.returnData.selectedWaypoint = this.outboundData.selectedWaypoint;
        } else {
          this.returnData.selectedWaypoint = null;
        }
      }
    },

    /** If the user is authenticated and has entered their address in their profile, it is put in the address field */
    async loadUserAddressIfLoggedIn() {
      if (!this.$user.isLogged) {
        return;
      }

      try {
        const profileResponse = await c2c.userProfile.getProfile(this.$user.id);
        const profileData = profileResponse.data;

        if (profileData.geometry && profileData.geometry.geom) {
          const geomData = JSON.parse(profileData.geometry.geom);

          if (geomData.type === 'Point' && geomData.coordinates) {
            const [x, y] = geomData.coordinates;
            const [lon, lat] = ol.proj.transform([x, y], 'EPSG:3857', 'EPSG:4326');
            this.fromCoordinates = [lon, lat];

            await this.reverseGeocodeUserLocation(lon, lat);
          }
        }
      } catch (error) {
        console.error('Error loading user location:', error);
      }
    },

    /** Transforms a point's coordinates (longitude and latitude) into an address with photon */
    async reverseGeocodeUserLocation(lon, lat) {
      try {
        const response = await fetch(
          `https://photon.komoot.io/reverse?lon=${lon}&lat=${lat}&lang=${this.$language.current}`
        );
        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const location = data.features[0];
          this.fromAddress = this.formatProposition(location);
          this.selectedAddress = location;
        } else {
          this.fromAddress = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        }
      } catch (error) {
        console.error('Error during reverse geolocation:', error);
        this.fromAddress = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      }
    },

    /** Displays the duration of the route in days or hours depending on the source */
    formatDurationForDisplay() {
      if (this.document.durations.length === 1 && this.document.durations[0] === '10+') {
        return '10+ ' + this.$gettext('Day(s)').toLowerCase();
      }
      // Priority to the calculated duration if the minimum duration is exactly 1 day
      const shouldUseCalculated =
        this.document.durations?.length &&
        Math.min(...this.document.durations) === 1 &&
        this.document.calculated_duration;

      const durationInDays = shouldUseCalculated
        ? this.document.calculated_duration
        : this.document.durations?.length
        ? Math.min(...this.document.durations)
        : this.document.calculated_duration;

      if (durationInDays < 1) {
        const hours = durationInDays * 24;
        const hoursInt = Math.floor(hours);
        const minutes = Math.round((hours - hoursInt) * 60);
        return `${hoursInt}h${minutes.toString().padStart(2, '0')}`;
      }

      if (durationInDays === 1) {
        return `1 ${this.$gettext('Day(s)').toLowerCase()}`;
      }

      return `${durationInDays} ${this.$gettext('Day(s)').toLowerCase()}`;
    },

    /** Convert times into calculable format and substract departure to arrival */
    calculateSectionDuration(section) {
      if (section.departure_date_time && section.arrival_date_time) {
        const departure = section.departure_date_time;
        const arrival = section.arrival_date_time;

        const depHour = parseInt(departure.substring(9, 11));
        const depMin = parseInt(departure.substring(11, 13));
        const depSec = parseInt(departure.substring(13, 15));

        const arrHour = parseInt(arrival.substring(9, 11));
        const arrMin = parseInt(arrival.substring(11, 13));
        const arrSec = parseInt(arrival.substring(13, 15));

        const depTotalSec = depHour * 3600 + depMin * 60 + depSec;
        const arrTotalSec = arrHour * 3600 + arrMin * 60 + arrSec;

        return arrTotalSec - depTotalSec;
      }
      return 0;
    },

    myFunction() {
      this.limitTransfers = !this.limitTransfers;
    },
  },
};
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

        .plan-trip-from-to {
          display: flex;
          width: 100%;
          margin-bottom: 18px;

          .from-to-container {
            width: 80%;
            position: relative;
            .from-container,
            .from-container-return {
              display: flex;
              border: 1px solid lightgray;
              padding: 5px;
              border-radius: 4px;
              margin-bottom: 15px;
              .from-text {
                padding-left: 5px;
                width: 32px;
                border-right: 1px solid lightgray;
                font-weight: 600;
              }
              .autocomplete-container {
                width: 100%;
                position: relative;
                .from-address {
                  padding-left: 10px;
                  border: none;
                  outline: none;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                  overflow: hidden;
                  width: inherit;
                }
                .autocomplete-results {
                  position: absolute;
                  background-color: white;
                  border: 1px solid lightgrey;
                  z-index: 2;
                  margin-top: 5px;
                  ul {
                    li {
                      padding: 6px;
                      border-bottom: 1px solid lightgrey;
                    }
                  }
                }
              }
              .geolocalisation {
                border-radius: 15px;
                border: 1px solid lightgray;
                background-color: white;
                height: 25px;
                position: absolute;
                width: 29px;
                right: 0;
                margin-right: 5px;
                top: 4px;
                .geolocalisation-img {
                  height: 18px;
                  width: 18px;
                  display: flex;
                }
              }
              .geolocalisation-return {
                top: 52px;
              }
            }
            .from-container-return {
              margin-bottom: 0px;
            }

            .to-container,
            .to-container-return {
              display: flex;
              border: 1px solid lightgray;
              padding: 5px;
              border-radius: 4px;
              .to-text {
                width: 30px;
                padding-left: 5px;
                border-right: 1px solid lightgray;
                font-weight: 600;
              }
              .to-address {
                padding-left: 9px;
                color: black;
              }
              .chose-waypoint {
                border: none;
                margin-left: 10px;
                width: 100%;
                background-color: white;
              }
            }
            .to-container-return {
              margin-bottom: 15px;
            }
          }
        }

        .select-date-container {
          display: flex;
          gap: 15px;
          .date-picker-container {
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
                width: 20px;
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

              .calendar-icon {
                display: flex;
                align-items: center;
                padding-right: 10px;
                color: #666;
                pointer-events: none;
              }
            }
          }
          .hour-picker-container {
            width: 107px;
          }
        }

        // Bouton "Voir le détail"
        .itinerary-details-button {
          text-align: left;

          button {
            background-color: transparent;
            color: #3273dc;
            border: none;
            padding: 0;
            font-size: 14px;
            cursor: pointer;
            text-decoration: underline;

            &:hover {
              color: #2366d1;
            }
          }
        }

        // Détails du trajet
        .journey-details {
          font-family: Arial, sans-serif;
          max-width: 650px;
          margin: 0 auto;
          padding: 15px;
          border-bottom-left-radius: 6px;
          border-bottom-right-radius: 6px;
          border: solid 1px lightgray;
          border-top: none;
          background-color: #fff;

          .journey-timeline {
            position: relative;

            .timeline-item {
              display: flex;
              align-items: center;
              position: relative;

              &.transport-color-default {
                border-left-color: gray;
              }

              &.walking {
                border-left: 3px dotted #0000ff;
                margin-left: 52px;
                padding-top: 10px;
                padding-bottom: 10px;
              }

              &.transport {
                padding-left: 22px;
                margin-left: 52px;
                padding-top: 10px;
                padding-bottom: 10px;
              }
            }

            .timeline-time {
              width: 60px;
              font-weight: bold;
              font-size: 14px;
              padding-top: 2px;
            }

            .timeline-icon,
            .timeline-icon-beginning,
            .timeline-icon-end {
              position: relative;
              z-index: 2;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background-color: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 15px 0 -45px;

              &.stop {
                background-color: #fff;
                width: 15px;
                height: 15px;
                border: 2px solid grey;
                margin-left: -14px;
              }

              &.walking {
                border: none;
                background: none;

                img {
                  width: 20px;
                  height: 20px;
                }
              }

              &.transport {
                border: none;
                color: #fff;
                width: 32px;
                height: 32px;
              }

              i {
                display: inline-block;
                width: 12px;
                height: 12px;
              }
            }

            .timeline-icon-beginning,
            .timeline-icon-end {
              margin: 0 15px 0 -22px;
            }

            .timeline-content {
              flex: 1;
              padding-top: 2px;

              .timeline-address {
                font-size: 15px;
                margin-left: -8px;
                font-weight: bold;
              }

              .timeline-walking-info {
                font-size: 14px;
                color: #757575;
                display: flex;
                align-items: center;
                margin-left: -14px;
              }

              .timeline-stop-name {
                font-size: 15px;
              }

              .timeline-line {
                font-size: 14px;
                .on-demand-text {
                  background-color: rgba(255, 165, 0, 0.5);
                  font-style: italic;
                }
              }

              .timeline-direction {
                font-size: 14px;
                margin-top: 2px;
              }

              .timeline-accessibility {
                display: flex;
                margin-top: 5px;

                img {
                  width: 20px;
                  height: 20px;
                  margin-right: 8px;
                }
              }
            }
          }
        }

        .timeline-item:last-child {
          .timeline-icon {
            border: none;
            background: none;
          }
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

      .chose-transfer-limit {
        display: flex;
        position: relative;
        width: fit-content;
        .chose-if-transfer-wanted {
          display: flex;
          align-items: center;
          gap: 10px;

          .toggle-label {
            line-height: normal;
          }
        }

        .toggle {
          position: relative;
          display: inline-block;
          width: 30px;
          height: 17px;

          input {
            display: none;
          }
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #333;
          transition: 0.4s;
          border-radius: 34px;
        }

        .slider:before {
          position: absolute;
          content: '';
          height: 13px;
          width: 13px;
          left: 2px;
          bottom: 2px;
          background-color: #fff;
          transition: 0.4s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background-color: #337ab7;
        }

        input:checked + .slider:before {
          transform: translateX(13px);
        }

        .chose-nb-transfer {
          margin-left: 14px;
          position: absolute;
          right: -108px;
          top: -2px;
          display: flex;
          gap: 4px;
          align-items: center;

          .number-dd {
            padding: 3px;
            text-align: center;
            border-radius: 4px;
          }
        }
      }

      @media only screen and (max-width: 1650px) {
        .chose-transfer-limit {
          display: block;
          .chose-nb-transfer {
            position: initial;
            margin-top: 10px;
          }
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
      width: 319px !important;
      margin-left: auto;
      margin-right: auto;
    }
  }
}
.is-firefox .calendar-icon {
  display: none !important;
}
</style>
