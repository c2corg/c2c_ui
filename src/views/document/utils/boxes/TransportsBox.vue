<template>
  <div class="box public-transports-box">
    <h2 class="title is-2">
      <span>{{ $gettext('Access by public transport') }}</span>
    </h2>
    <button class="button is-primary public-transports-button">
      <img class="public-transports-bus" src="@/assets/img/boxes/public_transports.png" />
      {{ $gettext('Show nearby stops') }}
    </button>
    <div v-if="showAccessibilityInfo" class="public-transports-section">
      <div class="public-transports-result">
        <p class="public-transports-subtitle">
          {{ $gettext('Public transport stops nearby (less than 5km)') }}
        </p>
        <div class="stop-cards">
          <div
            v-for="(stopGroup, stopName) in groupedStops"
            :key="stopName"
            class="stop-card"
            :class="{ 'selected-stop': isStopGroupSelected(stopGroup) }"
          >
            <div class="stop-header" @click="selectStopGroup(stopGroup)">
              <strong>{{ $gettext('Stop') }} :</strong> {{ stopName }}
            </div>
            <div class="stop-details">
              <div v-for="stop in stopGroup" :key="stop.id" class="line-details">
                <div class="line-header">
                  <strong>{{ $gettext('Line') }} :</strong> {{ stop.line }}
                  <button class="toggle-details-button" @click.stop="toggleLineDetails(stop.id)">
                    <img
                      v-if="expandedLines[stop.id]"
                      src="@/assets/img/boxes/toggle_minus.svg"
                      alt="Minus"
                      class="toggle-icon"
                    />
                    <img v-else src="@/assets/img/boxes/toggle_plus.svg" alt="Plus" class="toggle-icon" />
                  </button>
                </div>
                <div v-if="expandedLines[stop.id]" class="line-info">
                  <div>
                    <strong>{{ $gettext('Operator') }} :</strong> {{ stop.operator }}
                  </div>
                  <div>
                    <strong>{{ $gettext('Distance between the stop and the starting point of the topo') }} :</strong>
                    {{ formattedDistance(stop.distance) }}
                  </div>
                </div>
              </div>
            </div>
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
        />
      </div>
    </div>

    <div v-if="!showAccessibilityInfo" class="public-transport-no-result">
      <img class="public-transports-no-result-bus" src="@/assets/img/boxes/public_transports.png" />
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
    };
  },
  computed: {
    groupedStops() {
      return this.stops.reduce((acc, stop) => {
        if (!acc[stop.stop_name]) {
          acc[stop.stop_name] = [];
        }
        acc[stop.stop_name].push(stop);
        return acc;
      }, {});
    },
    mapDocuments() {
      if (!this.document || this.document.length === 0) {
        return [];
      }
      const documents = [...this.document];
      if (this.stopDocuments && this.stopDocuments.length > 0) {
        documents.push(...this.stopDocuments);
      }
      return documents.filter(Boolean);
    },
  },
  watch: {
    document: {
      handler(newVal) {
        if (newVal && newVal.length > 0) {
          this.fetchStopsForDocuments(newVal);
        }
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
    fetchStopsForDocuments(documents) {
      this.stops = []; // Réinitialise les stops avant de les remplir
      const fetchPromises = documents.map((doc) => {
        if (!doc || !doc.document_id) {
          console.warn('Document invalide ou ID manquant :', doc);
          return Promise.resolve();
        }
        const waypointUrl = `http://localhost:6543/waypoints/${doc.document_id}/stops`;
        return fetch(waypointUrl)
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Erreur HTTP: ${response.status}`);
            }
            return response.json();
          })
          .then((data) => {
            this.showAccessibilityInfo = data.stops.length > 0;
            const stopsForDocument = data.stops.map((stop) => ({
              ...stop,
              distance: stop.distance ?? 0,
            }));
            this.stops = this.stops.concat(stopsForDocument); // Concatène les stops
          })
          .catch((error) => {
            console.error('Erreur lors de la récupération des données :', error);
          });
      });

      Promise.all(fetchPromises).then(() => {
        this.createStopDocuments();
      });
    },
    formattedDistance(distance) {
      return `${distance.toFixed(3).replace('.', ',')} km`;
    },
    createStopDocuments() {
      if (!this.stops || !this.stops.length) return;
      this.stopDocuments = this.stops
        .map((stop) => {
          try {
            if (!stop.coordinates || !stop.coordinates.x || !stop.coordinates.y) {
              console.warn(`Stop ${stop.id} n'a pas de coordonnées valides:`, stop);
              return null;
            }
            const stopDoc = JSON.parse(JSON.stringify(this.document[0])); // Utilise le premier document comme modèle
            stopDoc.document_id = stop.id;
            stopDoc.type = 's';
            if (stopDoc.locales && stopDoc.locales.length > 0) {
              stopDoc.locales[0].title = `${stop.stop_name} (${stop.line})`;
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
            return stopDoc;
          } catch (error) {
            console.error(`Erreur lors de la création du document pour le stop ${stop.id}:`, error);
            return null;
          }
        })
        .filter(Boolean);
    },
    selectStopGroup(stopGroup) {
      this.selectedStopGroup = stopGroup;
      this.selectedStop = stopGroup[0]; // Default to the first stop in the group
      this.updateMap();
    },
    updateMap() {
      if (this.selectedStop && this.$refs.mapView) {
        this.$refs.mapView.highlightStop(this.selectedStop.id);
      }
    },
    handleStopClicked(stopId) {
      this.selectedStop = this.stops.find((stop) => stop.id === stopId);
      // Find and set the selected stop group
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
      .public-transports-subtitle {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 20px;
      }

      .stop-cards {
        height: 430px;
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

        .stop-header {
          font-weight: bold;
          font-size: 1.1em;
          color: #2a2a2a;
          margin-bottom: 5px;
        }

        .stop-details {
          margin-top: 10px;
          padding-left: 10px;
          border-top: 1px solid #f0f0f0;

          .line-details {
            margin-bottom: 10px;
            border: 1px solid #e0e0de;
            padding: 7px;
            border-radius: 4px;

            .line-header {
              display: flex;
              justify-content: space-between;
              align-items: start;
              gap: 4px;

              strong {
                white-space: nowrap;
              }

              .toggle-details-button {
                background: none;
                border: none;
                cursor: pointer;
                padding: 0;
                margin-left: 5px;
                margin-right: 5px;
                margin-top: 5px;

                .toggle-icon {
                  width: 24px;
                  height: 24px;
                }
              }
            }

            .line-info {
              div {
                margin-top: 10px;
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
      width: 100px;
      height: 100px;
    }

    .public-transport-no-result-text {
    }
  }
}
</style>
