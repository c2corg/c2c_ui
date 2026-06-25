<template>
  <div class="plan-trip-section">
    <div class="plan-trip-info">
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
          <plan-a-trip-form
            :active-tab="activeTab"
            :current-data="currentData"
            :access-waypoints="accessWaypoints"
            :loading-reachable="loadingReachable"
            :limit-transfers="limitTransfers"
            :max-transfers="maxTransfers"
            @update-from-address="handleUpdateFromAddress"
            @update-selected-waypoint="handleUpdateSelectedWaypoint"
            @update-selected-date="handleUpdateSelectedDate"
            @update-time-preference="handleUpdateTimePreference"
            @update-selected-time="handleUpdateSelectedTime"
            @update-limit-transfers="handleUpdateLimitTransfers"
            @update-max-transfers="handleUpdateMaxTransfers"
          />

          <button class="button is-primary plan-trip-search-button" @click="calculateRoute">
            <img class="" src="@/assets/img/boxes/itineraire.svg" alt="itinerary" />
            <p class="plan-trip-search-button-text" v-if="activeTab === 'outbound'">
              {{ hasReturnTrip ? $gettext('Calculate my outbound trip') : $gettext('Calculate my trip') }}
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

          <plan-a-trip-results
            :activeTab="activeTab"
            :currentData="currentData"
            :isUpdating="currentData.isUpdating"
            :noResult="currentData.noResult"
            :displayedFromAddress="displayedFromAddress"
            :displayedToAddress="displayedToAddress"
            @selectJourney="setSelectedRouteJourney"
          />

          <div
            class="no-itineraries-container"
            :class="{ updating: currentData.isUpdating }"
            v-if="currentData.noResult"
          >
            <div class="no-itineraries">
              <img
                class="no-itineraries-img"
                src="@/assets/img/boxes/transport_not_found.svg"
                alt="transport not found"
              />
              <div class="no-itineraries-text">
                <div class="no-itineraries-found">{{ $gettext('No public transport found') }}</div>
                <div class="no-itineraries-detail">
                  {{ noResultError }}
                </div>
              </div>
            </div>
          </div>

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

import PlanATripForm from './PlanATripForm.vue';
import PlanATripResults from './PlanATripResults.vue';

