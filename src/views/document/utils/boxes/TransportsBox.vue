<template>
  <div
    v-if="accessWaypoint && isInFrance"
    class="box public-transports-box"
    :class="{ 'no-print': !showAccessibilityInfo }"
    id="public-transport"
  >
    <div class="hidden" id="public-transport-scroll"></div>
    <h2 class="title public-transports-box-title is-2" @click="visible = !visible">
      <span>{{ $gettext('Access by public transport') }}</span>
    </h2>
    <fa-icon
      class="is-size-6 no-print accordion-icon"
      icon="angle-down"
      @click="visible = !visible"
      :rotation="visible ? 180 : undefined"
    />
    <div :class="{ 'hide-box-content': !visible }">
      <div class="public-transport-buttons">
        <button
          v-if="showAccessibilityInfo"
          class="button is-primary public-transports-button"
          :class="{ 'is-active': activeSection === 'nearbyStops' }"
          @click="setActiveSection('nearbyStops')"
        >
          <img
            class="public-transports-bus default-icon"
            :src="require('@/assets/img/boxes/bus.svg')"
            alt="transport"
          />
          <img
            class="public-transports-bus hover-icon"
            :src="require('@/assets/img/boxes/public_transport.svg')"
            alt="transport"
          />
          {{ $gettext('Show nearby stops') }}
        </button>

        <button
          v-if="showAccessibilityInfo"
          class="button is-primary public-transports-button"
          :class="{ 'is-active': activeSection === 'planATrip' }"
          @click="setActiveSection('planATrip')"
        >
          <img
            class="public-transports-bus default-icon"
            :src="require('@/assets/img/boxes/itineraire-2.svg')"
            alt="itinerary"
          />
          <img
            class="public-transports-bus hover-icon"
            :src="require('@/assets/img/boxes/itineraire.svg')"
            alt="itinerary"
          />
          {{ $gettext('Plan a public transport trip') }}
        </button>
      </div>

      <nearby-stops-section
        v-if="activeSection === 'nearbyStops'"
        :document="document"
        :map-documents="mapDocuments"
        @highlight-document="handleDocumentHighlight"
        @has-protection-area="$emit('has-protection-area')"
        @stops-updated="handleStopsUpdated"
        @accessibility-info-changed="showAccessibilityInfo = $event"
      />

      <plan-a-trip-section
        v-if="activeSection === 'planATrip'"
        :map-documents="mapDocuments"
        :document="document"
        @highlight-document="handleDocumentHighlight"
        @has-protection-area="$emit('has-protection-area')"
      />
    </div>
  </div>
</template>

<script>
import NearbyStopsSection from './NearbyStopsSection.vue';
import PlanATripSection from './PlanATripSection.vue';

import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  components: {
    NearbyStopsSection,
    PlanATripSection,
  },
  mixins: [requireDocumentProperty],
  props: {
    document: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      activeSection: 'nearbyStops',
      accessWaypoint: false,
      stopDocuments: [],
      isInFrance: false,
      showAccessibilityInfo: false,
      visible: false,
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

    /** Adds custom points in document */
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
        this.checkAccessWaypoints();
        this.checkIfInFrance();
      },
      deep: true,
      immediate: true,
    },
    showAccessibilityInfo(newValue) {
      this.visible = newValue;
    },
  },
  methods: {
    /** Determines whether the "nearby stop" or "plan a trip" section is active */
    setActiveSection(section) {
      this.activeSection = section;
    },

    /** Checks if there are any waypoints accessible by public transport */
    checkAccessWaypoints() {
      const accessWaypoints = this.accessWaypoints;
      this.accessWaypoint = accessWaypoints.length > 0;
    },

    /** Emits an event for highlighting points */
    handleDocumentHighlight(document) {
      this.$emit('highlight-document', document);
    },

    /** Updates stops */
    handleStopsUpdated(stopDocuments) {
      this.stopDocuments = stopDocuments;
    },

    /** Check that the route is in France */
    checkIfInFrance() {
      try {
        this.isInFrance =
          this.document.areas && this.document.areas.length > 0 && this.document.areas[0].document_id === 14274;
      } catch (e) {
        this.isInFrance = false;
      }
    },
  },
};
</script>

<style scoped lang="scss">
.public-transports-box {
  position: relative;

  .hide-box-content {
    display: none;
  }

  .public-transports-box-title {
    cursor: pointer;
    margin-bottom: 0;
  }

  .accordion-icon {
    position: absolute;
    top: 0;
    right: 0;
    margin-right: 17px;
    height: 15px;
    margin-top: 25px !important;
    cursor: pointer;
  }

  .hidden {
    position: absolute;
    top: -100px;
  }
  .public-transport-buttons {
    display: flex;
    gap: 10px;
    margin-top: 24px;
    margin-bottom: 10px;
  }

  .public-transports-button {
    display: flex;
    background-color: white;
    color: black;
    font-weight: 500;
    border: 1px solid lightgray;
    position: relative;

    .public-transports-bus {
      width: 18px;
      height: 18px;
      margin-right: 8px;
      transition: opacity 0.2s ease;
    }

    .default-icon {
      opacity: 1;
    }
    .hover-icon {
      position: absolute;
      left: 12px; // Ajustez selon votre padding
      opacity: 0;
    }

    &:hover,
    &.is-active {
      .default-icon {
        opacity: 0;
      }
      .hover-icon {
        opacity: 1;
      }
    }

    &.is-active {
      background-color: #337ab7;
      border: none;
      color: white;
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
}
</style>
