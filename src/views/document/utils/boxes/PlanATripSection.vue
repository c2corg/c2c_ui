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
        <h3 class="plan-trip-title">{{ $gettext('Plan a public transport trip') }}</h3>

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
                    <img class="geolocalisation-img" src="@/assets/img/boxes/geoloc.svg" />
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
                    <div class="no-waypoint" v-else>{{ $gettext('No access points available') }}</div>
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
                    <img class="geolocalisation-img" src="@/assets/img/boxes/geoloc.svg" />
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
                  <img class="geolocalisation-img" src="@/assets/img/boxes/date.svg" />
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
                <div class="calendar-icon">
                  <img class="" src="@/assets/img/boxes/time.svg" />
                </div>
              </div>
            </div>
          </div>

          <div v-if="nonValidAddress" class="non-valid-address">
            {{ $gettext('Please select a departure and a destination.') }}
          </div>

          <button class="button is-primary plan-trip-search-button" @click="calculateRoute">
            <img class="" src="@/assets/img/boxes/itineraire.svg" />
            <p class="plan-trip-search-button-text">{{ $gettext('Calculate my outbound trip') }}</p>
          </button>

          <div class="calculated-duration" v-if="calculatedDuration && activeTab === 'return'">
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
              <img class="no-itineraries-img" src="@/assets/img/boxes/transport_not_found.svg" />
              <div class="no-itineraries-text">
                <div class="no-itineraries-found">{{ $gettext('No public transport found') }}</div>
                <div class="no-itineraries-detail">
                  {{ $gettext("It seems your trip can't be completed on the selected date and and time") }}
                </div>
              </div>
            </div>
          </div>

          <div class="itineraries-container" :class="{ updating: isUpdating }" v-if="journeys.length > 0">
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
                    {{ $gettext('View details') }}
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
                      <div class="timeline-address">{{ fromAddress }}</div>
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
                      <div class="timeline-item transport" :class="getTransportColorClass(section)">
                        <div class="timeline-content">
                          <div class="timeline-line">
                            <strong>{{ $gettext('Line') }} : </strong> {{ section.display_informations?.code || '' }}
                          </div>
                          <div class="timeline-direction">
                            <strong>{{ $gettext('Direction') }} : </strong
                            >{{ section.display_informations?.direction || '' }}
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
                      <div class="timeline-address">{{ fromAddress }}</div>
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
        :documents="mapDocuments.concat([document])"
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
import api from '@/js/apis/c2c';
import c2c from '@/js/apis/c2c';
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
      // Nouvelles propriétés pour les onglets
      activeTab: 'outbound',

      // Données pour l'aller (renommer les propriétés existantes)
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
        nonValidAddress: false,
      },

      // Données pour le retour
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
        nonValidAddress: false,
      },

      userService: new UserProfileService(api),
      showReturnWarning: false,
      calculatedDuration: this.document.calculated_duration,
      transportColors: ['pink', 'orange', 'royalblue', 'purple', 'green', 'yellow', 'gray', 'salmon', 'teal', 'brown'],
      reachableWaypoints: [],
      loadingReachable: false,
    };
  },
  async mounted() {
    await this.loadUserAddressIfLoggedIn();
  },
  computed: {
    accessWaypoints() {
      return this.reachableWaypoints.length > 0 ? this.reachableWaypoints : [];
    },
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
          locales: [{ title: waypoint.title, lang: this.$language.current }],
        };
      });

      const routeDocuments = this.prepareRouteDocuments();

      return [...baseDocuments, ...accessWaypointDocuments, ...routeDocuments];
    },
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

    nonValidAddress: {
      get() {
        return this.currentData.nonValidAddress;
      },
      set(value) {
        this.currentData.nonValidAddress = value;
      },
    },

    // Adapter le titre du bouton selon l'onglet
    calculateButtonText() {
      return this.activeTab === 'outbound'
        ? this.$gettext('Calculer mon trajet aller')
        : this.$gettext('Calculer mon trajet retour');
    },

    // Adapter les libellés selon l'onglet
    fromLabel() {
      return this.activeTab === 'outbound' ? 'De' : 'De';
    },

    toLabel() {
      return this.activeTab === 'outbound' ? 'À' : 'À';
    },

    fromPlaceholder() {
      return this.activeTab === 'outbound' ? 'Entrez une adresse de départ' : 'Entrez une adresse de départ (retour)';
    },
    canAccessReturnTab() {
      return this.outboundData.journeys.length > 0;
    },
  },

  async created() {
    // Charger les waypoints desservis au montage du composant
    await this.loadReachableWaypoints();

    // Si un seul waypoint desservi, le sélectionner automatiquement
    if (this.reachableWaypoints.length === 1) {
      this.selectedWaypoint = this.reachableWaypoints[0];
    }
  },

  methods: {
    /** Address auto-complete */
    async searchAddressPropositions() {
      if (this.fromAddress?.length >= 3) {
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
      } else {
        this.showAddressPropositions = false;
        this.addressPropositions = [];
      }
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

    async calculateRoute() {
      if (
        !this.selectedWaypoint ||
        (this.activeTab === 'outbound' && !this.fromCoordinates) ||
        (this.activeTab === 'return' && !this.fromAddress)
      ) {
        this.nonValidAddress = true;
        return;
      }

      this.nonValidAddress = false;

      // Logique inversée pour le retour
      let fromCoords, toCoords, fromAddressDisplay, toAddressDisplay;

      if (this.activeTab === 'outbound') {
        // ALLER : De l'adresse vers le waypoint
        fromCoords = NavitiaService.formatCoordinates(this.fromCoordinates);
        toCoords = NavitiaService.formatCoordinates(this.selectedWaypoint.coordinates);
        fromAddressDisplay = this.fromAddress;
        toAddressDisplay = this.selectedWaypoint.title;
      } else {
        // RETOUR : Du waypoint vers l'adresse
        fromCoords = NavitiaService.formatCoordinates(this.selectedWaypoint.coordinates);
        toCoords = NavitiaService.formatCoordinates(this.fromCoordinates);
        fromAddressDisplay = this.selectedWaypoint.title;
        toAddressDisplay = this.fromAddress;
      }

      this.isUpdating = true;

      const animationTimeout = setTimeout(() => {
        this.isUpdating = false;
      }, 600);

      // Format datetime for Navitia API
      const dateTimeFormat = this.selectedDate.replace(/-/g, '') + 'T' + this.selectedTime.replace(':', '') + '00';
      const dateTimeRepresents = this.timePreference === 'arrive-before' ? 'arrival' : 'departure';

      try {
        const response = await NavitiaService.getJourneys({
          from: fromCoords,
          to: toCoords,
          datetime: dateTimeFormat,
          datetime_represents: dateTimeRepresents,
        });

        console.log(
          `Calling Navitia: from=${fromCoords}&to=${toCoords}&datetime=${dateTimeFormat}&datetime_represents=${dateTimeRepresents}`
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

          this.$emit('calculate-route', {
            from: {
              address: fromAddressDisplay,
              coordinates: this.activeTab === 'outbound' ? this.fromCoordinates : this.selectedWaypoint.coordinates,
            },
            to: {
              address: toAddressDisplay,
              coordinates: this.activeTab === 'outbound' ? this.selectedWaypoint.coordinates : this.fromCoordinates,
            },
            date: this.selectedDate,
            time: this.selectedTime,
            preference: this.timePreference,
            journeys: this.journeys,
          });
        } else {
          this.noResult = true;
          this.journeys = [];
        }
      } catch (error) {
        console.error('Error retrieving routes:', error);
        this.noResult = true;
        this.journeys = [];

        // Optionnel : gérer différents types d'erreurs
        if (error.response?.status === 400) {
          console.error('Paramètres invalides pour Navitia');
        } else if (error.response?.status === 500) {
          console.error("Erreur serveur lors de l'appel Navitia");
        }
      } finally {
        clearTimeout(animationTimeout);
        this.isUpdating = false;
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
      if (mode.includes('métro') || mode.includes('metro')) return 'Metro';
      if (mode.includes('train')) return 'train';
      if (mode.includes('car')) return 'car';

      return section.display_informations.code || '';
    },

    /** Manage different spellings of transports */
    getTransportClass(section) {
      if (!section.display_informations) return '';

      const mode = section.display_informations.commercial_mode?.toLowerCase() || '';

      if (mode.includes('bus')) return 'bus';
      if (mode.includes('tram')) return 'tram';
      if (mode.includes('métro') || mode.includes('metro')) return 'metro';
      if (mode.includes('train')) return 'train';
      if (mode.includes('car')) return 'car';

      return 'default-transport';
    },

    /** Get the selected access waypoint on the map */
    handleWaypointClicked(document) {
      const waypoint = this.accessWaypoints.find((w) => w.id === document.document_id);
      if (waypoint) {
        this.selectedWaypoint = waypoint;
      }
    },
    // Method for calculating distance in meters
    getDistance(section) {
      if (section.distance) {
        return Math.round(section.distance);
      }
      return section.path && section.path.length > 0
        ? Math.round(section.path.reduce((acc, step) => acc + (step.length || 0), 0))
        : 0;
    },

    // Method to get accessibility icons
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

    prepareRouteDocuments() {
      if (!this.selectedRouteJourney || !this.journeys || this.journeys.length === 0) return [];

      const routeDocuments = [];
      const journey = this.selectedRouteJourney;
      console.log(journey);

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

    getRouteColor(section) {
      if (section.mode === 'walking') return 'blue';
      if (section.type === 'public_transport' || section.type === 'on_demand_transport') {
        const colorIndex = this.getTransportSectionIndex(section);
        return this.transportColors[colorIndex % this.transportColors.length];
      }
      return 'gray';
    },

    showJourneyDetails(journey) {
      this.selectedRouteJourney = journey;

      if (this.selectedJourney === journey) {
        this.selectedJourney = null;
      } else {
        this.selectedJourney = journey;
      }
    },

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

    getTransportColorClass(section) {
      return 'transport-color-' + (this.getTransportSectionIndex(section) % this.transportColors.length);
    },

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

    nextDay() {
      const currentDate = new Date(this.selectedDate);
      currentDate.setDate(currentDate.getDate() + 1);
      this.selectedDate = currentDate.toISOString().slice(0, 10);

      this.calculateRoute();
    },

    selectRouteOnly(journey) {
      this.selectedRouteJourney = journey;
    },
    formatJourneyDuration(seconds) {
      if (!seconds && seconds !== 0) return '';

      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);

      if (hours > 0) {
        return `${hours}h${minutes.toString().padStart(2, '0')}`;
      }
      return `${minutes} min`;
    },

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

    calculateReturnParameters() {
      if (!this.outboundData.journeys || this.outboundData.journeys.length === 0) {
        return;
      }

      const outboundJourney = this.outboundData.journeys[0];
      const arrivalTime = outboundJourney.arrival_date_time;

      // Récupération de la durée théorique ou de la durée renseignée
      const theoreticalDuration = this.document.calculated_duration; // en jours (float)
      const itineraryDuration = this.document.duration?.length ? Math.min(...this.document.duration) : null; // en jours (entier)

      // Cas 1: Durée <= 1 jour avec durée théorique valide
      if ((theoreticalDuration <= 1 || (itineraryDuration && itineraryDuration <= 1)) && theoreticalDuration) {
        const returnDate = this.outboundData.selectedDate;

        // Calcul de l'heure de retour (heure d'arrivée + durée théorique)
        const arrivalHour = parseInt(arrivalTime.substring(9, 11));
        const arrivalMinute = parseInt(arrivalTime.substring(11, 13));

        const additionalHours = Math.floor(theoreticalDuration * 24);
        const additionalMinutes = Math.round((theoreticalDuration * 24 - additionalHours) * 60);

        let returnHour = arrivalHour + additionalHours;
        let returnMinute = arrivalMinute + additionalMinutes;

        // Gestion des minutes > 60
        if (returnMinute >= 60) {
          returnHour += Math.floor(returnMinute / 60);
          returnMinute = returnMinute % 60;
        }

        // Gestion des heures > 24
        if (returnHour >= 24) {
          // Cas 2: Retour impossible le jour même
          returnHour = 17;
          returnMinute = 0;
          this.showReturnWarning = true;
        }

        this.returnData.selectedDate = returnDate;
        this.returnData.selectedTime = `${returnHour.toString().padStart(2, '0')}:${returnMinute
          .toString()
          .padStart(2, '0')}`;
      }
      // Cas 3: Durée > 1 jour
      else if (theoreticalDuration > 1 || (itineraryDuration && itineraryDuration > 1)) {
        const outboundDate = new Date(this.outboundData.selectedDate);
        const daysToAdd = itineraryDuration ? Math.ceil(itineraryDuration) : Math.ceil(theoreticalDuration);
        outboundDate.setDate(outboundDate.getDate() + daysToAdd);

        this.returnData.selectedDate = outboundDate.toISOString().slice(0, 10);
        this.returnData.selectedTime = '17:00';
      }
      // Cas 4: Autres cas (durée théorique non disponible ou incohérente)
      else {
        this.returnData.selectedDate = this.outboundData.selectedDate;
        this.returnData.selectedTime = '17:00';
        this.showReturnWarning = true;
      }
    },

    async loadReachableWaypoints() {
      this.loadingReachable = true;
      this.reachableWaypoints = [];

      const waypoints = this.document.associations.waypoints || [];
      const reachableChecks = [];

      // Vérifier l'accessibilité de chaque waypoint
      for (const waypoint of waypoints) {
        if (waypoint.type === 'w' && waypoint.waypoint_type === 'access') {
          reachableChecks.push(
            transportService.isReachable(waypoint.document_id).then((isReachable) => ({ waypoint, isReachable }))
          );
        }
      }

      // Attendre toutes les vérifications
      const results = await Promise.all(reachableChecks);

      // Filtrer les waypoints desservis
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

    // Méthode pour déterminer le waypoint de retour automatiquement
    async determineReturnWaypoint() {
      if (!this.outboundData.journeys || this.outboundData.journeys.length === 0) {
        return;
      }

      // Cas 1: Un seul waypoint desservi
      if (this.reachableWaypoints.length === 1) {
        this.returnData.selectedWaypoint = this.reachableWaypoints[0];
        return;
      }

      // Cas 2: Deux waypoints desservis
      if (this.reachableWaypoints.length === 2) {
        // Si le waypoint d'arrivée de l'aller est le premier, prendre le deuxième
        if (this.outboundData.selectedWaypoint?.id === this.reachableWaypoints[0].id) {
          this.returnData.selectedWaypoint = this.reachableWaypoints[1];
        } else {
          this.returnData.selectedWaypoint = this.reachableWaypoints[0];
        }
        return;
      }

      // Cas 3: Plus de deux waypoints desservis - laisser l'utilisateur choisir
      // Cas 4: Certains waypoints non desservis - prendre celui de l'aller s'il est desservi
      if (this.outboundData.selectedWaypoint) {
        const isCurrentReachable = this.reachableWaypoints.some((w) => w.id === this.outboundData.selectedWaypoint.id);
        if (isCurrentReachable) {
          this.returnData.selectedWaypoint = this.outboundData.selectedWaypoint;
        }
      }
    },

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

    formatDurationForDisplay() {
      const durationInDays = this.document.durations?.length
        ? Math.min(...this.document.durations)
        : this.document.calculated_duration;

      if (durationInDays < 1) {
        const hours = durationInDays * 24;
        const hoursInt = Math.floor(hours);
        const minutes = Math.round((hours - hoursInt) * 60);
        return `${hoursInt}h${minutes.toString().padStart(2, '0')}`;
      }

      return `${durationInDays} ${this.$gettext('Day(s)').toLowerCase()}`;
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
                padding: 11px 11px;
                max-width: 76px;
                border: none;
                outline: none;
                font-size: 15px;
                color: #333;

                &::-webkit-calendar-picker-indicator {
                  opacity: 0;
                  position: absolute;
                  width: 100%;
                  height: 100%;
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

              &.transport-color-0 {
                border-left: 3px solid pink;
              }
              &.transport-color-1 {
                border-left: 3px solid orange;
              }
              &.transport-color-2 {
                border-left: 3px solid royalblue;
              }
              &.transport-color-3 {
                border-left: 3px solid purple;
              }
              &.transport-color-4 {
                border-left: 3px solid green;
              }
              &.transport-color-5 {
                border-left: 3px solid yellow;
              }
              &.transport-color-6 {
                border-left: 3px solid gray;
              }
              &.transport-color-7 {
                border-left: 3px solid salmon;
              }
              &.transport-color-8 {
                border-left: 3px solid teal;
              }
              &.transport-color-9 {
                border-left: 3px solid brown;
              }

              &.walking {
                border-left: 3px dotted lightgray;
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
                font-size: 15px;
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
        .plan-trip-search-button-img {
        }
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
        animation: fadeFlash 0.6s ease;
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
</style>
