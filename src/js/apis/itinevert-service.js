import axios from 'axios';

import navitiaService from './navitia-service';

import config from '@/js/config';
import ol from '@/js/libs/ol';

/** Constant to define the maximum number of route before going over each of their waypoint and making a Navitia API Call */
export const MAX_ROUTE_THRESHOLD = 50;
/** Constant to define the max trip duration for Itinevert in minutes */
export const MAX_TRIP_DURATION = 240;
/** Constant to define the min trip duration for Itinevert in minutes */
export const MIN_TRIP_DURATION = 20;
/** Constant to define the min trip duration for Itinevert in minutes */
export const DEFAULT_TRIP_DURATION = 90;
/** Constant to define by how much the trip duration is incremented in minutes */
export const TRIP_DURATION_INCREMENT = 10;
/** Constant to define wether the Navitia Isochrones request limit has been reached */
export const MAX_NAVITIA_ISOCHRONES_REQUEST_REACHED = false;

function ItinevertService() {
  this.axios = axios.create({
    baseURL: config.urls.api,
  });
}

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
  // will load the entire list of reachable routes (max 2000 docs)
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
      if (cancelled) {
        return;
      }
      query.offset = offset;

      this.getReachableRoutes(query)
        .then(({ data }) => {
          if (cancelled) {
            return;
          }

          for (const document of data.documents) {
            result.push(document);
          }

          onProgress?.(result.length, data.total);

          if (data.documents.length === 0 || result.length === data.total || result.length >= limit) {
            resolve(result);
          } else {
            download(offset + 100);
          }
        })
        .catch((error) => {
          if (cancelled) {
            return;
          }

          reject(error);
        });
    };

    download();
  });
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
  // will load the entire list of reachable waypoints (max 2000 docs)
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
      if (cancelled) {
        return;
      }
      query.offset = offset;

      this.getReachableWaypoints(query)
        .then(({ data }) => {
          if (cancelled) {
            return;
          }

          for (const document of data.documents) {
            result.push(document);
          }

          onProgress?.(result.length, data.total);

          if (data.documents.length === 0 || result.length === data.total || result.length >= limit) {
            resolve(result);
          } else {
            download(offset + 100);
          }
        })
        .catch((error) => {
          if (cancelled) {
            return;
          }

          reject(error);
        });
    };

    download();
  });
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
ItinevertService.prototype.getJourneyReachableRoutes = function (query, departure, from) {
  let newQuery = { ...query };

  // Format datetime for Navitia API
  const originalDateTime = new Date(`${departure.selectedDate}T${departure.selectedTime}:00`);
  const adjustedDateTime = new Date(originalDateTime);

  const year = adjustedDateTime.getFullYear();
  const month = String(adjustedDateTime.getMonth() + 1).padStart(2, '0');
  const day = String(adjustedDateTime.getDate()).padStart(2, '0');
  const hours = String(adjustedDateTime.getHours()).padStart(2, '0');
  const minutes = String(adjustedDateTime.getMinutes()).padStart(2, '0');

  const dateTimeFormat = `${year}${month}${day}T${hours}${minutes}00`;
  const dateTimeRepresents = departure.timePreference === 'arrive-before' ? 'arrival' : 'departure';

  newQuery.datetime = dateTimeFormat;
  newQuery.datetime_represents = dateTimeRepresents;
  newQuery.from = navitiaService.formatCoordinates(from.geometry.coordinates);
  newQuery.walking_speed = 1.12;
  newQuery.max_walking_duration_to_pt = 4464;
  newQuery.max_nb_transfers = -1;

  const params = new URLSearchParams(newQuery).toString();
  return this.axios.get(`/navitia/journeyreachableroutes?${params}`);
};

/**
 * Retrieves waypoints reachable by a Navitia journey computed with departure and to. The route does not support offset
 * and limit, it will always return all the waypoints
 *
 * @param {Object} query The query filters to apply to waypoints
 * @param {Object} departure The starting point ({ selectedDate, selectedTime, timePreference})
 * @param {String} from The starting point {lon, lat}
 * @returns {Promise} Returns {documents: All waypoints reachable in TC, total: query.count()}
 */
