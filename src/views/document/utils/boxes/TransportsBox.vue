<template>
  <div v-if="accessWaypoint" class="box public-transports-box" id="public-transport">
    <h2 class="title is-2">
      <span>{{ $gettext('Access by public transport') }}</span>
    </h2>
    <button class="button is-primary public-transports-button">
      <img class="public-transports-bus" src="@/assets/img/boxes/public_transport.svg" />
      {{ $gettext('Show nearby stops') }}
    </button>
    <div v-if="showAccessibilityInfo" class="public-transports-section">
      <div class="public-transports-result">
        <div class="stop-cards">
          <div
            v-for="(stopGroup, stopName) in groupedStops"
            :key="stopName"
            class="stop-card"
            :ref="'stopCard_' + stopGroup[0].id"
            :class="{ 'selected-stop': isStopGroupSelected(stopGroup) }"
            @mouseover="selectStopGroup(stopGroup)"
            @click="seeLineDetails(stopGroup)"
          >
            <div class="stop-header">
              <strong>{{ $gettext('Stop') }} :</strong> {{ stopName }} {{ $gettext('Away') }}
              {{ stopGroup[0].distance }} {{ $gettext('km from the access point') }}
            </div>
            <div v-if="isStopGroupExpanded(stopGroup)" class="stop-details">
              <div v-for="stop in stopGroup" :key="stop.id" class="line-details">
                <div class="line-info">
                  <div>
                    <strong>{{ $gettext('Line') }} :</strong> {{ stop.line }}
                  </div>
                  <div>
                    <strong>{{ $gettext('Operator') }} :</strong> {{ stop.operator }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="missing-transports-warning" v-if="missingTransportForWaypoint">
          <p class="missing-transports-warning-exclamation">!</p>
          <div class="missing-transports-warning-text">
            <strong>{{ $gettext('This route is partially accessible by public transport.') }}</strong>
            <p>
              {{ $gettext('At least one access point in the topo does not have a public transport stop within 5km.') }}
            </p>
          </div>
        </div>
      </div>

      <div class="public-transports-map">
        <map-view
          ref="mapView"
          :documents="mapDocuments"
          :show-protection-areas="['r', 'w'].includes(document.type)"
          :biodiv-sports-activities="document.activities"
          :full-screen-element-id="
            !$screen.isMobile && showElevationProfile && elevationProfileHasData ? 'fullscreen-map-container' : null
          "
          :show-pin-to-top-button="true"
          @has-protection-area="$emit('has-protection-area')"
          @pin-to-top-clicked="togglePinToSide(true)"
          @stop-clicked="handleStopClicked"
          @highlight-document="handleDocumentHighlight"
        />
      </div>
    </div>

    <div v-if="!showAccessibilityInfo" class="public-transport-no-result">
      <img class="public-transports-no-result-bus" src="@/assets/img/boxes/transport_not_found.svg" />
      <div class="public-transport-no-result-text">
        <strong>{{
          $gettext('Unfortunately, this guide does not appear to be served by a public transport service')
        }}</strong>
        <p>{{ $gettext('We did not find any public transport stop near the topo route') }}</p>
        <p>{{ $gettext('(less than 5km from one of the topo access points)') }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import transportService from '@/js/apis/transport-service';
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  mixins: [requireDocumentProperty],
  props: {
    document: Array,
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
    };
  },
  computed: {
    accessWaypoints() {
      if (!this.document || !Array.isArray(this.document)) {
        return [];
      }

      // Filtrer pour ne garder que les waypoints de type "access"
      return this.document.filter((doc) => doc && doc.waypoint_type === 'access');
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
          this.stops = result.stopareas.sort((a, b) => a.distance - b.distance);
          this.missingTransportForWaypoint = result.missingTransportForWaypoint;
          this.showAccessibilityInfo = this.stops.length > 0;
          this.createStopDocuments();
        })
        .catch((error) => {
          console.error('Erreur lors de la récupération des données :', error);
          this.missingTransportForWaypoint = true;
        });
    },
    formattedDistance(distance) {
      return `${distance.toFixed(3).replace('.', ',')} km`;
    },
    createStopDocuments() {
      if (!this.stops || !this.stops.length) return;

      // S'assurer qu'il y a au moins un waypoint d'accès disponible comme modèle
      if (this.accessWaypoints.length === 0) return;

      this.stopDocuments = this.stops.reduce(
        (uniqueStops, stop) => {
          try {
            if (!stop.coordinates || !stop.coordinates.x || !stop.coordinates.y) {
              console.warn(`Stop ${stop.id} n'a pas de coordonnées valides:`, stop);
              return uniqueStops;
            }

            // Vérifier si ces coordonnées existent déjà dans les points traités
            const coordKey = `${stop.coordinates.x},${stop.coordinates.y}`;
            if (uniqueStops.coordsMap[coordKey]) {
              return uniqueStops;
            }

            // Utiliser le premier waypoint d'accès comme modèle
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

            // Marquer ces coordonnées comme utilisées
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
      this.updateMap();
    },
    updateMap() {
      if (this.selectedStop && this.$refs.mapView) {
        this.$refs.mapView.highlightStop(this.selectedStop.id);
        this.$refs.mapView.goAndZoomOnStop(this.selectedStop.id);
      }
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

    toggleLineDetails(lineId) {
      this.$set(this.expandedLines, lineId, !this.expandedLines[lineId]);
    },

    isStopGroupExpanded(stopGroup) {
      const groupId = stopGroup[0].id;
      return this.expandedStopGroups[groupId] === true;
    },

    seeLineDetails(stopGroup) {
      const groupId = stopGroup[0].id;
      // Toggle l'état d'expansion
      this.$set(this.expandedStopGroups, groupId, !this.expandedStopGroups[groupId]);

      // Définir ce groupe comme sélectionné
      this.selectedStopGroup = stopGroup;
      this.selectedStop = stopGroup[0];

      // Mettre à jour la carte
      this.updateMap();

      // Faire défiler automatiquement pour s'assurer que la card est visible
      this.$nextTick(() => {
        const refName = 'stopCard_' + groupId;
        if (this.$refs[refName] && this.$refs[refName][0]) {
          this.$refs[refName][0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    },

    handleDocumentHighlight(document) {
      if (document && document.isStopPoint) {
        const stopId = document.document_id;
        const stop = this.stops.find((s) => s.id === stopId);
        if (stop) {
          // Trouver le groupe de cet arrêt
          this.selectedStopGroup = Object.values(this.groupedStops).find((group) => group.some((s) => s.id === stopId));
          this.selectedStop = stop;

          // Surligner l'arrêt sur la carte
          if (this.$refs.mapView) {
            this.$refs.mapView.highlightStop(stopId);
          }

          // Faire défiler automatiquement vers l'élément sélectionné
          this.$nextTick(() => {
            const refName = 'stopCard_' + stopId;
            if (this.$refs[refName] && this.$refs[refName][0]) {
              this.$refs[refName][0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          });
        }
      } else {
        // Réinitialiser la sélection si on n'est sur aucun arrêt
        this.selectedStopGroup = null;
        this.selectedStop = null;

        // Réinitialiser tous les styles sur la carte
        if (this.$refs.mapView) {
          this.$refs.mapView.resetStopStyles();
        }
      }
    },
  },
};
</script>

<style scoped lang="scss">
.public-transports-box {
  .public-transports-button {
    display: flex;

    .public-transports-bus {
      width: 18px;
      height: 18px;
      margin-right: 8px;
    }
  }
  .public-transports-section {
    margin-top: 20px;
    display: flex;
    gap: 20px;
    height: 500px;

    .public-transports-result {
      display: flex;
      flex-direction: column;
      height: 100%;
      .public-transports-subtitle {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 20px;
      }

      .stop-cards {
        height: inherit;
        overflow-y: scroll;
        padding-right: 4px;
      }

      .stop-card {
        border: 2px solid lightgray;
        border-top-right-radius: 8px;
        border-bottom-right-radius: 8px;
        border-top-left-radius: 4px;
        border-bottom-left-radius: 4px;
        padding: 15px;
        margin-bottom: 10px;
        background: white;
        border-left: 8px solid #337ab7;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: #4baf50;
          background-color: #fafafa;

          .line-details {
            background-color: white;
          }
        }

        .stop-header {
          font-weight: bold;
          font-size: 1.1em;
          color: #2a2a2a;
          margin-bottom: 5px;
        }

        .stop-details {
          margin-top: 15px;
          padding-left: 10px;
          border-top: 1px solid #f0f0f0;

          .line-details {
            margin-bottom: 10px;
            border: 1px solid #e0e0de;
            padding: 10px;
            border-radius: 4px;

            .line-info {
              div {
                margin-bottom: 8px;
              }
            }
          }
        }

        &.selected-stop {
          border: 2px solid #4baf50;
          border-left: 8px solid #4baf50;
          background-color: #fbfaf6;
        }
      }

      .missing-transports-warning {
        display: flex;
        padding: 10px;
        border: 1px solid #ffa74f;
        border-radius: 4px;
        margin-top: 25px;
        gap: 10px;
        align-items: center;
        background-color: #fec184;
        .missing-transports-warning-exclamation {
          height: 26px;
          width: 26px;
          background-color: #ff4d09;
          border-radius: 14px;
          color: #fec184;
          font-weight: bold;
          text-align: center;
          flex: none;
          font-size: 18px;
        }

        .missing-transports-warning-text {
        }
      }
    }

    .public-transports-map {
      height: auto;
      width: 800px;
      border: 1px solid lightgray;
      border-radius: 4px;
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

    .public-transport-no-result-text {
    }
  }
}

@media only screen and (max-width: 600px) {
  .public-transports-section {
    display: inline !important;
    .public-transports-map {
      height: 200px !important;
      width: 300px !important;
      margin-left: auto;
      margin-right: auto;
    }
  }
}
</style>
