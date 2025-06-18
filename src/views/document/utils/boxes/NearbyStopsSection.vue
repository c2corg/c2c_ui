<template>
  <div class="public-transports-section">
    <div v-if="showAccessibilityInfo" class="public-transports-result">
      <div class="stop-cards" ref="stopCardContainer">
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
            <p>
              <strong>{{ $gettext('Stop') }} : </strong> {{ stopName }}
            </p>
            <p>
              <strong>{{ $gettext('Distance from the route access point') }} : </strong>{{ stopGroup[0].distance }} km
            </p>
            <div v-if="!isStopGroupExpanded(stopGroup)">
              <p class="see-more-lines">{{ $gettext('See lines details') }}</p>
            </div>
            <div v-if="isStopGroupExpanded(stopGroup)">
              <p class="see-more-lines">{{ $gettext('Hide lines details') }}</p>
            </div>
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
            {{ $gettext("At least one access point in the route don't have a public transport stop within 5km.") }}
          </p>
        </div>
      </div>
    </div>

    <div v-if="!showAccessibilityInfo" class="public-transport-no-result">
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

    <div class="public-transports-map">
      <map-view
        ref="mapView"
        :documents="filteredDocuments"
        :show-protection-areas="['r', 'w'].includes(document.type)"
        :biodiv-sports-activities="document.activities"
        :full-screen-element-id="
          !$screen.isMobile && showElevationProfile && elevationProfileHasData ? 'fullscreen-map-container' : null
        "
        @has-protection-area="$emit('has-protection-area')"
        @stop-clicked="handleStopClicked"
        @highlight-document="handleDocumentHighlight"
      />
    </div>
  </div>
</template>

