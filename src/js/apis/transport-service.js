import axios from 'axios';

import retryOn429 from './retry-on-429';

import concurrencyLimit from '@/js/concurrency-limit';
import config from '@/js/config';

// A document with many access waypoints, or the printing view showing up to 100 documents,
// would otherwise send one request per waypoint at once.
const limit = concurrencyLimit(4);

function TransportService() {
  this.axios = axios.create({
    baseURL: config.urls.api,
  });
  retryOn429(this.axios);
}

/**
 * Retrieves public transport stops for a given waypoint
 *
 * @param {string | number} waypointId
 * @returns {Promise}
 */
TransportService.prototype.getStopareas = function (waypointId) {
  return limit(() => this.axios.get(`/waypoints/${waypointId}/stopareas`));
};

const bbox = (extent) => extent.map(Math.round).join(',');

/**
 * Retrieves the public transport stops located in an extent: the GTFS stops (the ones linked to a waypoint, or all of
 * them), and the Navitia stops that are not matched with a GTFS stop (with their lines and waypoints)
 *
 * @param {number[]} extent - [xmin, ymin, xmax, ymax] in EPSG:3857
 * @param {boolean} [all] - Also the GTFS stops that are not linked to a waypoint
 * @returns {Promise}
 */
TransportService.prototype.getStopsInExtent = function (extent, all = false) {
  return this.axios.get('/stopareas', { params: { bbox: bbox(extent), all: all ? 1 : undefined } });
};

/**
 * Retrieves the public transport lines (GeoJSON, EPSG:3857) located in an extent
 *
 * @param {number[]} extent - [xmin, ymin, xmax, ymax] in EPSG:3857
 * @returns {Promise}
 */
TransportService.prototype.getLinesInExtent = function (extent) {
  return this.axios.get('/transport-lines', { params: { bbox: bbox(extent) } });
};

/**
 * Retrieves a public transport stop: timetable of its lines and the waypoints it is associated with
 *
 * @param {number} stopId
 * @returns {Promise}
 */
TransportService.prototype.getStop = function (stopId) {
  return this.axios.get(`/transport-stops/${stopId}`);
};

/**
 * Retrieves a public transport line: directions, stops and timetable
 *
 * @param {number} lineId
 * @returns {Promise}
 */
TransportService.prototype.getLine = function (lineId) {
  return this.axios.get(`/transport-lines/${lineId}`);
};

/**
 * Get list of waypoint ids that are accessible in TC for a route
 *
 * @param {string | number} routeId
 * @returns {Promise}
 */
TransportService.prototype.getWaypointsAccessibleTC = function (routeId) {
  return this.axios.get(`/routes/${routeId}/stopareaswaypoints`).then((response) => response.data);
};

/**
 * Check if a waypoint is accessible by public transport
 *
 * @param {string | number} waypointId
 * @returns {Promise<boolean>}
 */
TransportService.prototype.isReachable = function (waypointId) {
  return limit(() => this.axios.get(`/waypoints/${waypointId}/isReachable`)).then((response) => response.data);
};

/**
 * Retrieves stops for multiple waypoints and determines if all are reachable
 *
 * @param {Array} documents
 * @returns {Promise<Object>}
 */
TransportService.prototype.getStopareasForDocuments = function (documents) {
  if (!documents || documents.length === 0) {
    return Promise.resolve({ stopareas: [], missingTransportForWaypoint: false, documentResults: {} });
  }

  const documentResults = {};
  const allStopareas = [];

  const fetchPromises = documents.map((doc) => {
    if (!doc || !doc.document_id) {
      console.warn('Invalid document or missing ID :', doc);
      return Promise.resolve();
    }

    return this.getStopareas(doc.document_id)
      .then((response) => {
        const data = response.data;
        const hasStopareas = data.stopareas && data.stopareas.length > 0;

        // Store whether this document has stops
        documentResults[doc.document_id] = hasStopareas;

        if (hasStopareas) {
          // Add document_id to each stoparea for reference
          const stopareasForDocument = data.stopareas.map((stoparea) => ({
            ...stoparea,
            document_id: doc.document_id, // Associate stoparea with document
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
      documentResults, // Indicates which documents have stops
    };
  });
};

export default new TransportService();
