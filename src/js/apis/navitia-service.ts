import axios, { type AxiosInstance } from 'axios';

import config from '@/js/config';

export type DatetimeRepresents = 'departure' | 'arrival';

export type JourneyParams = {
  // coordinates, "longitude;latitude"
  from: string;
  to: string;
  // ISO 8601
  datetime: string;
  datetime_represents: DatetimeRepresents;
};

// optional Navitia query parameters, passed as they are
export type JourneyOptions = Record<string, string | number | boolean>;

export type JourneyPreferences = {
  // walking speed in m/s (Navitia's default: 1.12)
  walking_speed?: number;
  // max walking duration in seconds
  max_walking_duration?: number;
  max_nb_transfers?: number;
  timeframe_duration?: number;
  min_nb_journeys?: number;
  wheelchair?: boolean;
  forbidden_modes?: string[];
};

// what the UI reads of a journey of the Navitia API
export type Journey = {
  duration?: number;
  departure_date_time?: string;
  arrival_date_time?: string;
  nb_transfers?: number;
  durations?: { walking?: number; total?: number };
  sections?: { mode?: string; duration?: number; from?: { name?: string }; to?: { name?: string } }[];
};

class NavitiaService {
  axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      baseURL: config.urls.api,
    });
  }

  /** Retrieves journeys between two points using Navitia API */
  getJourneys(params: JourneyParams, options: JourneyOptions = {}) {
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
  }

  /** Retrieves journeys with simplified parameters for departure */
  getJourneysFromDeparture(
    fromCoords: string,
    toCoords: string,
    departureTime: string | Date,
    options: JourneyOptions = {}
  ) {
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
  }

  /** Retrieves journeys with simplified parameters for arrival */
  getJourneysFromArrival(
    fromCoords: string,
    toCoords: string,
    arrivalTime: string | Date,
    options: JourneyOptions = {}
  ) {
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
  }

  /** Retrieves journeys with common optional parameters preset */
  getJourneysWithPreferences(
    fromCoords: string,
    toCoords: string,
    datetime: string | Date,
    datetime_represents: DatetimeRepresents,
    preferences: JourneyPreferences = {}
  ) {
    const options: JourneyOptions = {};

    if (preferences.walking_speed) {
      options.walking_speed = preferences.walking_speed;
    }

    if (preferences.max_walking_duration) {
      options.max_walking_duration_to_pt = preferences.max_walking_duration;
    }

    if (preferences.max_nb_transfers) {
      options.max_nb_transfers = preferences.max_nb_transfers;
    }

    if (preferences.timeframe_duration) {
      options.timeframe_duration = preferences.timeframe_duration;
    }

    if (preferences.min_nb_journeys) {
      options.min_nb_journeys = preferences.min_nb_journeys;
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
  }

  /** Formats coordinates from [longitude, latitude] array to string format: "longitude;latitude" */
  formatCoordinates(coords: unknown): string {
    if (!Array.isArray(coords) || coords.length !== 2) {
      throw new Error('Coordinates must be an array of [longitude, latitude]');
    }
    return `${coords[0]};${coords[1]}`;
  }

  /** Extracts journey duration in seconds from Navitia response */
  getJourneyDuration(journey?: Journey | null): number {
    return journey?.duration || 0;
  }

  /** Extracts readable journey summary from Navitia response */
  getJourneySummary(journey?: Journey | null) {
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
  }

  // the error of a failed query, as the API gives it: JSON, a Python dict as a string, or already parsed
  handleQueryError(data: unknown): unknown {
    let queryError: unknown = '';
    if (typeof data === 'string') {
      try {
        // First try parsing as-is (valid JSON)
        queryError = JSON.parse(data);
      } catch {
        try {
          // Fallback: attempt to handle Python-style single-quoted dicts
          // Only replace quotes at key/value boundaries, not within strings
          queryError = JSON.parse(data.replace(/'/g, '"'));
        } catch {
          queryError = { id: 'parse_error', message: String(data) };
        }
      }
    } else {
      queryError = data;
    }
    return queryError;
  }

  /** Read the query error of a failed request: the error the API answered, or the failure itself. */
  handleRequestError(error: unknown): { id?: string; message?: string } {
    // The API answers {status: 'error', errors: [{location, name, description}]}. For an
    // error of Navitia, the description is its id (e.g. no_solution), which
    // ItinevertNoResultView may translate.
    const response = (error as { response?: { data?: { errors?: { description?: unknown }[] } } })?.response;
    const description = response?.data?.errors?.[0]?.description;
    if (typeof description === 'string' && /^\w+$/.test(description)) {
      return { id: description, message: description };
    }
    return { message: (error as Error)?.message };
  }
}

export default new NavitiaService();