ItinevertService.prototype.getJourneyReachableWaypoints = function (query, departure, from) {
  let newQuery = { ...query };

  // Format datetime for Navitia API
  const originalDateTime = new Date(`${departure.selectedDate}T${departure.selectedTime}:00`);
  const adjustedDateTime = new Date(originalDateTime);

  const year = adjustedDateTime.getFullYear();
  const month = String(adjustedDateTime.getMonth() + 1).padStart(2, '0');
  const day = String(adjustedDateTime.getDate()).padStart(2, '0');
  const hours = String(adjustedDateTime.getHours()).padStart(2, '0');
  const minutes = String(adjustedDateTime.getMinutes()).padStart(2, '0');

  const dateTimeFormat = `${year}${month}${day}T${hours}${minutes}00`;
  const dateTimeRepresents = departure.timePreference === 'arrive-before' ? 'arrival' : 'departure';

  newQuery.datetime = dateTimeFormat;
  newQuery.datetime_represents = dateTimeRepresents;
  newQuery.from = navitiaService.formatCoordinates(from.geometry.coordinates);
  newQuery.walking_speed = 1.12;
  newQuery.max_walking_duration_to_pt = 4464;
  newQuery.max_nb_transfers = -1;

  const params = new URLSearchParams(newQuery).toString();
  return this.axios.get(`/navitia/journeyreachablewaypoints?${params}`);
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
  let newQuery = { ...query };

  // Format datetime for Navitia API
  const originalDateTime = new Date(`${departure.selectedDate}T${departure.selectedTime}:00`);
  const adjustedDateTime = new Date(originalDateTime);

  const year = adjustedDateTime.getFullYear();
  const month = String(adjustedDateTime.getMonth() + 1).padStart(2, '0');
  const day = String(adjustedDateTime.getDate()).padStart(2, '0');
  const hours = String(adjustedDateTime.getHours()).padStart(2, '0');
  const minutes = String(adjustedDateTime.getMinutes()).padStart(2, '0');

  const dateTimeFormat = `${year}${month}${day}T${hours}${minutes}00`;
  const dateTimeRepresents = departure.timePreference === 'arrive-before' ? 'arrival' : 'departure';

  newQuery.datetime = dateTimeFormat;
  newQuery.datetime_represents = dateTimeRepresents;
  newQuery.from = navitiaService.formatCoordinates(from.geometry.coordinates);
  newQuery.boundary_duration = [duration * 60]; // (minutes to second)

  const params = new URLSearchParams(newQuery).toString();
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
  let newQuery = { ...query };

  // Format datetime for Navitia API
  const originalDateTime = new Date(`${departure.selectedDate}T${departure.selectedTime}:00`);
  const adjustedDateTime = new Date(originalDateTime);

  const year = adjustedDateTime.getFullYear();
  const month = String(adjustedDateTime.getMonth() + 1).padStart(2, '0');
  const day = String(adjustedDateTime.getDate()).padStart(2, '0');
  const hours = String(adjustedDateTime.getHours()).padStart(2, '0');
  const minutes = String(adjustedDateTime.getMinutes()).padStart(2, '0');

  const dateTimeFormat = `${year}${month}${day}T${hours}${minutes}00`;
  const dateTimeRepresents = departure.timePreference === 'arrive-before' ? 'arrival' : 'departure';

  newQuery.datetime = dateTimeFormat;
  newQuery.datetime_represents = dateTimeRepresents;
  newQuery.from = navitiaService.formatCoordinates(from.geometry.coordinates);
  newQuery.boundary_duration = [duration * 60]; // (minutes to second)

  const params = new URLSearchParams(newQuery).toString();
  return this.axios.get(`/navitia/isochronesreachablewaypoints?${params}`);
};

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
    if (newQuery.hasOwnProperty(key) && newQuery[key]) {
      // Add or update the property in the query, only if defined
      query[key] = newQuery[key];
    }
  }
  return query;
};

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

  // Compare for numerical ranges
  if (Array.isArray(initialVal) && typeof initialVal[0] === 'number') {
    return (
      Array.isArray(fieldValue) &&
      fieldValue.length === 2 &&
      initialVal[0] === fieldValue[0] &&
      initialVal[1] === fieldValue[1]
    );
  }

  // General compare for strings
  return initialVal === fieldValue;
};

function collectPairs(node, out) {
  if (!node) return;
  if (Array.isArray(node) && node.length >= 2 && typeof node[0] === 'number' && typeof node[1] === 'number') {
    out.push([node[0], node[1]]);
    return;
  }
  if (Array.isArray(node)) {
    for (const child of node) collectPairs(child, out);
  }
}

export function createBboxString(nestedCoords) {
  const pairs = [];
  collectPairs(nestedCoords, pairs);
  if (pairs.length === 0) return null;

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const [lon, lat] of pairs) {
    const [x, y] = ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  return `${minX},${minY},${maxX},${maxY}`;
}

export default new ItinevertService();
