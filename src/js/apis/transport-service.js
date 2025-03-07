import axios from 'axios';
import config from '@/js/config';

function TransportService() {
  this.axios = axios.create({
    baseURL: config.urls.api,
  });
}

/**
 * Récupère les arrêts de transport en commun pour un waypoint donné
 *
 * @param {string | number} waypointId - L'identifiant du waypoint
 * @returns {Promise} Promesse contenant les données des arrêts
 */
TransportService.prototype.getStopareas = function (waypointId) {
  return this.axios.get(`/waypoints/${waypointId}/stopareas`);
};

/**
 * Vérifie si un waypoint est accessible en transport en commun
 *
 * @param {string | number} waypointId - L'identifiant du waypoint
 * @returns {Promise<boolean>} Promesse contenant un booléen indiquant l'accessibilité
 */
TransportService.prototype.isReachable = function (waypointId) {
  return this.axios.get(`/waypoints/${waypointId}/isReachable`).then((response) => response.data);
};

/**
 * Récupère les arrêts pour plusieurs waypoints et détermine si tous sont accessibles
 *
 * @param {Array} documents - Tableau de documents (waypoints)
 * @returns {Promise<Object>} Promesse contenant les résultats et les données d'accessibilité
 */
TransportService.prototype.getStopareasForDocuments = function (documents) {
  if (!documents || documents.length === 0) {
    return Promise.resolve({ stopareas: [], missingTransportForWaypoint: false });
  }

  const documentResults = {};
  const allStopareas = [];

  const fetchPromises = documents.map((doc) => {
    if (!doc || !doc.document_id) {
      console.warn('Document invalide ou ID manquant :', doc);
      return Promise.resolve();
    }

    documentResults[doc.document_id] = false;

    return this.getStopareas(doc.document_id)
      .then((response) => {
        const data = response.data;
        const hasStopareas = data.stopareas && data.stopareas.length > 0;

        documentResults[doc.document_id] = hasStopareas;

        if (hasStopareas) {
          const stopareasForDocument = data.stopareas.map((stoparea) => ({
            ...stoparea,
            distance: stoparea.distance ?? 0,
          }));
          allStopareas.push(...stopareasForDocument);
        }
      })
      .catch((error) => {
        console.error(`Erreur lors de la récupération des arrêts pour le document ${doc.document_id}:`, error);
        documentResults[doc.document_id] = false;
      });
  });

  return Promise.all(fetchPromises).then(() => {
    const missingTransportForWaypoint = Object.values(documentResults).some((hasTransport) => !hasTransport);
    return {
      stopareas: allStopareas,
      missingTransportForWaypoint,
      documentResults,
    };
  });
};

export default new TransportService();
