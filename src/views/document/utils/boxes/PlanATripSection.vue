<template>
  <div class="plan-trip-section">
    <div class="plan-trip-info">
      <div class="plan-trip-content">
        <h3 class="plan-trip-title">{{ $gettext('Planifier un trajet de transport en commun') }}</h3>

        <div class="plan-trip-details">
          <div class="plan-trip-from-to">
            <div class="from-to-container">
              <div class="from-container">
                <div class="from-text">De</div>
                <div class="autocomplete-container">
                  <input
                    class="from-address"
                    v-model="fromAddress"
                    @input="searchAddressPropositions"
                    @focus="showAddressPropositions = true"
                    @blur="handleBlur"
                    placeholder="Entrez une adresse de départ"
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
                <div class="to-text">À</div>
                <select name="chose-waypoint" class="chose-waypoint" id="chose-waypoint" v-model="selectedWaypoint">
                  <option v-for="waypoint in accessWaypoints" :key="waypoint.id" :value="waypoint">
                    {{ waypoint.title }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div class="select-date-container">
            <div class="date-picker-container">
              <label for="date-input">Date</label>
              <div class="input-container">
                <input type="date" id="date-input" class="date-input" v-model="selectedDate" />
                <div class="calendar-icon">
                  <img class="geolocalisation-img" src="@/assets/img/boxes/date.svg" />
                </div>
              </div>
            </div>

            <div class="date-picker-container">
              <label for="date-input">Préférence</label>
              <div class="input-container">
                <select name="preference" class="date-input" id="preference" v-model="timePreference">
                  <option value="leave-after">Partir après</option>
                  <option value="arrive-before">Arriver avant</option>
                </select>
              </div>
            </div>

            <div class="date-picker-container hour-picker-container">
              <label for="date-input">Heure</label>
              <div class="input-container">
                <input type="time" id="hour-input" class="hour-input" v-model="selectedTime" />
                <div class="calendar-icon">
                  <img class="" src="@/assets/img/boxes/time.svg" />
                </div>
              </div>
            </div>
          </div>

          <button class="button is-primary plan-trip-search-button" @click="calculateRoute">
            <img class="" src="@/assets/img/boxes/itineraire.svg" />
            <p class="plan-trip-search-button-text">{{ $gettext('Calculer mon trajet aller') }}</p>
          </button>

          <div class="calculated-duration" v-if="calculatedDuration">
            <div class="calculated-duration-number">
              Ce topoguide a une durée théorique estimée à {{ calculatedDuration.toFixed(2) }} jours.
            </div>
            <div class="calculated-duration-vigilant">
              Soyez vigilant à l'heure de départ pour votre trajet retour !
            </div>
          </div>

          <div class="no-itineraries-container" v-if="noResult">
            <div class="no-itineraries">
              <img class="no-itineraries-img" src="@/assets/img/boxes/transport_not_found.svg" />
              <div class="no-itineraries-text">
                <div class="no-itineraries-found">Aucun itinéraire trouvé</div>
                <div class="no-itineraries-detail">
                  Il semblerait que votre trajet ne puisse être réalisé à la date et aux horaires indiqués
                </div>
              </div>
            </div>
          </div>

          <div class="itineraries-container" v-if="journeys.length > 0">
            <div class="itinerary-card" v-for="(journey, index) in journeys" :key="index">
              <div class="itinerary-header">
                <div class="itinerary-time">
                  {{ formatTime(journey.departure_date_time) }} — {{ formatTime(journey.arrival_date_time) }}
                </div>

                <div class="itinerary-path">
                  <div class="journey-steps">
                    <div v-for="(section, sectionIndex) in journey.sections" :key="sectionIndex" class="step-wrapper">
                      <div
                        v-if="
                          section.type === 'public_transport' ||
                          section.type === 'transfer' ||
                          section.type === 'street_network'
                        "
                        class="journey-step"
                      >
                        <div
                          v-if="section.type === 'public_transport'"
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
                  <button class="button is-info is-light" @click="showJourneyDetails(journey)">Voir le détail</button>
                </div>
              </div>

              <!-- Remplacer la partie affichage des détails de l'itinéraire -->
              <div class="journey-details" v-if="selectedJourney === journey">
                <div class="journey-timeline">
                  <!-- Première heure -->
                  <div class="timeline-item">
                    <div class="timeline-time">{{ formatTime(journey.departure_date_time) }}</div>
                    <div class="timeline-icon">
                      <img src="@/assets/img/boxes/start.svg" alt="start" />
                    </div>
                    <div class="timeline-content">
                      <div class="timeline-address">{{ fromAddress }}</div>
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
                          {{ Math.round(section.distance) }} mètres, {{ formatDuration(section.duration) }}
                        </div>
                      </div>
                    </div>

                    <!-- Section transport en commun -->
                    <div v-else-if="section.type === 'public_transport'">
                      <!-- Arrêt de départ -->
                      <div class="timeline-item">
                        <div class="timeline-time">{{ formatTime(section.departure_date_time) }}</div>
                        <div class="timeline-icon stop">
                          <i class="stop-circle"></i>
                        </div>
                        <div class="timeline-content">
                          <div class="timeline-stop-name">Arrêt : {{ section.from?.name || 'Départ' }}</div>
                        </div>
                      </div>

                      <!-- Ligne de transport -->
                      <div class="timeline-item transport" :class="getTransportColorClass(section)">
                        <div class="timeline-content">
                          <div class="timeline-line">Ligne : {{ section.display_informations?.code || '' }}</div>
                          <div class="timeline-direction">
                            Direction : {{ section.display_informations?.direction || '' }}
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
                          <div class="timeline-stop-name">Arrêt : {{ section.to?.name || 'Arrivée' }}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Heure et adresse d'arrivée -->
                  <div class="timeline-item destination">
                    <div class="timeline-time">{{ formatTime(journey.arrival_date_time) }}</div>
                    <div class="timeline-icon">
                      <img src="@/assets/img/boxes/end.svg" alt="end" />
                    </div>
                    <div class="timeline-content">
                      <div class="timeline-address">{{ selectedWaypoint?.title || 'Destination' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="plan-trip-map">
      <map-view
        ref="mapView"
        :documents="mapDocuments"
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

import photon from '@/js/apis/photon';
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
      fromAddress: '',
      toAddress: '',
      selectedAddress: null,
      addressPropositions: [],
      showAddressPropositions: false,
      selectedDate: new Date().toISOString().slice(0, 10), // Format YYYY-MM-DD
      selectedTime: new Date().toTimeString().slice(0, 5), // Format HH:MM
      timePreference: 'leave-after',
      fromCoordinates: null,
      toCoordinates: null,
      selectedWaypoint: null,
      journeys: [],
      selectedJourney: null,
      apiKey: 'eb6b9684-0714-4dd9-aba4-ce47c3368666',
      calculatedDuration: this.document.calculated_duration,
      noResult: false,
      transportColors: ['pink', 'orange', 'royalblue', 'purple', 'green', 'yellow', 'gray', 'salmon', 'teal', 'brown'],
    };
  },
  computed: {
    accessWaypoints() {
      return this.document.associations.waypoints
        .filter((doc) => doc.type === 'w' && doc.waypoint_type === 'access')
        .map((waypoint) => {
          const locale = waypoint.locales.find((l) => l.lang === this.$language.current) || waypoint.locales[0];
          const geom = JSON.parse(waypoint.geometry.geom);
          return {
            id: waypoint.document_id,
            title: locale.title,
            coordinates: transform(geom.coordinates, 'EPSG:3857', 'EPSG:4326'),
          };
        });
    },
    mapDocuments() {
      // Commencer avec les documents existants si nécessaire
      const baseDocuments = this.document.associations.waypoints ? [this.document.associations.waypoints] : [];

      // Ajouter les points d'accès
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

      // Ajouter les documents d'itinéraire si des itinéraires existent
      const routeDocuments = this.prepareRouteDocuments();

      return [...baseDocuments, ...accessWaypointDocuments, ...routeDocuments];
    },
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

    /** Call Navitia with parameters (selected waypoint, from address, to address, date, time, preference) */
    async calculateRoute() {
      if (!this.selectedWaypoint) {
        alert('Veuillez sélectionner un point de destination');
        return;
      }

      if (!this.fromCoordinates) {
        alert('Veuillez entrer une adresse de départ valide');
        return;
      }

      console.log("Calcul d'itinéraire avec les données:", {
        fromAddress: this.fromAddress,
        fromCoordinates: this.fromCoordinates,
        toAddress: this.selectedWaypoint.title,
        toCoordinates: this.selectedWaypoint.coordinates,
        date: this.selectedDate,
        time: this.selectedTime,
        preference: this.timePreference,
      });

      // Formater les données pour l'API Navitia
      const fromCoords = `${this.fromCoordinates[0]};${this.fromCoordinates[1]}`;
      const toCoords = `${this.selectedWaypoint.coordinates[0]};${this.selectedWaypoint.coordinates[1]}`;

      // Formater la date et l'heure pour Navitia (YYYYMMDDTHHMMSS)
      const dateTimeFormat = this.selectedDate.replace(/-/g, '') + 'T' + this.selectedTime.replace(':', '') + '00';
      const dateTimeRepresents = this.timePreference === 'arrive-before' ? 'arrival' : 'departure';

      try {
        const response = await fetch(
          `https://api.navitia.io/v1/journeys?from=${fromCoords}&to=${toCoords}&datetime=${dateTimeFormat}&datetime_represents=${dateTimeRepresents}`,
          {
            headers: {
              Authorization: `${this.apiKey}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        console.log(
          `https://api.navitia.io/v1/journeys?from=${fromCoords}&to=${toCoords}&datetime=${dateTimeFormat}&datetime_represents=${dateTimeRepresents}`
        );

        const data = await response.json();
        this.journeys = data.journeys.slice(0, 3);
        this.noResult = false;

        console.log(this.journeys);

        this.$emit('calculate-route', {
          from: {
            address: this.fromAddress,
            coordinates: this.fromCoordinates,
          },
          to: {
            address: this.selectedWaypoint.title,
            coordinates: this.selectedWaypoint.coordinates,
          },
          date: this.selectedDate,
          time: this.selectedTime,
          preference: this.timePreference,
          journeys: this.journeys,
        });
      } catch (error) {
        console.error('Error retrieving routes:', error);
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
      if (!this.selectedJourney || !this.journeys || this.journeys.length === 0) return [];

      const routeDocuments = [];

      const journey = this.selectedJourney;

      journey.sections.forEach((section, index) => {
        if (section.geojson) {
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
              mode: section.mode,
              type: section.type,
              duration: section.duration,
              color: this.getRouteColor(section),
            },
          };

          routeDocuments.push(routeDocument);
        }
      });

      return routeDocuments;
    },

    getRouteColor(section) {
      if (section.mode === 'walking') return 'blue';
      if (section.type === 'public_transport') {
        const colorIndex = this.getTransportSectionIndex(section);
        return this.transportColors[colorIndex % this.transportColors.length];
      }
      return 'gray';
    },

    showJourneyDetails(journey) {
      if (this.selectedJourney === journey) {
        this.selectedJourney = null;
      } else {
        this.selectedJourney = journey;
      }
    },

    getTransportSectionIndex(currentSection) {
      if (!this.selectedJourney) return 0;

      let index = 0;
      for (const section of this.selectedJourney.sections) {
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
  },
};
</script>

<style scoped lang="scss">
.plan-trip-section {
  margin-top: 20px;
  display: flex;
  gap: 20px;
  height: 500px;

  .plan-trip-info {
    flex: 1;
    height: 100%;
    overflow-y: auto;

    .plan-trip-content {
      .plan-trip-title {
        font-size: 15px;
        font-weight: bold;
        margin-bottom: 15px;
      }

      .plan-trip-details {
        display: flex;
        flex-direction: column;
        gap: 15px;

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
            .from-container {
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
                  margin-left: 10px;
                  border: none;
                  outline: none;
                  width: 88%;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                  overflow: hidden;
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
            }
            .to-container {
              display: flex;
              border: 1px solid lightgray;
              padding: 5px;
              border-radius: 4px;
              .to-text {
                width: 32px;
                padding-left: 5px;
                border-right: 1px solid lightgray;
                font-weight: 600;
              }
              .chose-waypoint {
                border: none;
                margin-left: 10px;
                width: 100%;
                background-color: white;
              }
            }
          }
          .reverse-from-to {
            border-radius: 4px;
            height: 35px;
            width: 35px;
            margin-top: auto;
            margin-bottom: auto;
            padding: 4px;
            margin-left: auto;
            margin-right: 15px;
            border: 1px solid lightgray;
            background-color: white;
            img {
              display: flex;
              margin: auto;
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
                padding: 12px 14px;
                padding-right: 8px;
                width: 20px;
                border: none;
                outline: none;
                font-size: 16px;
                color: #333;
                background-color: white;
                margin-right: 7px;

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
                padding: 12px 12px;
                max-width: 76px;
                border: none;
                outline: none;
                font-size: 16px;
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

        // itinerary.scss
        // Style principal pour l'itinéraire

        .itinerary {
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e0e0e0;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          margin-bottom: 16px;
          background-color: #ffffff;
        }

        // En-tête résumé de l'itinéraire
        .itinerary-summary {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          background-color: #f7f9f7;
          border-left: 4px solid #4caf50;
          justify-content: space-between;

          .travel-time {
            font-weight: 600;
            font-size: 16px;
          }

          .duration {
            font-weight: 600;
            color: #333333;
          }

          .travel-icons {
            display: flex;
            align-items: center;
            margin: 8px 0;

            .icon {
              margin: 0 4px;
            }
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
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          border-radius: 10px;
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
                padding-left: 26px;
                margin-left: 52px;
                padding-top: 10px;
                padding-bottom: 10px;

                &.bus-line-b {
                  .timeline-icon.transport {
                    background-color: #4caf50; // Green for B line
                  }
                }

                &.bus-line-e {
                  .timeline-icon.transport {
                    background-color: #3f51b5; // Blue/purple for E line
                  }
                }

                &.bus-line-55 {
                  .timeline-icon.transport {
                    background-color: #e91e63; // Pink for 55 line
                  }
                }
              }
            }

            .timeline-time {
              width: 60px;
              font-weight: bold;
              font-size: 14px;
              padding-top: 2px;
            }

            .timeline-icon {
              position: relative;
              z-index: 2;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background-color: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 15px 0 -22px;

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

                .transport-code {
                  font-weight: bold;
                  font-size: 12px;
                }
              }

              i {
                display: inline-block;
                width: 12px;
                height: 12px;

                &.location-dot {
                  background-color: #ff5722;
                  border-radius: 50%;
                }
              }
            }

            .timeline-content {
              flex: 1;
              padding-top: 2px;

              .timeline-address {
                font-weight: bold;
                font-size: 16px;
              }

              .timeline-walking-info {
                font-size: 14px;
                color: #757575;
                display: flex;
                align-items: center;
              }

              .timeline-stop-name {
                font-size: 15px;
              }

              .timeline-line {
                font-weight: bold;
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

        // Classes spécifiques pour la coloration des lignes de transport
        .getTransportClass {
          &.bus-line-b {
            background-color: #4caf50;
            &:before {
              background-color: #4caf50;
            }
          }

          &.bus-line-e {
            background-color: #3f51b5;
            &:before {
              background-color: #3f51b5;
            }
          }

          &.bus-line-55 {
            background-color: #e91e63;
            &:before {
              background-color: #e91e63;
            }
          }
        }

        // Style pour le point de départ du topo
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
        max-width: 480px;
        .itinerary-header {
          border: 1px solid lightgrey;
          border-radius: 4px;
          padding: 10px;
          border-bottom: 18px;

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
      }
    }
  }

  .plan-trip-map {
    height: auto;
    width: 600px;
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
