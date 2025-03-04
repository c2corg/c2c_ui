<template>
  <div class="box public-transports-box">
    <h2 class="title is-2">
      <span>{{ $gettext('Access by public transport') }}</span>
    </h2>
    <button class="button is-primary public-transports-button">
      <img class="public-transports-bus" src="@/assets/img/boxes/public_transports.png" />
      {{ $gettext('Show nearby stops') }}
    </button>
    <div class="public-transports-section">
      <div class="public-transports-result">
        <p class="public-transports-subtitle">
          {{ $gettext('Public transport stops nearby (less than 5km)') }}
        </p>
        <div class="stop-cards">
          <div
            v-for="stop in stops"
            :key="stop.id"
            class="stop-card"
            :class="{ 'selected-stop': selectedStop && selectedStop.id === stop.id }"
            @click="selectStop(stop)"
          >
            <div class="stop-header">
              <strong>{{ $gettext('Stop') }} :</strong> {{ stop.stop_name }}
            </div>
            <div>
              <strong>{{ $gettext('Line') }} :</strong> {{ stop.line }}
            </div>
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
  </div>
</template>

<script>
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  mixins: [requireDocumentProperty],
  props: {
    document: Object,
  },
  data() {
    return {
      stops: [],
      stopDocuments: [],
      showElevationProfile: false,
      elevationProfileHasData: false,
      testDocument: null,
      selectedStop: null,
    };
  },
  computed: {
    mapDocuments() {
      if (!this.document) {
        return [];
      }
      const documents = [this.document];
      if (this.testDocument) {
        documents.push(this.testDocument);
      }
      if (this.stopDocuments && this.stopDocuments.length > 0) {
        documents.push(...this.stopDocuments);
      }
      return documents.filter(Boolean);
    },
  },
  watch: {
    document: {
      handler(newVal) {
        if (newVal) {
          this.testDocument = this.createTestDocument();
        }
      },
      deep: true,
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
  mounted() {
    if (!this.document || !this.document.document_id) {
      console.warn('Aucun document ou ID trouvé !');
      return;
    }
    const waypointUrl = `http://localhost:6543/waypoints/${this.document.document_id}/stops`;
    fetch(waypointUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        this.stops = data.stops.map((stop) => ({
          ...stop,
          distance: stop.distance ?? 0,
        }));
        this.createStopDocuments();
      })
      .catch((error) => {
        console.error('Erreur lors de la récupération des données :', error);
      });
  },
  methods: {
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
            const stopDoc = JSON.parse(JSON.stringify(this.document));
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
    createTestDocument() {
      if (!this.document) {
        return null;
      }
      try {
        const test = JSON.parse(JSON.stringify(this.document));
        test.document_id = this.document.document_id + 1;
        if (test.locales && test.locales.length > 0) {
          test.locales[0].title = 'Point de test (30m)';
        }
        if (test.geometry && test.geometry.geom) {
          const geom = JSON.parse(test.geometry.geom);
          if (geom.coordinates && geom.coordinates.length >= 2) {
            geom.coordinates[0] += 150;
            geom.coordinates[1] += 150;
            test.geometry.geom = JSON.stringify(geom);
          }
        }
        return test;
      } catch (error) {
        console.error('Erreur lors de la création du document test:', error);
        return null;
      }
    },
    selectStop(stop) {
      this.selectedStop = stop;
      this.updateMap();
    },
    updateMap() {
      if (this.selectedStop && this.$refs.mapView) {
        this.$refs.mapView.highlightStop(this.selectedStop.id);
      }
    },
    handleStopClicked(stopId) {
      this.selectedStop = this.stops.find((stop) => stop.id === stopId);
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
}
</style>
