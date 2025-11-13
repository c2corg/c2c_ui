import axios from 'axios';

import config from '@/js/config';

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
 * @param {Integer} to The destination point (mountain range location)
 * @returns {Promise} Returns {documents: All routes reachable in TC, total: query.count()}
 */
ItinevertService.prototype.getJourneyReachableRoutes = function (query, departure, to) {
  const params = new URLSearchParams(query).toString();
  params.departureDate = departure.selectedDate;
  params.departureTime = departure.selectedTime;
  params.timePreference = departure.timePreference;
  params.to = to;
  return this.axios.get(`/journeyreachableroutes?${params}`);
};

/**
 * Retrieves waypoints reachable by a Navitia journey computed with departure and to. The route does not support offset
 * and limit, it will always return all the waypoints
 *
 * @param {Object} query The query filters to apply to waypoints
 * @param {Object} departure The starting point ({ selectedDate, selectedTime, timePreference})
 * @param {Integer} to The destination point (mountain range location)
 * @returns {Promise} Returns {documents: All waypoints reachable in TC, total: query.count()}
 */
ItinevertService.prototype.getJourneyReachableWaypoints = function (query, departure, to) {
  const params = new URLSearchParams(query).toString();
  params.departureDate = departure.selectedDate;
  params.departureTime = departure.selectedTime;
  params.timePreference = departure.timePreference;
  params.to = to;
  return this.axios.get(`/journeyreachablewaypoints?${params}`);
};

/**
 * Retrieves routes reachable in the Navitia isochron computed with departure and duration. The route does not support
 * offset and limit, it will always return all the routes (count will always be <= MAX_ROUTE_THRESHOLD)
 *
 * @param {Object} query The query filters to apply to routes
 * @param {Object} departure The starting point ({ selectedDate, selectedTime, timePreference})
 * @param {Integer} duration The maximum duration for the trip in minutes
 * @returns {Promise} Returns {documents: All routes reachable in the Navitia isochron, total: query.count()}
 */
ItinevertService.prototype.getIsochronReachableRoutes = function (query, departure, duration) {
  const params = new URLSearchParams(query).toString();
  params.departureDate = departure.selectedDate;
  params.departureTime = departure.selectedTime;
  params.timePreference = departure.timePreference;
  params.duration = duration;
  return this.axios.get(`/isochronreachableroutes?${params}`);
};

/**
 * Retrieves waypoints reachable in the Navitia isochron computed with departure and duration. The route does not
 * support offset and limit, it will always return all the waypoints
 *
 * @param {Object} query The query filters to apply to waypoints
 * @param {Object} departure The starting point ({ selectedDate, selectedTime, timePreference})
 * @param {Integer} duration The maximum duration for the trip in minutes
 * @returns {Promise} Returns {documents: All waypoints reachable in the Navitia isochron, total: query.count()}
 */
ItinevertService.prototype.getIsochronReachableWaypoints = function (query, departure, duration) {
  const params = new URLSearchParams(query).toString();
  params.departureDate = departure.selectedDate;
  params.departureTime = departure.selectedTime;
  params.timePreference = departure.timePreference;
  params.duration = duration;
  return this.axios.get(`/isochronreachablewaypoints?${params}`);
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
 * @param {Array} activeFields The active fields where all the filters are stored
 * @returns {Objet} Returns the query with all filters in it
 */
ItinevertService.prototype.enhanceQuery = function (baseQuery, activeFields) {
  let query = { ...baseQuery };
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

export default new ItinevertService();
