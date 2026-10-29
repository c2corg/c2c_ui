<template>
  <div v-if="showAccessibilityInfo" class="box accessible-transport-box">
    <a href="#public-transport-scroll">
      <div class="accessible-transport">
        <img class="public-transports-bus" src="@/assets/img/boxes/public_transport.svg" />
        <div class="info-content">
          <h3>{{ $gettext('Accessible by public transport') }}</h3>
          <p class="plan-link">{{ $gettext('Plan my trip →') }}</p>
        </div>
      </div>
    </a>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import transportService from '@/js/apis/transport-service';
import { documentProperty, useDocumentType } from '@/js/properties';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const props = defineProps({ ...documentProperty });

const { documentType } = useDocumentType(props);

const showAccessibilityInfo = ref(false);

/** Returns only access points */
const accessWaypoints = computed<C2cDocument[]>(() => {
  if (documentType.value === 'waypoint' && props.document.waypoint_type === 'access') {
    // access waypoint
    return [props.document];
  } else {
    // for other types of documents, return the waypoints of type access associated (if any)
    return props.document?.associations?.waypoints?.filter((doc) => doc && doc.waypoint_type === 'access') ?? [];
  }
});

/** Returns true if at least one of the waypoints is served */
function checkAccessibility() {
  if (accessWaypoints.value.length === 0) {
    showAccessibilityInfo.value = false;
    return;
  }

  checkWaypointsReachability(accessWaypoints.value);
}

/** For all waypoints, looks at which ones are served */
function checkWaypointsReachability(waypoints: C2cDocument[]) {
  if (!waypoints || waypoints.length === 0) {
    showAccessibilityInfo.value = false;
    return;
  }

  const waypointIds = waypoints.map((wp) => wp.document_id).filter((id): id is number => Boolean(id));

  if (waypointIds.length === 0) {
    showAccessibilityInfo.value = false;
    return;
  }

  checkMultipleWaypointsReachability(waypointIds);
}

/** Calls the backend service to check if waypoints have associated transports */
function checkMultipleWaypointsReachability(waypointIds: number[]) {
  const checkNextWaypoint = (index: number) => {
    if (index >= waypointIds.length) {
      showAccessibilityInfo.value = false;
      return;
    }

    transportService
      .isReachable(waypointIds[index])
      .then((isReachable) => {
        if (isReachable === true) {
          showAccessibilityInfo.value = true;
        } else {
          checkNextWaypoint(index + 1);
        }
      })
      .catch((error) => {
        console.error(
          `Erreur lors de la vérification de l'accessibilité pour le waypoint ${waypointIds[index]} :`,
          error
        );
        checkNextWaypoint(index + 1);
      });
  };

  checkNextWaypoint(0);
}

watch(() => props.document, checkAccessibility, { deep: true, immediate: true });
</script>

<style scoped lang="scss">
.accessible-transport-box {
  border: 3px solid #4baf50;
  border-radius: 2px;
  .accessible-transport {
    display: flex;
    align-items: center;
    background-color: #fff;
    gap: 10px;

    .public-transports-bus {
      width: 40px;
      height: 40px;
      margin-right: 8px;
      padding: 8px;
      background-color: #4baf50;
      border-radius: 4px;
    }

    .info-content {
      h3 {
        font-size: 15px;
        color: #333;
        margin: 0 0 0px 0;
        font-weight: bold;
      }

      .plan-link {
        color: #4a8fd6;
        font-size: 15px;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
}
:global(html) {
  scroll-behavior: smooth;
}
</style>