import start from '@/assets/img/boxes/geoloc-2.svg';
import { default as c2c } from '@/js/apis/c2c';
import UserProfileService from '@/js/apis/c2c/UserProfileService';
import NavitiaService from '@/js/apis/navitia-service';
import transportService from '@/js/apis/transport-service';
import ol from '@/js/libs/ol';
import planATripUtils from '@/js/plan-a-trip-utils';
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  name: 'PlanATripSection',
  mixins: [requireDocumentProperty],
  components: {
    PlanATripForm,
    PlanATripResults,
  },
  props: {
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
      },

      userService: new UserProfileService(c2c),
      displayedFromAddress: '',
      displayedToAddress: '',
      showReturnWarning: false,
      calculatedDuration: this.document.calculated_duration,
      reachableWaypoints: [],
      loadingReachable: false,
      searchTimeout: null,
      limitTransfers: false,
      maxTransfers: 0,
      queryError: null,
      errorMessages: {
        date_out_of_bounds: this.$gettext('Public transport schedules are not yet known for this period.'),
        unknown_object: this.$gettext(
          "The start and finish points are too far apart to find a route. Choose a start in a city closer to the route's access point."
        ),
      },
    };
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
    hasReturnTrip() {
      return this.documentType === 'route';
    },
    /** Determines if a waypoint is accessible by public transport */
    accessWaypoints() {
      return this.reachableWaypoints.length > 0 ? this.reachableWaypoints : [];
    },

    /** Customizes access points: clicking makes a selection instead of redirecting to a page, and the color is green */
    mapDocuments() {
      // This computed property depends on the selectedRouteJourney to ensure
      // route documents update when a journey is selected
      const selectedRouteJourney = this.currentData.selectedRouteJourney;

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

    noResultError() {
      if (this.currentData.noResult) {
        if (this.queryError !== null) {
          return (
            this.errorMessages[this.queryError?.id] ||
            this.$gettext('It seems your trip can not be completed on the selected date and time')
          );
        } else {
          return this.$gettext('It seems your trip can not be completed on the selected date and time');
        }
      } else {
        return '';
      }
    },

    canAccessReturnTab() {
      return this.outboundData.journeys.length > 0;
    },

    maxNbTransfers() {
      return this.limitTransfers ? this.maxTransfers : undefined;
    },
  },

  async mounted() {
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
      this.currentData.selectedWaypoint = this.reachableWaypoints[0];
    }
  },

  methods: {
    // have planATripUtils methods here so they can be used in template
    ...planATripUtils,
    handleUpdateFromAddress(address) {
      if (this.activeTab === 'outbound') {
        this.outboundData.fromAddress = address;
        this.outboundData.fromCoordinates = address?.geometry?.coordinates;
      } else {
        this.returnData.fromAddress = address;
        this.returnData.fromCoordinates = address?.geometry?.coordinates;
      }
    },
    handleUpdateSelectedWaypoint(waypoint) {
      this.currentData.selectedWaypoint = waypoint;
    },
    handleUpdateSelectedDate(date) {
      this.currentData.selectedDate = date;
    },
    handleUpdateTimePreference(preference) {
      this.currentData.timePreference = preference;
    },
    handleUpdateSelectedTime(time) {
      this.currentData.selectedTime = time;
    },
    handleUpdateLimitTransfers(limit) {
      this.limitTransfers = limit;
    },
    handleUpdateMaxTransfers(max) {
      this.maxTransfers = max;
    },
    setSelectedRouteJourney(journey) {
      this.currentData.selectedRouteJourney = journey;
    },
    /** Call Navitia and store the results */
    async calculateRoute() {
      this.queryError = null;
      this.currentData.missingDepartureAddress = false;
      this.currentData.missingDestinationAddress = false;

      if (
        (this.activeTab === 'outbound' && !this.currentData.fromAddress) ||
        (this.activeTab === 'return' && !this.currentData.selectedWaypoint)
      ) {
        this.currentData.missingDepartureAddress = true;
      }

      if (
        (this.activeTab === 'outbound' && !this.currentData.selectedWaypoint) ||
        (this.activeTab === 'return' && !this.currentData.fromAddress)
      ) {
        this.currentData.missingDestinationAddress = true;
      }

      if (this.currentData.missingDepartureAddress || this.currentData.missingDestinationAddress) {
        return;
      }
      let fromCoords, toCoords;

      if (this.activeTab === 'outbound') {
        // OUTBOUND: From address to waypoint
        fromCoords = NavitiaService.formatCoordinates(this.currentData.fromCoordinates);
        toCoords = NavitiaService.formatCoordinates(this.currentData.selectedWaypoint.coordinates);
        this.displayedFromAddress = this.currentData.fromAddress.address;
      } else {
        // RETURN: From waypoint to address
        fromCoords = NavitiaService.formatCoordinates(this.currentData.selectedWaypoint.coordinates);
        toCoords = NavitiaService.formatCoordinates(this.currentData.fromCoordinates);
        this.displayedToAddress = this.currentData.fromAddress.address;
      }

      this.currentData.isUpdating = true;

      // Format datetime for Navitia API minus 15 minutes
      const originalDateTime = new Date(`${this.currentData.selectedDate}T${this.currentData.selectedTime}:00`);
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
      const dateTimeRepresents = this.currentData.timePreference === 'arrive-before' ? 'arrival' : 'departure';

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
            max_nb_transfers: this.maxNbTransfers,
          }
        );

        const data = response.data;
        this.currentData.showTimeButton = true;
        const selectedDateFormatted = this.currentData.selectedDate.replace(/-/g, '');

        if (data.journeys) {
          const filteredJourneys = data.journeys.filter((journey) => {
            const journeyDate = journey.departure_date_time.split('T')[0];
            return journeyDate === selectedDateFormatted;
          });

          if (filteredJourneys.length === 0) {
            await this.fetchExtendedTimeframeJourney(fromCoords, toCoords, dateTimeFormat, dateTimeRepresents);
            return;
          }

          this.currentData.journeys = data.journeys.slice(0, 3);
          this.currentData.noResult = false;
          this.currentData.selectedRouteJourney = this.currentData.journeys[0];

          if (this.activeTab === 'outbound') {
            this.calculateReturnParameters();
            await this.determineReturnWaypoint();
          }
        } else {
          await this.fetchExtendedTimeframeJourney(fromCoords, toCoords, dateTimeFormat, dateTimeRepresents);
        }
      } catch (error) {
        this.queryError = NavitiaService.handleQueryError(error?.response?.data?.errors?.[0]?.description);
        console.error('Error retrieving routes:', error);
        await this.fetchExtendedTimeframeJourney(fromCoords, toCoords, dateTimeFormat, dateTimeRepresents);
      } finally {
        this.currentData.isUpdating = false;
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
            max_nb_transfers: this.maxNbTransfers,
            timeframe_duration: 86400,
          }
        );

        const data = response.data;
        const selectedDateFormatted = this.currentData.selectedDate.replace(/-/g, '');

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

            this.currentData.journeys = [bestLastJourney];
            this.currentData.noResult = true;
            this.currentData.selectedRouteJourney = bestLastJourney;
            if (this.activeTab === 'outbound') {
              this.calculateReturnParameters();
              await this.determineReturnWaypoint();
            }
            this.currentData.showTimeButton = true;

            this.$emit('calculate-route', {
              from: {
                address:
                  this.activeTab === 'outbound'
                    ? this.currentData.fromAddress
                    : this.currentData.selectedWaypoint?.title,
                coordinates:
                  this.activeTab === 'outbound'
                    ? this.currentData.fromCoordinates
                    : this.currentData.selectedWaypoint?.coordinates,
              },
              to: {
                address:
                  this.activeTab === 'outbound'
                    ? this.currentData.selectedWaypoint?.title
                    : this.currentData.fromAddress,
                coordinates:
                  this.activeTab === 'outbound'
                    ? this.currentData.selectedWaypoint?.coordinates
                    : this.currentData.fromCoordinates,
              },
              date: this.currentData.selectedDate,
              time: this.currentData.selectedTime,
              preference: this.currentData.timePreference,
              journeys: this.currentData.journeys,
              isExtendedTimeframe: true,
            });

            return;
          }
        }

        this.currentData.noResult = true;
        this.currentData.journeys = [];
      } catch (error) {
        this.queryError = NavitiaService.handleQueryError(error?.response?.data?.errors?.[0]?.description);
        console.error('Error retrieving extended timeframe routes:', error);
        this.currentData.noResult = true;
        this.currentData.journeys = [];
      }
    },

    /** Get the selected access waypoint on the map */
    handleWaypointClicked(document) {
      const waypoint = this.accessWaypoints.find((w) => w.id === document.document_id);
      if (waypoint) {
        this.currentData.selectedWaypoint = waypoint;
      }
    },

    /** Displays the routes of different transport on the map */
    prepareRouteDocuments() {
      if (
        !this.currentData.selectedRouteJourney ||
        !this.currentData.journeys ||
        this.currentData.journeys.length === 0
      )
        return [];
      const routeDocuments = [];
      const journey = this.currentData.selectedRouteJourney;

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

    /** Retrieves the route position in the list */
    getTransportSectionIndex(currentSection) {
      if (!this.currentData.selectedRouteJourney) return 0;

      let index = 0;
      for (const section of this.currentData.selectedRouteJourney.sections) {
        if (section === currentSection) {
          return index;
        }
        if (section.type === 'public_transport') {
          index++;
        }
      }
      return 0;
    },

    /** Leaves earlier button */
    departEarlier() {
      const [hours, minutes] = this.currentData.selectedTime.split(':').map(Number);
      let newHours = hours - 1;
      let newDate = this.currentData.selectedDate;

      if (newHours < 0) {
        newHours = 23;
        const currentDate = new Date(this.currentData.selectedDate);
        currentDate.setDate(currentDate.getDate() - 1);
        newDate = currentDate.toISOString().slice(0, 10);
      }

      this.currentData.selectedTime = `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      this.currentData.selectedDate = newDate;

      this.calculateRoute();
    },

    /** Leaves later button */
    departLater() {
      const [hours, minutes] = this.currentData.selectedTime.split(':').map(Number);
      let newHours = hours + 1;
      let newDate = this.currentData.selectedDate;

      if (newHours > 23) {
        newHours = 0;
        const currentDate = new Date(this.currentData.selectedDate);
        currentDate.setDate(currentDate.getDate() + 1);
        newDate = currentDate.toISOString().slice(0, 10);
      }

      this.currentData.selectedTime = `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      this.currentData.selectedDate = newDate;

      this.calculateRoute();
    },

    /** Next day button */
    nextDay() {
      const currentDate = new Date(this.currentData.selectedDate);
      currentDate.setDate(currentDate.getDate() + 1);
      this.currentData.selectedDate = currentDate.toISOString().slice(0, 10);

      this.calculateRoute();
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
      let accessPoints = [];
      if (this.documentType === 'waypoint' && this.document.waypoint_type === 'access') {
        // access waypoint
        accessPoints = [this.document];
      } else {
        // for other types of documents, return the waypoints of type access associated (if any)
        accessPoints = this.document?.associations?.waypoints?.filter((doc) => doc && doc.waypoint_type === 'access');
      }
      const reachableChecks = [];

      // Check the accessibility of each waypoint
      for (const waypoint of accessPoints) {
        reachableChecks.push(
          transportService.isReachable(waypoint.document_id).then((isReachable) => ({ waypoint, isReachable }))
        );
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

    /** Displays the duration of the route in days or hours depending on the source */
    formatDurationForDisplay() {
      if (this.document.durations.length === 1 && this.document.durations[0] === '10+') {
        return '10+ ' + this.$gettext('Day(s)').toLowerCase();
      }

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
        let hoursInt = Math.floor(hours);
        let minutes = Math.round((hours - hoursInt) * 60);

        if (minutes === 60) {
          hoursInt += 1;
          minutes = 0;
        }

        return `${hoursInt}h${minutes.toString().padStart(2, '0')}`;
      }

      if (durationInDays === 1) {
        return `1 ${this.$gettext('Day(s)').toLowerCase()}`;
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
