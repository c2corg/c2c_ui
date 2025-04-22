<template>
  <div class="public-transports-section">
    <div class="public-transports-result">
      <div class="stop-cards" ref="stopCardContainer">
        <div
          v-for="(stopGroup, stopName) in groupedStops"
          :key="stopName"
          class="stop-card"
          :ref="'stopCard_' + stopGroup[0].id"
          :class="{ 'selected-stop': isStopGroupSelected(stopGroup) }"
          @mouseover="$emit('select-stop-group', stopGroup)"
          @click="$emit('see-line-details', stopGroup)"
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

    <div class="public-transports-map">
      <map-view
        ref="mapView"
        :documents="mapDocuments"
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
export default {
  name: 'NearbyStopsSection',
  props: {
    stops: {
      type: Array,
      required: true,
    },
    groupedStops: {
      type: Object,
      required: true,
    },
    missingTransportForWaypoint: {
      type: Boolean,
      default: false,
    },
    mapDocuments: {
      type: Array,
      required: true,
    },
    document: {
      type: Array,
      required: true,
    },
    selectedStop: {
      type: Object,
      default: null,
    },
    selectedStopGroup: {
      type: Array,
      default: null,
    },
    expandedStopGroups: {
      type: Object,
      default: () => ({}),
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
  methods: {
    isStopGroupSelected(stopGroup) {
      return (
        this.selectedStopGroup &&
        stopGroup.some((stop) => this.selectedStopGroup.some((selectedStop) => selectedStop.id === stop.id))
      );
    },

    isStopGroupExpanded(stopGroup) {
      const groupId = stopGroup[0].id;
      return this.expandedStopGroups[groupId] === true;
    },

    handleStopClicked(stopId) {
      this.$emit('stop-clicked', stopId);
    },

    handleDocumentHighlight(document) {
      this.$emit('highlight-document', document);

      if (document && document.isStopPoint) {
        const stopId = document.document_id;

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
    },

    updateMap() {
      if (this.selectedStop && this.$refs.mapView) {
        this.$refs.mapView.highlightStop(this.selectedStop.id);
        this.$refs.mapView.goAndZoomOnStop(this.selectedStop.id);
      }
    },
  },
  watch: {
    selectedStop: {
      handler() {
        this.updateMap();
      },
      immediate: true,
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
}
</style>
