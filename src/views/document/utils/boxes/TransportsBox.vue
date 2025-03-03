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
        <h3 class="title is-3">
          {{ $gettext('Public transport stops nearby (less than 5km)') }}
        </h3>
        <div v-for="stop in stops" :key="stop.id" class="stop-card">
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
      stopDocuments: [], // Tableaux pour stocker les documents des stops
      showElevationProfile: false,
      elevationProfileHasData: false,
      testDocument: null,
    };
  },
  computed: {
    // Propriété calculée qui combine document principal et stops
    mapDocuments() {
      if (!this.document) {
        return [];
      }

      // Tous les documents à afficher: document principal + test + stops
      const documents = [this.document];

      // Ajouter le document test si disponible
      if (this.testDocument) {
        documents.push(this.testDocument);
      }

      // Ajouter tous les documents de stops
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
          console.log('Document test créé après mise à jour :', this.testDocument);
        }
      },
      deep: true,
    },

    // Observer les changements des stops pour mettre à jour les documents
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
    console.log('Document reçu dans transports-box :', this.document);

    if (!this.document || !this.document.document_id) {
      console.warn('Aucun document ou ID trouvé !');
      return;
    }

    // Récupérer les stops depuis l'API
    const waypointUrl = `http://localhost:6543/waypoints/${this.document.document_id}/stops`;

    fetch(waypointUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Données récupérées depuis l'API :", data);
        this.stops = data.stops.map((stop) => ({
          ...stop,
          distance: stop.distance ?? 0,
        }));

        // Créer les documents pour les stops
        this.createStopDocuments();
      })
      .catch((error) => {
        console.error('Erreur lors de la récupération des données :', error);
      });
  },
  methods: {
    formattedDistance(distance) {
      return `${distance.toFixed(3)} km`;
    },

    // Méthode pour créer les documents des stops
    createStopDocuments() {
      if (!this.stops || !this.stops.length) return;

      this.stopDocuments = this.stops
        .map((stop) => {
          try {
            // Vérifier que les coordonnées sont disponibles
            if (!stop.coordinates || !stop.coordinates.x || !stop.coordinates.y) {
              console.warn(`Stop ${stop.id} n'a pas de coordonnées valides:`, stop);
              return null;
            }

            // Créer un document basé sur le modèle du document principal
            const stopDoc = JSON.parse(JSON.stringify(this.document));

            // Mettre à jour l'ID et le titre
            stopDoc.document_id = stop.id;

            if (stopDoc.locales && stopDoc.locales.length > 0) {
              stopDoc.locales[0].title = `${stop.stop_name} (${stop.line})`;
            }

            // Modifier la géométrie avec les coordonnées du stop
            if (stopDoc.geometry) {
              const geom = {
                type: 'Point',
                coordinates: [stop.coordinates.x, stop.coordinates.y],
              };
              stopDoc.geometry.geom = JSON.stringify(geom);
            }

            // Ajouter des propriétés spécifiques aux stops pour différencier l'affichage si nécessaire
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
        .filter(Boolean); // Filtrer les valeurs null

      console.log('Documents pour les stops créés:', this.stopDocuments);
    },

    // Méthode pour créer une copie du document avec des coordonnées décalées
    createTestDocument() {
      // Vérifier que document est défini
      if (!this.document) {
        return null;
      }

      try {
        // Copie profonde de l'objet document
        const test = JSON.parse(JSON.stringify(this.document));

        // Modifions l'ID pour éviter toute confusion
        test.document_id = this.document.document_id + 1;

        // Modifions le titre pour identifier facilement ce point test
        if (test.locales && test.locales.length > 0) {
          test.locales[0].title = 'Point de test (30m)';
        }

        // Modification des coordonnées - décalage d'environ 30 mètres
        if (test.geometry && test.geometry.geom) {
          const geom = JSON.parse(test.geometry.geom);
          if (geom.coordinates && geom.coordinates.length >= 2) {
            // Décalage de 150 mètres vers l'est et le nord
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

    .public-transports-result {
      margin-top: 20px;

      .stop-card {
        border: 2px solid lightgray;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 10px;
        background: white;

        .stop-header {
          font-weight: bold;
          font-size: 1.1em;
          color: #2a2a2a;
          margin-bottom: 5px;
        }
      }
    }

    .public-transports-map {
      width: 100%;
      height: 400px;
      border: 1px solid lightgray;
      border-radius: 4px;
    }
  }
}
</style>
