/*
 * The public transport filter of the Topoguide lives in the query string, with the parameters of the search (not
 * with the list of the matching documents): the url stays short and can be shared, and the API computes (and caches)
 * the matching documents from it.
 */

/** Prefix of the transport parameters in the query string */
export const TRANSPORT_QUERY_PREFIX = 'transport_';

/**
 * Number of decimals kept for the starting point (about 110 m). The API rounds it the same way: close starting points
 * share the same cached search, and the url does not change for a point moved by a few meters.
 */
export const COORDINATE_DECIMALS = 3;

const FIELDS = {
  from: 'from',
  date: 'date',
  returnDate: 'return_date',
  minDeparture: 'min_departure',
  maxReturn: 'max_return',
  maxDuration: 'max_duration',
  hikingDuration: 'hiking_duration',
};

/**
 * Formats a starting point as the rounded "lon;lat" string used in the query string
 *
 * @param {Object | Array | String} from An address selection (`geometry.coordinates`), `[lon, lat]` or "lon;lat"
 * @returns {String | null} Null if there is no valid coordinates
 */
export function formatTransportFrom(from) {
  let coordinates = from;
  if (typeof from === 'string') {
    coordinates = from.split(';');
  } else if (!Array.isArray(from)) {
    coordinates = from?.geometry?.coordinates;
  }

  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return null;
  }

  const [lon, lat] = coordinates.map((coordinate) => Number(coordinate));
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    return null;
  }

  return `${lon.toFixed(COORDINATE_DECIMALS)};${lat.toFixed(COORDINATE_DECIMALS)}`;
}

/** Splits a "lon;lat" string into `[lon, lat]` numbers */
export function parseTransportFrom(from) {
  return from.split(';').map((coordinate) => Number(coordinate));
}

/**
 * The return date of a search when it is another day than the departure (a trip of several days), null otherwise: the
 * return date is optional, and the API takes the departure date for it when it is not sent
 *
 * @param {Object} search `{ date, returnDate }`
 * @returns {String | null}
 */
export function laterReturnDate(search) {
  return search.returnDate && search.returnDate !== search.date ? search.returnDate : null;
}

/**
 * Checks the dates and times of a search
 *
 * @param {Object} search `{ date, returnDate, minDeparture, maxReturn }`
 * @returns {'return-before-departure' | 'return-time-before-departure-time' | null} The problem, if any: a return date
 *   before the departure date, or (for a return the same day) a return time that is not after the departure time
 */
export function transportDatesError(search) {
  if (search.returnDate && search.date && search.returnDate < search.date) {
    return 'return-before-departure';
  }

  if (!laterReturnDate(search) && search.minDeparture && search.maxReturn && search.maxReturn <= search.minDeparture) {
    return 'return-time-before-departure-time';
  }

  return null;
}

/**
 * Builds the query string parameters of a transport search
 *
 * @param {Object} search `{ from, date, returnDate, minDeparture, maxReturn, maxDuration, hikingDuration }`, the return
 *   date and the last two being optional
 * @returns {Object} The `transport_*` parameters
 */
export function buildTransportQuery(search) {
  const query = {};

  for (const [key, name] of Object.entries(FIELDS)) {
    let value;
    if (key === 'from') {
      value = formatTransportFrom(search.from);
    } else if (key === 'returnDate') {
      value = laterReturnDate(search);
    } else {
      value = search[key];
    }
    if (value !== undefined && value !== null && value !== '') {
      query[TRANSPORT_QUERY_PREFIX + name] = String(value);
    }
  }

  return query;
}

/** Whether a query string (the `$route.query`) contains a transport search */
export function hasTransportQuery(query) {
  return Boolean(query?.[TRANSPORT_QUERY_PREFIX + FIELDS.from]);
}

/**
 * Reads the transport search of a query string
 *
 * @returns {Object | null} `{ from, date, returnDate, minDeparture, maxReturn, maxDuration, hikingDuration }` (the
 *   return date being null for a return the same day), or null if the query does not contain a complete search
 */
export function parseTransportQuery(query) {
  const read = (key) => {
    const value = query?.[TRANSPORT_QUERY_PREFIX + FIELDS[key]];
    return Array.isArray(value) ? value[0] : value;
  };

  const from = formatTransportFrom(read('from') ?? null);
  const date = read('date');
  const minDeparture = read('minDeparture');
  const maxReturn = read('maxReturn');

  if (!from || !date || !minDeparture || !maxReturn) {
    return null;
  }

  const maxDuration = Number(read('maxDuration'));
  const hikingDuration = Number(read('hikingDuration'));

  return {
    from,
    date,
    returnDate: laterReturnDate({ date, returnDate: read('returnDate') }),
    minDeparture,
    maxReturn,
    maxDuration: maxDuration > 0 ? maxDuration : null,
    hikingDuration: hikingDuration > 0 ? hikingDuration : null,
  };
}

/** A string identifying a transport search: two equal searches give the same key */
export function transportSearchKey(search) {
  return JSON.stringify([
    search.from,
    search.date,
    laterReturnDate(search),
    search.minDeparture,
    search.maxReturn,
    search.maxDuration ?? null,
    search.hikingDuration ?? null,
  ]);
}

/** A copy of a query string without the transport parameters */
export function withoutTransportQuery(query) {
  return Object.fromEntries(Object.entries(query).filter(([name]) => !name.startsWith(TRANSPORT_QUERY_PREFIX)));
}

/** Number of starting points remembered to be proposed again */
export const MAX_RECENT_ADDRESSES = 5;

/**
 * Adds an address to the recent ones: first, without duplicate (two addresses at the same rounded point are the same
 * starting point)
 *
 * @param {Object[]} recent The recent address selections, most recent first
 * @param {Object} address The address selection to add
 * @returns {Object[]} The new list, at most MAX_RECENT_ADDRESSES long
 */
export function addRecentAddress(recent, address) {
  const from = formatTransportFrom(address);
  if (!from) {
    return recent;
  }

  return [address, ...recent.filter((other) => formatTransportFrom(other) !== from)].slice(0, MAX_RECENT_ADDRESSES);
}
