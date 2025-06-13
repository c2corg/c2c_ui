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
        <img class="public-transports-bus default-icon" :src="require('@/assets/img/boxes/bus.svg')" />
        <img class="public-transports-bus hover-icon" :src="require('@/assets/img/boxes/public_transport.svg')" />
        {{ $gettext('Show nearby stops') }}
      </button>

      <button
        v-if="hasSecondSection"
        class="button is-primary public-transports-button"
        :class="{ 'is-active': activeSection === 'planATrip' }"
        @click="setActiveSection('planATrip')"
      >
        <img class="public-transports-bus default-icon" :src="require('@/assets/img/boxes/itineraire-2.svg')" />
        <img class="public-transports-bus hover-icon" :src="require('@/assets/img/boxes/itineraire.svg')" />
        {{ $gettext('Plan a public transport trip') }}
      </button>
    </div>

    <!-- Section pour les arrêts proches -->
    <nearby-stops-section
      v-if="activeSection === 'nearbyStops'"
      :document="document"
      :map-documents="mapDocuments"
      @highlight-document="handleDocumentHighlight"
      @has-protection-area="$emit('has-protection-area')"
      @stops-updated="handleStopsUpdated"
    />

    <!-- Section pour planifier un trajet -->
    <plan-a-trip-section
      v-if="activeSection === 'planATrip'"
      :map-documents="mapDocuments"
      :document="document"
      @highlight-document="handleDocumentHighlight"
      @has-protection-area="$emit('has-protection-area')"
    />
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
      hasSecondSection: true, // Vous pouvez ajuster cette logique selon vos besoins
      accessWaypoint: false,
      stopDocuments: [],
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
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    setActiveSection(section) {
      this.activeSection = section;
    },
    checkAccessWaypoints() {
      const accessWaypoints = this.accessWaypoints;
      this.accessWaypoint = accessWaypoints.length > 0;
    },
    handleDocumentHighlight(document) {
      // Gérer la mise en évidence des documents
      // Cette méthode peut être étendue selon vos besoins
      this.$emit('highlight-document', document);
    },
    handleStopsUpdated(stopDocuments) {
      this.stopDocuments = stopDocuments;
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
