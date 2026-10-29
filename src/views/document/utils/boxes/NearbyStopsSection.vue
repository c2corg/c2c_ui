<template>
  <div class="public-transports-section" :class="{ 'public-transports-section-not-served': !showAccessibilityInfo }">
    <div v-if="showAccessibilityInfo" class="public-transports-result">
      <div class="stop-cards" ref="stopCardContainer">
        <div
          v-for="(stopGroup, stopName) in groupedStops"
          :key="stopName"
          class="stop-card"
          :ref="(card) => setStopCard(stopGroup, card)"
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
      <div class="missing-transports-warning" v-if="missingTransportForWaypoint && documentType === 'route'">
        <p class="missing-transports-warning-exclamation">!</p>
        <div>
          <strong>{{ $gettext('This route is partially accessible by public transport.') }}</strong>
          <p>
            {{ $gettext('At least one access point in the route do not have a public transport stop within 5km.') }}
          </p>
        </div>
      </div>

      <div class="missing-transports-information" v-if="missingTransportForWaypoint && documentType !== 'route'">
        <div>
          <strong class="missing-transports-information-text">{{
            $gettext('This waypoint is partially accessible by public transport.')
          }}</strong>
          <p>
            {{ $gettext('At least one access point in the waypoint do not have a public transport stop within 5km.') }}
          </p>
        </div>
      </div>
    </div>

    <div v-if="!showAccessibilityInfo" class="public-transport-no-result">
      <img class="public-transports-no-result-bus" src="@/assets/img/boxes/transport_not_found.svg" alt="not found" />
      <div class="public-transport-no-result-text">
        <strong>{{ $gettext('Unfortunately, this route may not be deserved by public transport') }}</strong>
        <p>
          {{
            $gettext(
              'We did not find any public transport stop point in a 5 km foot range from any route access point.'
            )
          }}
        </p>
      </div>
    </div>

    <div class="public-transports-map" v-if="showAccessibilityInfo">
      <map-view
        ref="olMap"
        :documents="filteredDocuments"
        :show-protection-areas="!!document.type && ['r', 'w'].includes(document.type)"
        :biodiv-sports-activities="document.activities"
        @has-protection-area="$emit('has-protection-area')"
        @stop-clicked="handleStopClicked"
        @highlight-document="handleDocumentHighlight"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch, type ComponentPublicInstance, type PropType } from 'vue';

import type OlMap from '@/components/map/OlMap.vue';
import transportService from '@/js/apis/transport-service';
import { documentProperty, useDocumentType } from '@/js/properties';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

type Stop = {
  id: number;
  stoparea_name: string;
  line?: string;
  operator?: string;
  distance: number;
  coordinates?: { x: number; y: number };
};
// a document copy, shown on the map
type MapDocument = C2cDocument & Record<string, any>;

const props = defineProps({
  ...documentProperty,
  mapDocuments: {
    type: Array as PropType<MapDocument[]>,
    default: () => [],
  },
});

const emit = defineEmits(['accessibility-info-changed', 'has-protection-area', 'highlight-document', 'stops-updated']);

const { documentType } = useDocumentType(props);

const olMap = useTemplateRef<InstanceType<typeof OlMap>>('olMap');
const stopCardContainer = useTemplateRef<HTMLElement>('stopCardContainer');
// the card of each stop group, by the id of its first stop
const stopCards: Record<number, Element> = {};

const stops = ref<Stop[]>([]);
const stopDocuments = ref<MapDocument[]>([]);
const selectedStop = ref<Stop | null>(null);
const selectedStopGroup = ref<Stop[] | null>(null);
const showAccessibilityInfo = ref(false);
const missingTransportForWaypoint = ref(false);
const expandedStopGroups = ref<Record<number, boolean>>({});

/** Copy access points to customize them */
const accessWaypoints = computed<MapDocument[]>(() => {
  let accessWaypoints: MapDocument[] = [];
  if (documentType.value === 'waypoint' && props.document.waypoint_type === 'access') {
    // access waypoint
    accessWaypoints = [props.document];
  }
  // for other types of documents, return the waypoints of type access associated (if any)
  else {
    accessWaypoints =
      props.document?.associations?.waypoints?.filter((doc: MapDocument) => doc && doc.waypoint_type === 'access') ??
      [];
  }

  const accessPointsCopy: MapDocument[] = JSON.parse(JSON.stringify(accessWaypoints));

  accessPointsCopy.forEach((doc) => {
    if (doc.type === 'w') {
      doc.type = 'z';
    }

    if (doc.maps && Array.isArray(doc.maps)) {
      doc.maps.forEach((map: { type?: string }) => {
        if (map.type === 'w') {
          map.type = 'z';
        }
      });
    }
  });

  return accessPointsCopy;
});

/** Each stop can have multiple lines */
const groupedStops = computed(() => {
  return stops.value.reduce(
    (acc, stop) => {
      if (!acc[stop.stoparea_name]) {
        acc[stop.stoparea_name] = [];
      }
      acc[stop.stoparea_name].push(stop);
      return acc;
    },
    {} as Record<string, Stop[]>
  );
});

const filteredDocuments = computed(() => {
  const filteredWaypoints =
    props.document.associations?.waypoints?.filter((waypoint: MapDocument) => waypoint.waypoint_type !== 'access') ||
    [];

  const mainDocument = {
    ...props.document,
    associations: {
      ...props.document.associations,
      waypoints: filteredWaypoints,
    },
  };

  return props.mapDocuments.concat([mainDocument]);
});

