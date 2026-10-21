import axios from 'axios';

import navitiaService from './navitia-service';

import config from '@/js/config';
import ol from '@/js/libs/ol';

/**
 * Constant to define the maximum number of documents that can go through the batch round-trip verification job (one
 * Navitia call per document). If you update this constant, make sure to edit the back too -> navitia.py
 */
export const MAX_ROUTE_THRESHOLD = 50;
/** Constant to define the max transport duration override in minutes for the transport search form (advanced field) */
export const MAX_TRIP_DURATION = 240;
/** Constant to define the min transport duration override in minutes for the transport search form (advanced field) */
export const MIN_TRIP_DURATION = 20;
/** Constant to define the default transport duration override in minutes for the transport search form */
export const DEFAULT_TRIP_DURATION = 90;
/** Constant to define by how much the transport duration override is incremented in minutes */
export const TRIP_DURATION_INCREMENT = 10;

// colors for polygons displayed on map
/** Legacy/default polygon style, kept for compatibility with any remaining single-polygon usage */
export const POLYGON_STYLE = {
  color: 'rgba(250,150,51,0.3)',
  strokeColor: 'rgba(250,150,51,1)',
};
/** Style for the "aller" (outbound) isochrone polygon */
export const ALLER_POLYGON_STYLE = {
  color: 'rgba(51,143,250,0.25)',
  strokeColor: 'rgba(51,143,250,1)',
};
/** Style for the "retour" (return) isochrone polygon */
export const RETOUR_POLYGON_STYLE = {
  color: 'rgba(155,89,222,0.25)',
  strokeColor: 'rgba(155,89,222,1)',
};
/** Style for the intersection (aller ∩ retour) polygon, the actual filter applied to the search */
export const INTERSECTION_POLYGON_STYLE = {
  color: 'rgba(250,150,51,0.35)',
  strokeColor: 'rgba(250,150,51,1)',
};

/** Synthetic negative document IDs used for the 3 isochrone overlays shown on the Topoguide map */
export const ALLER_SYNTHETIC_ID = -1;
export const RETOUR_SYNTHETIC_ID = -2;
export const INTERSECTION_SYNTHETIC_ID = -3;

function ItinevertService() {
  this.axios = axios.create({
    baseURL: config.urls.api,
  });
  this.jobID = null;
  this.eventSource = null;
}

/**
 * Formats a "from" input into the Navitia "lon;lat" coordinates string.
 *
 * Accepts either an address selection object (as returned by `input-address`, with `geometry.coordinates`), a plain
 * `[lon, lat]` array, or an already-formatted string.
 *
 * @param {Object | Array | String} from
 * @returns {String}
 */
function formatFromCoordinates(from) {
  if (typeof from === 'string') return from;
  const coordinates = Array.isArray(from) ? from : from?.geometry?.coordinates;
  if (!coordinates) return '';
  return navitiaService.formatCoordinates(coordinates);
}

/**
 * Resolve which job family (route segment) to use depending on the document type.
 *
 * @param {'route' | 'waypoint'} documentType
 * @returns {String}
 */
function roundTripJobFamily(documentType) {
  return documentType === 'waypoint' ? 'journeyroundtripwaypoints' : 'journeyroundtriproutes';
}

/** --------------- Query to API --------------- */

/**
 * Retrieves the outbound/return/intersection isochrones of a public transport search. The API computes them once per
 * search (the topoguide filters on the same search, with its parameters in the query string, see `transport-query`).
 *
 * @param {Object} search `{ from, date, minDeparture, maxReturn, maxDuration, hikingDuration }`, `from` being "lon;lat"
 *   and the last two optional
 * @returns {Promise} Resolves to `{ aller_geom, retour_geom, intersection_geom }`
 */
ItinevertService.prototype.getTransportIsochrones = function (search) {
  const params = this.enhanceQuery(
    {
      from: formatFromCoordinates(search.from),
      date: search.date,
      min_departure: search.minDeparture,
      max_return: search.maxReturn,
    },
    { max_duration: search.maxDuration }
  );

  return this.axios.get('/navitia/transportisochrones', { params });
};

