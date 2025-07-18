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

<script>
import transportService from '@/js/apis/transport-service';
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  mixins: [requireDocumentProperty],
  props: {
    document: {
      type: [Object, Array],
      required: true,
    },
  },
  data() {
    return {
      showAccessibilityInfo: false,
    };
  },
  computed: {
    /** Returns only access points */
    accessWaypoints() {
      if (Array.isArray(this.document)) {
        return this.document.filter((doc) => doc && doc.waypoint_type === 'access');
      } else if (this.document && this.document.waypoint_type === 'access') {
        return [this.document];
      }
      return [];
    },
  },
  watch: {
    document: {
      handler() {
        this.checkAccessibility();
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    /** Returns true if at least one of the waypoints is served */
    checkAccessibility() {
      const accessWaypoints = this.accessWaypoints;

      if (accessWaypoints.length === 0) {
        this.showAccessibilityInfo = false;
        return;
      }

      this.checkWaypointsReachability(accessWaypoints);
    },

    /** For all waypoints, looks at which ones are served */
    checkWaypointsReachability(waypoints) {
      if (!waypoints || waypoints.length === 0) {
        this.showAccessibilityInfo = false;
        return;
      }

      const waypointIds = waypoints.map((wp) => wp.document_id).filter(Boolean);

      if (waypointIds.length === 0) {
        this.showAccessibilityInfo = false;
        return;
      }

      this.checkMultipleWaypointsReachability(waypointIds);
    },

    /** Calls the backend service to check if waypoints have associated transports */
    checkMultipleWaypointsReachability(waypointIds) {
      const checkNextWaypoint = (index) => {
        if (index >= waypointIds.length) {
          this.showAccessibilityInfo = false;
          return;
        }

        transportService
          .isReachable(waypointIds[index])
          .then((isReachable) => {
            if (isReachable === true) {
              this.showAccessibilityInfo = true;
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
    },
  },
};
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