<script>
import transportService from '@/js/apis/transport-service';
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  name: 'NearbyStopsSection',
  mixins: [requireDocumentProperty],
  props: {
    document: {
      type: Object,
      required: true,
    },
    mapDocuments: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      stops: [],
      stopDocuments: [],
      showElevationProfile: false,
      elevationProfileHasData: false,
      selectedStop: null,
      selectedStopGroup: null,
      expandedLines: {},
      showAccessibilityInfo: false,
      missingTransportForWaypoint: false,
      expandedStopGroups: {},
    };
  },
  computed: {
    /** Copy access points to customize them */
    accessWaypoints() {
      if (!this.document.associations.waypoints || !Array.isArray(this.document.associations.waypoints)) {
        return [];
      }

      const accessPoints = this.document.associations.waypoints.filter((doc) => doc && doc.waypoint_type === 'access');
      const accessPointsCopy = JSON.parse(JSON.stringify(accessPoints));
      console.log(accessPoints);

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

    /** Each stop can have multiple lines */
    groupedStops() {
      return this.stops.reduce((acc, stop) => {
        if (!acc[stop.stoparea_name]) {
          acc[stop.stoparea_name] = [];
        }
        acc[stop.stoparea_name].push(stop);
        return acc;
      }, {});
    },

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
          this.$emit('stops-updated', this.stopDocuments);
        }
      },
      deep: true,
    },
  },
  methods: {
    /** Fetch access waypoints */
    processAccessWaypoints() {
      const accessWaypoints = this.accessWaypoints;

      if (accessWaypoints.length === 0) {
        this.stops = [];
        return;
      }

      this.fetchStopsForDocuments(accessWaypoints);
    },

    /** Retrieves the stops of each waypoint in the database */
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
          console.error('Error retrieving data :', error);
          this.missingTransportForWaypoint = true;

          documents.forEach((doc) => {
            doc.public_transportation_rating = 'no service';
          });
        });
    },

    /** Formats the distance to display in km */
    formattedDistance(distance) {
      return `${distance.toFixed(3).replace('.', ',')} km`;
    },

    /** Creates public transport stops near access type waypoints */
    createStopDocuments() {
      if (!this.stops || !this.stops.length) return;

      if (this.accessWaypoints.length === 0) return;

      this.stopDocuments = this.stops.reduce(
        (uniqueStops, stop) => {
          try {
            if (!stop.coordinates || !stop.coordinates.x || !stop.coordinates.y) {
              console.warn(`Stop ${stop.id} does not have valid coordinates:`, stop);
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
            console.error(`Error creating document for stop ${stop.id}:`, error);
            return uniqueStops;
          }
        },
        { docs: [], coordsMap: {} }
      ).docs;
    },

    /** Updates the map according to the selected stop */
    selectStopGroup(stopGroup) {
      this.selectedStopGroup = stopGroup;
      this.selectedStop = stopGroup[0];
      this.updateMap();
    },

    /** Zooms in and highlight a stop on the map */
    updateMap() {
      if (this.selectedStop && this.$refs.mapView) {
        this.$refs.mapView.highlightStop(this.selectedStop.id);
        this.$refs.mapView.goAndZoomOnStop(this.selectedStop.id);
      }
    },

    /** Finds which stop area corresponds to the stop clicked on the map */
    handleStopClicked(stopId) {
      this.selectedStop = this.stops.find((stop) => stop.id === stopId);
      this.selectedStopGroup = Object.values(this.groupedStops).find((group) =>
        group.some((stop) => stop.id === stopId)
      );
    },

    /** Displays a card in green if selected */
    isStopGroupSelected(stopGroup) {
      return (
        this.selectedStopGroup &&
        stopGroup.some((stop) => this.selectedStopGroup.some((selectedStop) => selectedStop.id === stop.id))
      );
    },

    /** Checks if a stoparea is expanded */
    isStopGroupExpanded(stopGroup) {
      const groupId = stopGroup[0].id;
      return this.expandedStopGroups[groupId] === true;
    },

    /** Shows details of a stoparea */
    seeLineDetails(stopGroup) {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
        return;
      }

      const groupId = stopGroup[0].id;
      this.$set(this.expandedStopGroups, groupId, !this.expandedStopGroups[groupId]);

      this.selectedStopGroup = stopGroup;
      this.selectedStop = stopGroup[0];

      this.$nextTick(() => {
        const refName = 'stopCard_' + groupId;
        if (this.$refs[refName] && this.$refs[refName][0]) {
          this.$refs[refName][0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    },

    /** Makes a special display for the highlight (hover) */
    handleDocumentHighlight(document) {
      if (document && document.isStopPoint) {
        console.log('yihou');
        const stopId = document.document_id;
        const stop = this.stops.find((s) => s.id === stopId);
        if (stop) {
          this.selectedStopGroup = Object.values(this.groupedStops).find((group) => group.some((s) => s.id === stopId));
          this.selectedStop = stop;

          if (this.$refs.mapView) {
            this.$refs.mapView.highlightStop(stopId);
          }

          this.$nextTick(() => {
            const refName = 'stopCard_' + stopId;
            const cardContainer = this.$refs.stopCardContainer;

            if (this.$refs[refName] && this.$refs[refName][0] && cardContainer) {
              const card = this.$refs[refName][0];

              const containerRect = cardContainer.getBoundingClientRect();
              const cardRect = card.getBoundingClientRect();

              const isCardAbove = cardRect.top < containerRect.top;
              const isCardBelow = cardRect.bottom > containerRect.bottom;

              if (isCardAbove || isCardBelow) {
                let newScrollTop;

                if (isCardAbove) {
                  newScrollTop = cardContainer.scrollTop + (cardRect.top - containerRect.top) - 10;
                } else {
                  newScrollTop = cardContainer.scrollTop + (cardRect.bottom - containerRect.bottom) + 10;
                }

                cardContainer.scrollTo({
                  top: newScrollTop,
                  behavior: 'smooth',
                });
              }
            }
          });
        }
      } else {
        this.selectedStopGroup = null;
        this.selectedStop = null;

        if (this.$refs.mapView) {
          if (!document) {
            this.$refs.mapView.resetStopStyles();
          }
        }
      }

      this.$emit('highlight-document', document);
    },
  },
};
</script>

<style scoped lang="scss">
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
        font-size: 1.1em;
        color: #2a2a2a;
        margin-bottom: 5px;

        .see-more-lines {
          margin-top: 10px;
          color: #337ab7;
          font-weight: bold;
        }
      }

      .stop-details {
        margin-top: 15px;
        padding-left: 10px;

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
    }
  }

  .public-transports-map {
    height: auto;
    width: 750px;
    border: 1px solid lightgray;
    border-radius: 4px;
  }
  .public-transport-no-result {
    display: flex;
    padding: 20px;
    border: 1px solid lightgray;
    border-radius: 4px;
    margin-top: 20px;
    gap: 30px;
    align-items: center;
    height: fit-content;

    .public-transports-no-result-bus {
      margin-left: 20px;
      width: 100px;
      height: 100px;
    }
  }
}

@media only screen and (max-width: 600px) {
  .public-transports-section {
    display: inline !important;

    .stop-cards {
      margin-bottom: 10px;
    }
    .public-transports-map {
      height: 275px !important;
      width: 319px !important;
      margin-left: auto;
      margin-right: auto;
    }
  }
  .missing-transports-warning {
    margin-top: 0px;
    margin-bottom: 10px;
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