/**
 * Synchronously checks whether a single document is reachable both ways (aller + retour) by public transport.
 *
 * @param {Number} documentId
 * @param {'route' | 'waypoint'} documentType
 * @param {String} date The departure date, "YYYY-MM-DD"
 * @param {String} minDeparture The minimum departure time, "HH:MM"
 * @param {String} maxReturn The maximum return time, "HH:MM"
 * @param {Object | Array | String} from The starting point
 * @param {Number} [hikingDurationMinutes] Optional hiking duration, in minutes, used to check the compatibility of the
 *   aller/retour margin against the actual course duration
 * @returns {Promise} Resolves to `{ aller: {found, departure, arrival}, retour: {...}, compatible }`
 */
ItinevertService.prototype.getRoundTripReachable = function (
  documentId,
  documentType,
  date,
  minDeparture,
  maxReturn,
  from,
  hikingDurationMinutes
) {
  const params = this.enhanceQuery(
    {
      document_id: documentId,
      document_type: documentType,
      from: formatFromCoordinates(from),
      date,
      min_departure: minDeparture,
      max_return: maxReturn,
    },
    { hiking_duration: hikingDurationMinutes }
  );

  return this.axios.get('/navitia/roundtripreachable', { params });
};

/**
 * Starts a batch round-trip verification job for a shortlist of documents (capped at MAX_ROUTE_THRESHOLD).
 *
 * @param {Number[]} documentIds The shortlist of document IDs to verify
 * @param {'route' | 'waypoint'} documentType
 * @param {String} date The departure date, "YYYY-MM-DD"
 * @param {String} minDeparture The minimum departure time, "HH:MM"
 * @param {String} maxReturn The maximum return time, "HH:MM"
 * @param {Object | Array | String} from The starting point
 * @param {Number} [hikingDurationMinutes] Optional hiking duration, in minutes
 * @returns {Promise<String>} Resolves to the job ID (also stored in `this.jobID`)
 */
ItinevertService.prototype.startRoundTripJob = async function (
  documentIds,
  documentType,
  date,
  minDeparture,
  maxReturn,
  from,
  hikingDurationMinutes
) {
  const params = this.enhanceQuery(
    {
      ids: documentIds.join(','),
      from: formatFromCoordinates(from),
      date,
      min_departure: minDeparture,
      max_return: maxReturn,
    },
    { hiking_duration: hikingDurationMinutes }
  );

  const family = roundTripJobFamily(documentType);
  this.jobID = (await this.axios.get(`/navitia/${family}/start`, { params })).data['job_id'];
  return this.jobID;
};

/**
 * Retrieves the result of a batch round-trip verification job.
 *
 * @param {'route' | 'waypoint'} documentType
 * @param {String} [jobId] Defaults to the last job started with `startRoundTripJob`
 * @returns {Promise} Resolves to `{ status, result: { results: { <document_id>: {aller, retour, compatible} }, total }
 *   }`
 */
ItinevertService.prototype.getRoundTripJobResult = function (documentType, jobId = this.jobID) {
  const family = roundTripJobFamily(documentType);
  return this.axios.get(`/navitia/${family}/result/${jobId}`);
};

/**
 * Opens an SSE connection to monitor the progress of a background job (either the round-trip verification job families
 * above, or any other `/navitia/<family>/progress/<jobId>` route following the same protocol).
 *
 * @param {Function} onProgress Callback invoked with the raw SSE message data on each progress event
 * @param {Function} onDone Callback invoked once the job is done
 * @param {Function} onError Callback invoked with the raw SSE error data if the job fails
 * @param {String} family The route segment identifying the job family, e.g. "journeyroundtriproutes"
 * @returns {EventSource}
 */
