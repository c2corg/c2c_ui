import axios from 'axios';

import config from '@/js/config';

function NavitiaService() {
  this.axios = axios.create({
    baseURL: config.urls.api,
  });
}

/**
 * Retrieves journeys between two points using Navitia API
 *
 * @param {Object} params - Journey parameters
 * @param {string} params.from - Departure coordinates (format: "longitude;latitude")
 * @param {string} params.to - Arrival coordinates (format: "longitude;latitude")
 * @param {string} params.datetime - Date and time in ISO 8601 format
 * @param {string} params.datetime_represents - 'departure' or 'arrival'
 * @param {Object} [options] - Optional parameters
 * @returns {Promise}
 */
NavitiaService.prototype.getJourneys = function (params, options = {}) {
  const { from, to, datetime, datetime_represents } = params;

  if (!from || !to || !datetime || !datetime_represents) {
    return Promise.reject(new Error('Missing required parameters: from, to, datetime, datetime_represents'));
  }

  const queryParams = {
    from,
    to,
    datetime,
    datetime_represents,
    ...options, // Spread optional parameters
  };

  return this.axios.get('/navitia/journeys', { params: queryParams });
};

/**
 * Retrieves journeys with simplified parameters for departure
 *
 * @param {string} fromCoords - Departure coordinates (format: "longitude;latitude")
 * @param {string} toCoords - Arrival coordinates (format: "longitude;latitude")
 * @param {string | Date} departureTime - Departure time (Date object or ISO string)
 * @param {Object} [options] - Optional parameters
 * @returns {Promise}
 */
NavitiaService.prototype.getJourneysFromDeparture = function (fromCoords, toCoords, departureTime, options = {}) {
  const datetime = departureTime instanceof Date ? departureTime.toISOString() : departureTime;

  return this.getJourneys(
    {
      from: fromCoords,
      to: toCoords,
      datetime,
      datetime_represents: 'departure',
    },
    options
  );
};

/**
 * Retrieves journeys with simplified parameters for arrival
 *
 * @param {string} fromCoords - Departure coordinates (format: "longitude;latitude")
 * @param {string} toCoords - Arrival coordinates (format: "longitude;latitude")
 * @param {string | Date} arrivalTime - Arrival time (Date object or ISO string)
 * @param {Object} [options] - Optional parameters
 * @returns {Promise}
 */
NavitiaService.prototype.getJourneysFromArrival = function (fromCoords, toCoords, arrivalTime, options = {}) {
  const datetime = arrivalTime instanceof Date ? arrivalTime.toISOString() : arrivalTime;

  return this.getJourneys(
    {
      from: fromCoords,
      to: toCoords,
      datetime,
      datetime_represents: 'arrival',
    },
    options
  );
};

/**
 * Retrieves journeys with common optional parameters preset
 *
 * @param {string} fromCoords - Departure coordinates
 * @param {string} toCoords - Arrival coordinates
 * @param {string | Date} datetime - Date and time
 * @param {string} datetime_represents - 'departure' or 'arrival'
 * @param {Object} [preferences] - User preferences
 * @param {number} [preferences.walking_speed] - Walking speed in m/s (default: 1.12)
 * @param {number} [preferences.max_walking_duration] - Max walking duration in seconds
 * @param {boolean} [preferences.wheelchair] - Wheelchair accessibility
 * @param {string[]} [preferences.forbidden_modes] - Forbidden transport modes
 * @returns {Promise}
 */
NavitiaService.prototype.getJourneysWithPreferences = function (
  fromCoords,
  toCoords,
  datetime,
  datetime_represents,
  preferences = {}
) {
  const options = {};

  if (preferences.walking_speed) {
    options.walking_speed = preferences.walking_speed;
  }

  if (preferences.max_walking_duration) {
    options.max_walking_duration_to_pt = preferences.max_walking_duration;
  }

  if (preferences.max_nb_transfers) {
    options.max_nb_transfers = preferences.max_nb_transfers;
  }

  if (preferences.wheelchair !== undefined) {
    options.wheelchair = preferences.wheelchair;
  }

  if (preferences.forbidden_modes && preferences.forbidden_modes.length > 0) {
    options.forbidden_uris = preferences.forbidden_modes.join(',');
  }

  return this.getJourneys(
    {
      from: fromCoords,
      to: toCoords,
      datetime: datetime instanceof Date ? datetime.toISOString() : datetime,
      datetime_represents,
    },
    options
  );
};

/**
 * Formats coordinates from [longitude, latitude] array to string format
 *
 * @param {number[]} coords - [longitude, latitude]
 * @returns {string} - "longitude;latitude"
 */
NavitiaService.prototype.formatCoordinates = function (coords) {
  if (!Array.isArray(coords) || coords.length !== 2) {
    throw new Error('Coordinates must be an array of [longitude, latitude]');
  }
  return `${coords[0]};${coords[1]}`;
};

/**
 * Extracts journey duration in seconds from Navitia response
 *
 * @param {Object} journey - Journey object from Navitia API
 * @returns {number} - Duration in seconds
 */
NavitiaService.prototype.getJourneyDuration = function (journey) {
  return journey?.duration || 0;
};

/**
 * Extracts readable journey summary from Navitia response
 *
 * @param {Object} journey - Journey object from Navitia API
 * @returns {Object} - Simplified journey info
 */
NavitiaService.prototype.getJourneySummary = function (journey) {
  if (!journey) return null;

  return {
    duration: journey.duration,
    departure_datetime: journey.departure_date_time,
    arrival_datetime: journey.arrival_date_time,
    nb_transfers: journey.nb_transfers || 0,
    walking_duration: journey.durations?.walking || 0,
    total_duration: journey.durations?.total || journey.duration,
    sections:
      journey.sections?.map((section) => ({
        mode: section.mode,
        duration: section.duration,
        from: section.from?.name,
        to: section.to?.name,
      })) || [],
  };
};

export default new NavitiaService();
