import axios from 'axios';

import navitiaService from './navitia-service';

import config from '@/js/config';
import ol from '@/js/libs/ol';

/**
 * Constant to define the maximum number of route before going over each of their waypoint and making a Navitia API Call
 * If you update this constant, make sure to edit the back too -> navitia.py
 */
export const MAX_ROUTE_THRESHOLD = 50;
/**
 * Constant to define the max trip duration for Itinevert in minutes. If you update this constant, make sure to edit the
 * back too -> navitia.py
 */
export const MAX_TRIP_DURATION = 240;
/**
 * Constant to define the min trip duration for Itinevert in minutes. If you update this constant, make sure to edit the
 * back too -> navitia.py
 */
export const MIN_TRIP_DURATION = 20;
/** Constant to define the min trip duration for Itinevert in minutes */
export const DEFAULT_TRIP_DURATION = 90;
/** Constant to define by how much the trip duration is incremented in minutes */
export const TRIP_DURATION_INCREMENT = 10;
/** Constant to define wether the Navitia Isochrones request limit has been reached */
export const MAX_NAVITIA_ISOCHRONES_REQUEST_REACHED = false;
// colors for polygon displayed on map
export const POLYGON_STYLE = {
  color: 'rgba(250,150,51,0.3)',
  strokeColor: 'rgba(250,150,51,1)',
};

function ItinevertService() {
  this.axios = axios.create({
    baseURL: config.urls.api,
  });
  this.jobID = null;
  this.eventSource = null;
}

/** --------------- Query to API --------------- */
ItinevertService.prototype.getCoverage = function (lon, lat) {
  const params = new URLSearchParams({ lon: lon, lat: lat }).toString();
  return this.axios.get(`/getcoverage?${params}`);
};

ItinevertService.prototype.getPolygonCoverage = function (geom_detail) {
  let geometry = JSON.parse(geom_detail);
  let coordinates = projectCoordinates(geometry.coordinates, 'EPSG:3857', 'EPSG:4326');
  geometry.coordinates = coordinates;
  let wkb = JSON.stringify(geometry);
  return this.axios.post(`/getpolygoncoverage`, { geom_detail: wkb });
};

/**
 * Retrieves reachable routes. The route supports all filters on route fields + sort,lang,offset,limit
 *
 * @param {Object} query The query filters to apply to routes
 * @returns {Promise} Returns {documents: All reachable routes, total: query.count()}
 */
ItinevertService.prototype.getReachableRoutes = function (query) {
  const params = new URLSearchParams(query).toString();
  return this.axios.get(`/reachableroutes?${params}`);
};

/**
 * Retrieves all reachable routes.
 *
 * @param {Object} query The query filters to apply to routes
 * @returns {Promise} Returns {documents: All reachable routes, total: query.count()}
 */
ItinevertService.prototype.getAllReachableRoutes = function (query, onProgress) {
  return getAllReachable(query, onProgress, (q) => this.getReachableRoutes(q));
};

/**
 * Retrieves reachable waypoints. The route supports all filters on waypoint fields + sort,lang,offset,limit
 *
 * @param {Object} query The query filters to apply to waypoints
 * @returns {Promise} Returns {documents: All reachable waypoints, total: query.count()}
 */
ItinevertService.prototype.getReachableWaypoints = function (query) {
  const params = new URLSearchParams(query).toString();
  return this.axios.get(`/reachablewaypoints?${params}`);
};

/**
 * Retrieves all reachable waypoints.
 *
 * @param {Object} query The query filters to apply to waypoints
 * @returns {Promise} Returns {documents: All reachable waypoints, total: query.count()}
 */
ItinevertService.prototype.getAllReachableWaypoints = function (query, onProgress) {
  return getAllReachable(query, onProgress, (q) => this.getReachableWaypoints(q));
};

/**
 * Helper function to download all reachable documents with paginated queries
 *
 * Repeatedly calls the provided query function until all documents are retrieved, the maximum size is reached, or the
 * request is cancelled
 *
 * @param {Object} param0
 * @param {Object} param0.query Query parameters used for pagination and filtering
 * @param {Function} param0.queryFunction Function to query a page
 * @param {Function} [param0.onProgress] Optional callback invoked after each page is fetched
 * @returns {Promise<Array>} A cancelable Promise that resolves with the aggregated list of documents. Call `.cancel()`
 *   to stop further requests.
 */
function getAllReachable(query, onProgress, queryFunction) {
  const MAX_SIZE = 2000;
  const API_MAX_LIMIT = 100;

  let cancelled = false;
  let limit = MAX_SIZE;

  query.limit = API_MAX_LIMIT;

  class CancelablePromise extends Promise {
    cancel() {
      cancelled = true;
    }
  }

  return new CancelablePromise((resolve, reject) => {
    const result = [];

    const download = (offset = 0) => {
      if (cancelled) return;

      query.offset = offset;

      queryFunction(query)
        .then(({ data }) => {
          if (cancelled) return;

          result.push(...data.documents);

          onProgress?.(result.length, data.total);

          if (data.documents.length === 0 || result.length === data.total || result.length >= limit) {
            resolve(result);
          } else {
            download(offset + API_MAX_LIMIT);
          }
        })
        .catch((error) => {
          if (!cancelled) {
            reject(error);
          }
        });
    };

    download();
  });
}

