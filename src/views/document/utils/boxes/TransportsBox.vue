<template>
  <div v-if="accessWaypoint" class="box public-transports-box" id="public-transport">
    <h2 class="title is-2">
      <span>{{ $gettext('Access by public transport') }}</span>
    </h2>

    <div class="public-transport-buttons">
      <button
        class="button is-primary public-transports-button"
        :class="{ 'is-active': activeSection === 'nearbyStops' }"
        @click="setActiveSection('nearbyStops')"
      >
        <img class="public-transports-bus" src="@/assets/img/boxes/public_transport.svg" />
        {{ $gettext('Show nearby stops') }}
      </button>

      <button
        v-if="hasSecondSection"
        class="button is-primary public-transports-button"
        :class="{ 'is-active': activeSection === 'planATrip' }"
        @click="setActiveSection('planATrip')"
      >
        <img class="public-transports-bus" src="@/assets/img/boxes/itineraire.svg" />
        {{ $gettext('Planifier un trajet de transport en commun') }}
      </button>
    </div>

    <nearby-stops-section
      v-if="activeSection === 'nearbyStops' && showAccessibilityInfo"
      :stops="stops"
      :grouped-stops="groupedStops"
      :missing-transport-for-waypoint="missingTransportForWaypoint"
      :map-documents="mapDocuments"
      :document="document.associations.waypoints"
      :selected-stop="selectedStop"
      :selected-stop-group="selectedStopGroup"
      :expanded-stop-groups="expandedStopGroups"
      @select-stop-group="selectStopGroup"
      @see-line-details="seeLineDetails"
      @stop-clicked="handleStopClicked"
      @highlight-document="handleDocumentHighlight"
      @has-protection-area="$emit('has-protection-area')"
    />

    <!-- Future Second Section Component -->
    <plan-a-trip-section
      v-if="activeSection === 'planATrip'"
      :map-documents="mapDocuments"
      :document="document"
      @highlight-document="handleDocumentHighlight"
      @has-protection-area="$emit('has-protection-area')"
    />

    <div v-if="activeSection === 'nearbyStops' && !showAccessibilityInfo" class="public-transport-no-result">
      <img class="public-transports-no-result-bus" src="@/assets/img/boxes/transport_not_found.svg" />
      <div class="public-transport-no-result-text">
        <strong>{{ $gettext('Unfortunately, this route may not be deserved by public transport') }}</strong>
        <p>
          {{
            $gettext("We didn't find any public transport stop point in a 5 km foot range from any route access point.")
          }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import NearbyStopsSection from './NearbyStopsSection.vue';
import PlanATripSection from './PlanATripSection.vue';

import transportService from '@/js/apis/transport-service';
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  name: 'PublicTransport',
  mixins: [requireDocumentProperty],
  components: {
    NearbyStopsSection,
    PlanATripSection,
  },
  props: {
    document: Object,
    hasSecondSection: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      stops: [],
      stopDocuments: [],
      showElevationProfile: false,
      elevationProfileHasData: false,
      testDocument: null,
      selectedStop: null,
      selectedStopGroup: null,
      expandedLines: {},
      showAccessibilityInfo: false,
      missingTransportForWaypoint: false,
      accessWaypoint: false,
      expandedStopGroups: {},
      activeSection: 'nearbyStops', // Default active section
    };
  },
  computed: {
    accessWaypoints() {
      if (!this.document.associations.waypoints || !Array.isArray(this.document.associations.waypoints)) {
        return [];
      }

      const accessPoints = this.document.associations.waypoints.filter((doc) => doc && doc.waypoint_type === 'access');
      const accessPointsCopy = JSON.parse(JSON.stringify(accessPoints));

      accessPointsCopy.forEach((doc) => {
        if (doc.type === 'w') {
          doc.type = 'z';
        }

        if (doc.maps && Array.isArray(doc.maps)) {
          doc.maps.forEach((map) => {
            if (map.type === 'w') {
              map.type = 'z';
            }
          });
        }
      });

      return accessPointsCopy;
    },
    groupedStops() {
      return this.stops.reduce((acc, stop) => {
        if (!acc[stop.stoparea_name]) {
          acc[stop.stoparea_name] = [];
        }
        acc[stop.stoparea_name].push(stop);
        return acc;
      }, {});
    },

    mapDocuments() {
      if (!this.accessWaypoints || this.accessWaypoints.length === 0) {
        return [];
      }
      const documents = [...this.accessWaypoints];

      if (this.stopDocuments && this.stopDocuments.length > 0) {
        documents.push(...this.stopDocuments);
      }

      return documents.filter(Boolean);
    },
  },
  watch: {
    document: {
      handler() {
        this.processAccessWaypoints();
      },
      deep: true,
      immediate: true,
    },
    stops: {
      handler(newStops) {
        if (newStops && newStops.length > 0) {
          this.createStopDocuments();
        }
      },
      deep: true,
    },
  },
  methods: {
    setActiveSection(section) {
      this.activeSection = section;
    },
    processAccessWaypoints() {
      const accessWaypoints = this.accessWaypoints;

      if (accessWaypoints.length === 0) {
        this.stops = [];
        return;
      } else {
        this.accessWaypoint = true;
      }

      this.fetchStopsForDocuments(accessWaypoints);
    },
    fetchStopsForDocuments(documents) {
      transportService
        .getStopareasForDocuments(documents)
        .then((result) => {
          documents.forEach((doc) => {
            if (!result.documentResults[doc.document_id]) {
              doc.public_transportation_rating = 'no service';
            } else {
              doc.public_transportation_rating = 'service available';
            }
          });

          this.stops = result.stopareas.sort((a, b) => a.distance - b.distance);
          this.missingTransportForWaypoint = result.missingTransportForWaypoint;
          this.showAccessibilityInfo = this.stops.length > 0;
          this.createStopDocuments();
        })
        .catch((error) => {
          console.error('Erreur lors de la récupération des données :', error);
          this.missingTransportForWaypoint = true;

          documents.forEach((doc) => {
            doc.public_transportation_rating = 'no service';
          });
        });
    },
    createStopDocuments() {
      if (!this.stops || !this.stops.length) return;

      if (this.accessWaypoints.length === 0) return;

      this.stopDocuments = this.stops.reduce(
        (uniqueStops, stop) => {
          try {
            if (!stop.coordinates || !stop.coordinates.x || !stop.coordinates.y) {
              console.warn(`Stop ${stop.id} n'a pas de coordonnées valides:`, stop);
              return uniqueStops;
            }

            const coordKey = `${stop.coordinates.x},${stop.coordinates.y}`;
            if (uniqueStops.coordsMap[coordKey]) {
              return uniqueStops;
            }

            const stopDoc = JSON.parse(JSON.stringify(this.accessWaypoints[0]));
            stopDoc.document_id = stop.id;
            stopDoc.type = 's';
            if (stopDoc.locales && stopDoc.locales.length > 0) {
              stopDoc.locales[0].title = '';
            }
            if (stopDoc.geometry) {
              const geom = {
                type: 'Point',
                coordinates: [stop.coordinates.x, stop.coordinates.y],
              };
              stopDoc.geometry.geom = JSON.stringify(geom);
            }
            stopDoc.isStopPoint = true;
            stopDoc.stopInfo = {
              operator: stop.operator,
              line: stop.line,
              distance: stop.distance,
            };

            uniqueStops.coordsMap[coordKey] = true;
            uniqueStops.docs.push(stopDoc);
            return uniqueStops;
          } catch (error) {
            console.error(`Erreur lors de la création du document pour le stop ${stop.id}:`, error);
            return uniqueStops;
          }
        },
        { docs: [], coordsMap: {} }
      ).docs;
    },
    selectStopGroup(stopGroup) {
      this.selectedStopGroup = stopGroup;
      this.selectedStop = stopGroup[0]; // Default to the first stop in the group
    },

    handleStopClicked(stopId) {
      this.selectedStop = this.stops.find((stop) => stop.id === stopId);
      this.selectedStopGroup = Object.values(this.groupedStops).find((group) =>
        group.some((stop) => stop.id === stopId)
      );
    },

    isStopGroupSelected(stopGroup) {
      return (
        this.selectedStopGroup &&
        stopGroup.some((stop) => this.selectedStopGroup.some((selectedStop) => selectedStop.id === stop.id))
      );
    },

    seeLineDetails(stopGroup) {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
        return;
      }

      const groupId = stopGroup[0].id;
      this.$set(this.expandedStopGroups, groupId, !this.expandedStopGroups[groupId]);

      this.selectedStopGroup = stopGroup;
      this.selectedStop = stopGroup[0];
    },

    handleDocumentHighlight(document) {
      if (document && document.isStopPoint) {
        const stopId = document.document_id;
        const stop = this.stops.find((s) => s.id === stopId);
        if (stop) {
          this.selectedStopGroup = Object.values(this.groupedStops).find((group) => group.some((s) => s.id === stopId));
          this.selectedStop = stop;
        }
      } else {
        this.selectedStopGroup = null;
        this.selectedStop = null;
      }
    },
  },
};
</script>

<style scoped lang="scss">
.public-transports-box {
  .public-transport-buttons {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }

  .public-transports-button {
    display: flex;
    background-color: white;
    color: black;
    font-weight: 500;
    border: 1px solid lightgray;

    .public-transports-bus {
      width: 18px;
      height: 18px;
      margin-right: 8px;
    }

    &.is-active {
      background-color: #337ab7;
      border: none;
    }
  }

  .public-transport-no-result {
    display: flex;
    padding: 20px;
    border: 1px solid lightgray;
    border-radius: 4px;
    margin-top: 20px;
    gap: 30px;
    align-items: center;

    .public-transports-no-result-bus {
      margin-left: 20px;
      width: 100px;
      height: 100px;
    }
  }
}

@media only screen and (max-width: 600px) {
  .public-transport-buttons {
    flex-direction: column;

    .public-transports-button {
      margin-bottom: 10px;
    }
  }

  .public-transport-no-result {
    flex-direction: column;

    .public-transports-no-result-bus {
      margin-left: 0;
      margin-bottom: 15px;
    }
  }
}
</style>
