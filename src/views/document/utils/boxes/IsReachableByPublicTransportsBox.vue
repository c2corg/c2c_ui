<template>
  <div v-if="showAccessibilityInfo" class="box accessible-transport-box">
    <div class="accessible-transport">
      <img class="public-transports-bus" src="@/assets/img/boxes/public_transport.svg" />
      <div class="info-content">
        <h3>Accessible en transport en commun</h3>
        <a href="#public-transport" class="plan-link">Planifier mon déplacement →</a>
      </div>
    </div>
  </div>
</template>

<script>
import { requireDocumentProperty } from '@/js/properties-mixins';
import transportService from '@/js/apis/transport-service';

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
    accessWaypoints() {
      // Si c'est un tableau, filtrer les documents de type access
      if (Array.isArray(this.document)) {
        return this.document.filter((doc) => doc && doc.waypoint_type === 'access');
      }
      // Si c'est un objet unique et qu'il est de type access, le retourner dans un tableau
      else if (this.document && this.document.waypoint_type === 'access') {
        return [this.document];
      }
      // Sinon, retourner un tableau vide
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
    checkAccessibility() {
      const accessWaypoints = this.accessWaypoints;

      if (accessWaypoints.length === 0) {
        this.showAccessibilityInfo = false;
        return;
      }

      // Vérifier chaque waypoint d'accès jusqu'à ce qu'on en trouve un accessible
      this.checkWaypointsReachability(accessWaypoints);
    },
    checkWaypointsReachability(waypoints) {
      if (!waypoints || waypoints.length === 0) {
        this.showAccessibilityInfo = false;
        return;
      }

      // Récupérer les IDs des waypoints
      const waypointIds = waypoints.map((wp) => wp.document_id).filter(Boolean);

      if (waypointIds.length === 0) {
        this.showAccessibilityInfo = false;
        return;
      }

      // Vérifier s'ils sont accessibles en utilisant un service qui peut prendre un tableau d'IDs
      // Si le service existant ne prend qu'un seul ID, on peut implémenter une vérification séquentielle
      this.checkMultipleWaypointsReachability(waypointIds);
    },
    checkMultipleWaypointsReachability(waypointIds) {
      const checkNextWaypoint = (index) => {
        if (index >= waypointIds.length) {
          // Si on a vérifié tous les waypoints sans en trouver un accessible
          this.showAccessibilityInfo = false;
          return;
        }

        transportService
          .isReachable(waypointIds[index])
          .then((isReachable) => {
            if (isReachable === true) {
              // Dès qu'on trouve un waypoint accessible, on arrête la recherche
              this.showAccessibilityInfo = true;
            } else {
              // Sinon, on vérifie le prochain waypoint
              checkNextWaypoint(index + 1);
            }
          })
          .catch((error) => {
            console.error(
              `Erreur lors de la vérification de l'accessibilité pour le waypoint ${waypointIds[index]} :`,
              error
            );
            // On continue avec le prochain waypoint malgré l'erreur
            checkNextWaypoint(index + 1);
          });
      };

      // Démarrer la vérification avec le premier waypoint
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
        text-decoration: none;
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