ItinevertService.prototype.getJourneyReachableWaypoints = function () {
  const data = this.axios.get(`/navitia/journeyreachablewaypoints/result/${this.jobID}`);
  return data;
};

ItinevertService.prototype.getJourneyReachableRoutes = function () {
  const data = this.axios.get(`/navitia/journeyreachableroutes/result/${this.jobID}`);
  return data;
};

/**
 * Retrieves routes reachable by a Navitia journey computed with departure and to. The route does not support offset and
 * limit, it will always return all the routes (count will always be <= MAX_ROUTE_THRESHOLD)
 *
 * @param {Object} query The query filters to apply to routes
 * @param {Object} departure The starting point ({ selectedDate, selectedTime, timePreference})
 * @param {String} from The starting point {lon, lat}
 * @returns {Promise} Returns {documents: All routes reachable in TC, total: query.count()}
 */
ItinevertService.prototype.startJourneyReachableRoutesJob = async function (query, departure, from) {
  const params = new URLSearchParams(buildJourneyReachableQuery(query, departure, from)).toString();
  this.jobID = (await this.axios.get(`/navitia/journeyreachableroutes/start?${params}`)).data['job_id'];
};

/**
 * Retrieves waypoints reachable by a Navitia journey computed with departure and to. The route does not support offset
 * and limit
 *
 * @param {Object} query The query filters to apply to waypoints
 * @param {Object} departure The starting point ({ selectedDate, selectedTime, timePreference})
 * @param {String} from The starting point {lon, lat}
 * @returns {Promise} Returns {documents: All waypoints reachable in TC, total: query.count()}
 */
ItinevertService.prototype.startJourneyReachableWaypointsJob = async function (query, departure, from) {
  const params = new URLSearchParams(buildJourneyReachableQuery(query, departure, from)).toString();
  this.jobID = (await this.axios.get(`/navitia/journeyreachablewaypoints/start?${params}`)).data['job_id'];
};

