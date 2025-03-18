import axios from 'axios';

import config from '@/js/config';

function TransportService() {
  this.axios = axios.create({
    baseURL: config.urls.api,
  });
}

/**
 * Retrieves public transport stops for a given waypoint
 *
 * @param {string | number} waypointId
 * @returns {Promise}
 */
TransportService.prototype.getStopareas = function (waypointId) {
  return this.axios.get(`/waypoints/${waypointId}/stopareas`);
};

/**
 * Check if a waypoint is accessible by public transport
 *
 * @param {string | number} waypointId
 * @returns {Promise<boolean>}
 */
TransportService.prototype.isReachable = function (waypointId) {
  return this.axios.get(`/waypoints/${waypointId}/isReachable`).then((response) => response.data);
};

/**
 * Retrieves stops for multiple waypoints and determines if all are reachable
 *
 * @param {Array} documents
 * @returns {Promise<Object>}
 */
TransportService.prototype.getStopareasForDocuments = function (documents) {
  if (!documents || documents.length === 0) {
    return Promise.resolve({ stopareas: [], missingTransportForWaypoint: false });
  }

  const documentResults = {};
  const allStopareas = [];

  const fetchPromises = documents.map((doc) => {
    if (!doc || !doc.document_id) {
      console.warn('Invalid document or missing ID :', doc);
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
        console.error(`Error retrieving stops for document ${doc.document_id}:`, error);
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