watch(
  () => props.document,
  () => {
    processAccessWaypoints();
  },
  { deep: true, immediate: true }
);
watch(
  stops,
  (newStops) => {
    if (newStops && newStops.length > 0) {
      createStopDocuments();
      emit('stops-updated', stopDocuments.value);
    }
  },
  { deep: true }
);
watch(showAccessibilityInfo, (newVal) => {
  emit('accessibility-info-changed', newVal);
});

function setStopCard(stopGroup: Stop[], card: Element | ComponentPublicInstance | null) {
  if (card) {
    stopCards[stopGroup[0].id] = card as Element;
  } else {
    delete stopCards[stopGroup[0].id];
  }
}

/** Fetch access waypoints */
function processAccessWaypoints() {
  if (accessWaypoints.value.length === 0) {
    stops.value = [];
    return;
  }

  fetchStopsForDocuments(accessWaypoints.value);
}

/** Retrieves the stops of each waypoint in the database */
function fetchStopsForDocuments(documents: MapDocument[]) {
  transportService
    .getStopareasForDocuments(documents)
    .then((result) => {
      documents.forEach((doc) => {
        if (!result.documentResults[doc.document_id!]) {
          doc.public_transportation_rating = 'no service';
        } else {
          doc.public_transportation_rating = 'service available';
        }
      });

      stops.value = (result.stopareas as unknown as Stop[]).sort((a, b) => a.distance - b.distance);
      missingTransportForWaypoint.value = result.missingTransportForWaypoint;
      showAccessibilityInfo.value = stops.value.length > 0;
      createStopDocuments();
    })
    .catch((error) => {
      console.error('Error retrieving data :', error);
      missingTransportForWaypoint.value = true;

      documents.forEach((doc) => {
        doc.public_transportation_rating = 'no service';
      });
    });
}

/** Creates public transport stops near access type waypoints */
function createStopDocuments() {
  if (!stops.value || !stops.value.length) return;

  if (accessWaypoints.value.length === 0) return;

  stopDocuments.value = stops.value.reduce(
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

        const stopDoc: MapDocument = JSON.parse(JSON.stringify(accessWaypoints.value[0]));
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
    { docs: [] as MapDocument[], coordsMap: {} as Record<string, boolean> }
  ).docs;
}

/** Updates the map according to the selected stop */
function selectStopGroup(stopGroup: Stop[]) {
  selectedStopGroup.value = stopGroup;
  selectedStop.value = stopGroup[0];
  updateMap();
}

/** Zooms in and highlight a stop on the map */
function updateMap() {
  if (selectedStop.value && olMap.value) {
    olMap.value.highlightStop(selectedStop.value.id);
    olMap.value.goAndZoomOnStop(selectedStop.value.id);
  }
}

/** Finds which stop area corresponds to the stop clicked on the map */
function handleStopClicked(stopId: number) {
  selectedStop.value = stops.value.find((stop) => stop.id === stopId) ?? null;
  selectedStopGroup.value =
    Object.values(groupedStops.value).find((group) => group.some((stop) => stop.id === stopId)) ?? null;
}

/** Displays a card in green if selected */
function isStopGroupSelected(stopGroup: Stop[]) {
  return (
    !!selectedStopGroup.value &&
    stopGroup.some((stop) => selectedStopGroup.value!.some((selectedStop) => selectedStop.id === stop.id))
  );
}

/** Checks if a stoparea is expanded */
function isStopGroupExpanded(stopGroup: Stop[]) {
  const groupId = stopGroup[0].id;
  return expandedStopGroups.value[groupId] === true;
}

/** Shows details of a stoparea */
function seeLineDetails(stopGroup: Stop[]) {
  const selection = window.getSelection();
  if (selection && selection.toString().length > 0) {
    return;
  }

  const groupId = stopGroup[0].id;
  expandedStopGroups.value[groupId] = !expandedStopGroups.value[groupId];

  selectedStopGroup.value = stopGroup;
  selectedStop.value = stopGroup[0];

  nextTick(() => {
    stopCards[groupId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

/** Makes a special display for the highlight (hover) */
function handleDocumentHighlight(document: MapDocument | null) {
  if (document && document.isStopPoint) {
    const stopId = document.document_id!;
    const stop = stops.value.find((s) => s.id === stopId);
    if (stop) {
      const stopGroup = Object.values(groupedStops.value).find((group) => group.some((s) => s.id === stopId))!;
      selectedStopGroup.value = stopGroup;
      selectedStop.value = stop;

      if (olMap.value) {
        olMap.value.highlightStop(stopId);
      }

      nextTick(() => {
        // cards are found by the first stop of their group, which may not be the stop highlighted
        const card = stopCards[stopGroup[0].id];
        const cardContainer = stopCardContainer.value;

        if (card && cardContainer) {
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
    selectedStopGroup.value = null;
    selectedStop.value = null;

    if (olMap.value) {
      if (!document) {
        olMap.value.resetStopStyles();
      }
    }
  }

  emit('highlight-document', document);
}
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

    .missing-transports-information {
      display: flex;
      padding: 10px;
      border: 1px solid #4797d8;
      border-radius: 4px;
      margin-top: 25px;
      gap: 10px;
      align-items: center;
      background-color: #3e8ed0;
      color: white;
      .missing-transports-information-text {
        color: white;
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
    gap: 30px;
    align-items: center;
    height: fit-content;
    width: 100%;

    .public-transports-no-result-bus {
      margin-left: 20px;
      width: 100px;
      height: 100px;
    }
  }
}

.public-transports-section-not-served {
  height: auto;
  margin-top: 0;
}

@media only screen and (max-width: 600px) {
  .public-transports-section {
    display: inline !important;

    .stop-cards {
      margin-bottom: 10px;
    }
    .public-transports-map {
      height: 275px !important;
      width: auto !important;
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