ItinevertService.prototype.monitorProgress = function (onProgress, onDone, onError, type) {
  if (!this.jobID) {
    throw new Error('No job started yet');
  }

  // Close any existing stream just in case
  this.cancelProgress();

  this.eventSource = new EventSource(`${config.urls.api}/navitia/journeyreachable${type}/progress/${this.jobID}`);

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

/**
 * Retrieves routes reachable in the Navitia isochrones computed with departure and duration. The route does not support
 * offset and limit, it will always return all the routes (count will always be <= MAX_ROUTE_THRESHOLD)
 *
 * @param {Object} query The query filters to apply to routes
 * @param {Object} departure The starting point ({ selectedDate, selectedTime, timePreference})
 * @param {Integer} duration The maximum duration for the trip in minutes
 * @param {String} from The starting point {lon, lat}
 * @returns {Promise} Returns {documents: All routes reachable in the Navitia isochrones, total: query.count()}
 */
ItinevertService.prototype.getIsochronesReachableRoutes = function (query, departure, duration, from) {
  const params = new URLSearchParams(buildIsochroneReachableQuery(query, departure, duration, from)).toString();
  return this.axios.get(`/navitia/isochronesreachableroutes?${params}`);
};

/**
 * Retrieves waypoints reachable in the Navitia isochrones computed with departure and duration. The route does not
 * support offset and limit, it will always return all the waypoints
 *
 * @param {Object} query The query filters to apply to waypoints
 * @param {Object} departure The starting point ({ selectedDate, selectedTime, timePreference})
 * @param {Integer} duration The maximum duration for the trip in minutes
 * @param {String} from The starting point {lon, lat}
 * @returns {Promise} Returns {documents: All waypoints reachable in the Navitia isochrones, total: query.count()}
 */
ItinevertService.prototype.getIsochronesReachableWaypoints = function (query, departure, duration, from) {
  const params = new URLSearchParams(buildIsochroneReachableQuery(query, departure, duration, from)).toString();
  return this.axios.get(`/navitia/isochronesreachablewaypoints?${params}`);
};

/** --------------- Helper functions for queries --------------- */

/**
 * Take all filters in active fields and build the query with each of them
 *
 * @param {Array} activeFields The active fields where all the filters are stored
 * @returns {Objet} Returns the query with all filters in it
 */
ItinevertService.prototype.buildQuery = function (activeFields) {
  let query = {};
  // loop over each category ('General', 'ratings', 'Terrain', 'Misc')
  for (let category of Object.keys(activeFields)) {
    // loop over each active fields to enhance the query
    for (let field of activeFields[category]) {
      query[field.field.url] = field.field.valueToUrl(field.value);
    }
  }
  return query;
};

/**
 * Enhance a base query with the active fields.
 *
 * @param {Object} baseQuery The base query to be enhanced
 * @param {Object} newQuery The new query
 * @returns {Objet} Returns the query with all filters in it
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

/**
 * Build a query for journey reachable documents
 *
 * @param {Object} query The query filters to apply to docs
 * @param {Object} departure The starting point ({ selectedDate, selectedTime, timePreference})
 * @param {String} from The starting point {lon, lat}
 * @returns
 */
function buildJourneyReachableQuery(query, departure, from) {
  const newQuery = { ...query };

  const { dateTimeFormat, dateTimeRepresents } = formatNavitiaDateTime(
    departure.selectedDate,
    departure.selectedTime,
    departure.timePreference
  );

  newQuery.datetime = dateTimeFormat;
  newQuery.datetime_represents = dateTimeRepresents;
  newQuery.from = navitiaService.formatCoordinates(from.geometry.coordinates);
  newQuery.walking_speed = 1.12;
  newQuery.max_walking_duration_to_pt = 4464;

  return newQuery;
}

/**
 * Build a query for isochrone reachable documents
 *
 * @param {Object} query The query filters to apply to docs
 * @param {Object} departure The starting point ({ selectedDate, selectedTime, timePreference})
 * @param {Integer} duration The maximum duration for the trip in minutes
 * @param {String} from The starting point {lon, lat}
 * @returns
 */
function buildIsochroneReachableQuery(query, departure, duration, from) {
  let newQuery = { ...query };

  const { dateTimeFormat, dateTimeRepresents } = formatNavitiaDateTime(
    departure.selectedDate,
    departure.selectedTime,
    departure.timePreference
  );

  newQuery.datetime = dateTimeFormat;
  newQuery.datetime_represents = dateTimeRepresents;
  newQuery.from = navitiaService.formatCoordinates(from.geometry.coordinates);
  newQuery.boundary_duration = [duration * 60]; // (minutes to second)

  return newQuery;
}

/**
 * Format a departure/arrival date+time for Navitia API.
 *
 * @param {string} date - Date in "YYYY-MM-DD" (e.g., "2025-12-01").
 * @param {string} time - Time in "HH:MM" (24h, e.g., "08:30").
 * @param {'arrive-before' | 'leave-after' | string} timePreference - If 'arrive-before' the result represents arrival,
 *   otherwise departure.
 * @returns {{ dateTimeFormat: string; dateTimeRepresents: 'arrival' | 'departure' }}
 */
function formatNavitiaDateTime(date, time, timePreference) {
  const originalDateTime = new Date(`${date}T${time}:00`);
  const y = originalDateTime.getFullYear();
  const m = String(originalDateTime.getMonth() + 1).padStart(2, '0');
  const d = String(originalDateTime.getDate()).padStart(2, '0');
  const hh = String(originalDateTime.getHours()).padStart(2, '0');
  const mm = String(originalDateTime.getMinutes()).padStart(2, '0');

  const dateTimeFormat = `${y}${m}${d}T${hh}${mm}00`;
  const dateTimeRepresents = timePreference === 'arrive-before' ? 'arrival' : 'departure';

  return { dateTimeFormat, dateTimeRepresents };
}

/** --------------- Helper functions for Itinevert tool UI --------------- */

/**
 * Get the initial value for a field, based on its queryMode
 *
 * @param {Object} field The field
 * @returns {Object} Returns initial value for the field
 */
ItinevertService.prototype.initialValue = function (field) {
  if (!field) return null;
  if (field.queryMode === 'activities') return [];
  if (field.queryMode === 'orientations') return [];
  if (field.queryMode === 'multiSelect' || field.queryMode === 'tristate') return [];
  if (field.queryMode === 'checkbox') return false;
  if (field.queryMode === 'valuesRangeSlider' || field.queryMode === 'numericalRangeSlider') {
    return [field.values?.[0] ?? 0, field.values?.[field.values.length - 1] ?? 0];
  }
  return '';
};

/**
 * Test if a value is equal to field's default value
 *
 * @param {Object} field The field
 * @param {Object} fieldValue The value to compare with the default value of field
 * @returns {Boolean} Returns true if the value is equal to the default value of the field
 */
ItinevertService.prototype.isFieldValueDefault = function (fieldValue, field) {
  const initialVal = this.initialValue(field);

  // Compare for null
  if (fieldValue === null) {
    return true;
  }

  // Compare for array
  if (Array.isArray(initialVal)) {
    return (
      Array.isArray(fieldValue) &&
      initialVal.length === fieldValue.length &&
      initialVal.every((val, index) => val === fieldValue[index])
    );
  }

  // Compare for boolean
  if (typeof initialVal === 'boolean') {
    return initialVal === fieldValue;
  }

  // General compare for strings
  return initialVal === fieldValue;
};

/**
 * Returns the document_id of all areas that intersects coordinates.
 *
 * @param {object} coordinates
 */
ItinevertService.prototype.getAreaIntersectingIsochrone = function (geometry) {
  let geom_detail = JSON.stringify(geometry);
  return this.axios.post(`/navitia/areainisochrone`, { geom_detail: geom_detail });
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

export default new ItinevertService();