ItinevertService.prototype.monitorProgress = function (onProgress, onDone, onError, family) {
  if (!this.jobID) {
    throw new Error('No job started yet');
  }

  // Close any existing stream just in case
  this.cancelProgress();

  this.eventSource = new EventSource(`${config.urls.api}/navitia/${family}/progress/${this.jobID}`);

  this.eventSource.onmessage = (event) => {
    if (onProgress) {
      onProgress(event.data);
    }
  };

  this.eventSource.addEventListener('done', () => {
    if (onDone) onDone();
    this.cancelProgress(true);
  });

  this.eventSource.addEventListener('error', (event) => {
    if (onError) onError(event?.data);
    this.cancelProgress(true);
  });

  return this.eventSource;
};

ItinevertService.prototype.cancelProgress = function (resetJob = false) {
  if (this.eventSource) {
    this.eventSource.close();
    this.eventSource = null;
  }

  if (resetJob) {
    this.jobID = null;
  }
};

/** --------------- Helper functions for queries --------------- */

/**
 * Enhance a base query with extra fields, skipping keys that are undefined/null/empty.
 *
 * @param {Object} baseQuery The base query to be enhanced
 * @param {Object} newQuery The new fields to merge in
 * @returns {Object} Returns the query with all filters in it
 */
ItinevertService.prototype.enhanceQuery = function (baseQuery, newQuery) {
  let query = { ...baseQuery };
  // Iterate over each key in newQuery
  for (let key in newQuery) {
    if (Object.hasOwn(newQuery, key) && newQuery[key]) {
      // Add or update the property in the query, only if defined
      query[key] = newQuery[key];
    }
  }
  return query;
};

/** Project geometry's coordinates from sourceProj to targetProj */
export function projectCoordinates(coords, sourceProj = 'EPSG:4326', targetProj = 'EPSG:3857') {
  return coords.map(function recur(node) {
    if (typeof node[0] === 'number' && typeof node[1] === 'number') {
      return ol.proj.transform([node[0], node[1]], sourceProj, targetProj);
    }
    return node.map(recur);
  });
}

/** Create a bbox string out of geometry's coordinates */
export function createBboxString(coords) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  (function recur(node) {
    if (typeof node[0] === 'number' && typeof node[1] === 'number') {
      const x = node[0],
        y = node[1];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      return;
    }
    node.forEach(recur);
  })(coords);
  return `${minX},${minY},${maxX},${maxY}`;
}

/**
 * Projects a GeoJSON geometry (as returned by the transportisochrones/roundtrip endpoints, in EPSG:4326) into EPSG:3857
 * so it can be fed straight into a synthetic map document's `geom`.
 *
 * @param {Object | String} geometry A GeoJSON geometry object, or "" / null / undefined when absent
 * @returns {Object | null}
 */
export function projectGeometry(geometry) {
  if (!geometry || typeof geometry !== 'object' || !geometry.coordinates) {
    return null;
  }
  return { type: geometry.type, coordinates: projectCoordinates(geometry.coordinates) };
}

/**
 * Builds the up-to-3 synthetic "area" map documents used to overlay the aller/retour/intersection isochrones on the
 * Topoguide map, following the same synthetic-document pattern as the rest of the app (negative `document_id`, `type:
 * 'a'`, `nonInteractive` property).
 *
 * @param {Object} context The stashed Itinevert search context: `{ allerGeom, retourGeom, intersectionGeom }`
 * @returns {Object[]}
 */
export function buildIsochroneOverlayDocuments(context) {
  if (!context) return [];

  const overlays = [
    { id: ALLER_SYNTHETIC_ID, geometry: context.allerGeom, style: ALLER_POLYGON_STYLE },
    { id: RETOUR_SYNTHETIC_ID, geometry: context.retourGeom, style: RETOUR_POLYGON_STYLE },
    { id: INTERSECTION_SYNTHETIC_ID, geometry: context.intersectionGeom, style: INTERSECTION_POLYGON_STYLE },
  ];

  return overlays
    .map(({ id, geometry, style }) => {
      const projected = projectGeometry(geometry);
      if (!projected) return null;

      return {
        document_id: id,
        type: 'a',
        geometry: {
          version: 1,
          geom: JSON.stringify(projected),
          geom_detail: JSON.stringify(projected),
        },
        properties: {
          ...style,
          nonInteractive: true,
        },
      };
    })
    .filter((doc) => doc !== null);
}

export default new ItinevertService();
