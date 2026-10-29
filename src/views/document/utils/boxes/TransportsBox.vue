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
          @click="activeSection = 'nearbyStops'"
        >
          <img class="public-transports-bus default-icon" src="@/assets/img/boxes/bus.svg" alt="transport" />
          <img class="public-transports-bus hover-icon" src="@/assets/img/boxes/public_transport.svg" alt="transport" />
          {{ $gettext('Show nearby stops') }}
        </button>

        <button
          v-if="showAccessibilityInfo && isPlanATripSectionDisplayed"
          class="button is-primary public-transports-button"
          :class="{ 'is-active': activeSection === 'planATrip' }"
          @click="activeSection = 'planATrip'"
        >
          <img class="public-transports-bus default-icon" src="@/assets/img/boxes/itineraire-2.svg" alt="itinerary" />
          <img class="public-transports-bus hover-icon" src="@/assets/img/boxes/itineraire.svg" alt="itinerary" />
          {{ $gettext('Plan a public transport trip') }}
        </button>
      </div>

      <nearby-stops-section
        v-if="activeSection === 'nearbyStops'"
        :document="document"
        :map-documents="mapDocuments"
        @highlight-document="$emit('highlight-document', $event)"
        @has-protection-area="$emit('has-protection-area')"
        @stops-updated="stopDocuments = $event"
        @accessibility-info-changed="showAccessibilityInfo = $event"
      />

      <plan-a-trip-section
        v-if="activeSection === 'planATrip'"
        :map-documents="mapDocuments"
        :document="document"
        @highlight-document="$emit('highlight-document', $event)"
        @has-protection-area="$emit('has-protection-area')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import NearbyStopsSection from './NearbyStopsSection.vue';
import PlanATripSection from './PlanATripSection/PlanATripSection.vue';

import { documentProperty, useDocumentType } from '@/js/properties';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const props = defineProps({ ...documentProperty });

defineEmits(['has-protection-area', 'highlight-document']);

const { documentType } = useDocumentType(props);

// whether the "nearby stop" or "plan a trip" section is active
const activeSection = ref('nearbyStops');
const stopDocuments = ref<C2cDocument[]>([]);
const showAccessibilityInfo = ref(false);
const visible = ref(false);

/** Copy access points to customize them */
const accessWaypoints = computed(() => {
  let accessWaypoints: C2cDocument[] = [];
  if (documentType.value === 'waypoint' && props.document.waypoint_type === 'access') {
    // access waypoint
    accessWaypoints = [props.document];
  }
  // for other types of documents, return the waypoints of type access associated (if any)
  else {
    accessWaypoints =
      props.document?.associations?.waypoints?.filter((doc) => doc && doc.waypoint_type === 'access') ?? [];
  }

  const accessPointsCopy: C2cDocument[] = JSON.parse(JSON.stringify(accessWaypoints));

  accessPointsCopy.forEach((doc) => {
    if (doc.type === 'w') {
      doc.type = 'z';
    }

    if (doc.maps && Array.isArray(doc.maps)) {
      doc.maps.forEach((map: C2cDocument) => {
        if (map.type === 'w') {
          map.type = 'z';
        }
      });
    }
  });

  return accessPointsCopy;
});

/** Whether there are any waypoints accessible by public transport */
const accessWaypoint = computed(() => accessWaypoints.value.length > 0);

/** Whether the route is in France */
const isInFrance = computed(() => props.document.areas?.[0]?.document_id === 14274);

const isPlanATripSectionDisplayed = computed(
  // plan a trip section is only available for routes and waypoints of type access
  () =>
    documentType.value === 'route' || (documentType.value === 'waypoint' && props.document.waypoint_type === 'access')
);

/** Adds custom points in document */
const mapDocuments = computed(() => {
  if (!accessWaypoints.value || accessWaypoints.value.length === 0) {
    return [];
  }
  const documents = [...accessWaypoints.value];

  if (stopDocuments.value && stopDocuments.value.length > 0) {
    documents.push(...stopDocuments.value);
  }

  return documents.filter(Boolean);
});

watch(showAccessibilityInfo, (value) => {
  visible.value = value;
});
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
