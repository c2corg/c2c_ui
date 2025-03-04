<template>
  <div v-if="showAccessibilityInfo" class="box">
    <div class="accessible-transport">
      <img class="public-transports-bus" src="@/assets/img/boxes/public_transports.png" />
      <div class="info-content">
        <h3>Accessible en transport en commun</h3>
        <a href="#" class="plan-link">Planifier mon déplacement →</a>
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
      showAccessibilityInfo: false,
    };
  },
  computed: {},
  watch: {},
  mounted() {
    if (!this.document || !this.document.document_id) {
      console.warn('Aucun document ou ID trouvé !');
      return;
    }
    const waypointUrl = `http://localhost:6543/waypoints/${this.document.document_id}/isReachable`;
    fetch(waypointUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        this.showAccessibilityInfo = data === true;
      })
      .catch((error) => {
        console.error('Erreur lors de la récupération des données :', error);
      });
  },
  methods: {},
};
</script>

<style scoped lang="scss">
.accessible-transport {
  display: flex;
  align-items: center;
  background-color: #fff;
  gap: 10px;

  .public-transports-bus {
    width: 40px;
    height: 40px;
    margin-right: 8px;
    padding: 3px;
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
</style>
