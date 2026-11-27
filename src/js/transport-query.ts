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

import type { LocationQuery, LocationQueryRaw } from 'vue-router';

import type { From, IsochroneGeometry, TransportSearch } from '@/js/apis/itinevert-service';
import type { RoundTripResult } from '@/js/transport-accessibility';

/** A transport search read from the url: the starting point is the rounded "lon;lat" string */
export type ParsedTransportSearch = {
  from: string;
  date: string;
  returnDate: string | null;
  minDeparture: string;
  maxReturn: string;
  maxDuration: number | null;
  hikingDuration: number | null;
};

/**
 * The transport search of the url as the list of documents uses it: the search, its isochrones (for the map) and the
 * round-trip checks already made, by document id
 */
export type TransportContext = {
  fromAddress: string;
  date: string;
  returnDate: string | null;
  minDeparture: string;
  maxReturn: string;
  hikingDuration: number | null;
  allerGeom: IsochroneGeometry;
  retourGeom: IsochroneGeometry;
  intersectionGeom: IsochroneGeometry;
  results: Record<number, RoundTripResult> | null;
};

/** An address selection of input-address (a GeoJSON feature of Photon) */
export type AddressSelection = {
  type?: string;
  geometry?: { type?: string; coordinates?: number[] };
  properties?: { name?: string; street?: string; city?: string; country?: string };
};

const FIELDS = {
  from: 'from',
  date: 'date',
  returnDate: 'return_date',
  minDeparture: 'min_departure',
  maxReturn: 'max_return',
  maxDuration: 'max_duration',
  hikingDuration: 'hiking_duration',
} as const;

type FieldKey = keyof typeof FIELDS;

/**
 * Formats a starting point as the rounded "lon;lat" string used in the query string
 *
 * @param from An address selection (`geometry.coordinates`), `[lon, lat]` or "lon;lat"
 * @returns Null if there is no valid coordinates
 */
export function formatTransportFrom(from: From): string | null {
  let coordinates: unknown = from;
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
export function parseTransportFrom(from: string): number[] {
  return from.split(';').map((coordinate) => Number(coordinate));
}

/**
 * The return date of a search when it is another day than the departure (a trip of several days), null otherwise: the
 * return date is optional, and the API takes the departure date for it when it is not sent
 *
 * @param search `{ date, returnDate }`
 * @returns
 */
export function laterReturnDate(search: { date?: string | null; returnDate?: string | null }): string | null {
  return search.returnDate && search.returnDate !== search.date ? search.returnDate : null;
}

/**
 * The search space is kept small, as on the API (each new search costs 2 Navitia isochrones, and the searches of
 * different users share its cache): the times are on the quarter hour, the dates within 6 months
 */
export const TIME_STEP_MINUTES = 15;
export const MAX_MONTHS_AHEAD = 6;

const pad = (value: number) => String(value).padStart(2, '0');

/** "YYYY-MM-DD" of a day, in the time zone of the browser */
export function isoDay(day: Date): string {
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}

/** The first and last dates of a search: from today to 6 months ahead (the same day, or the last day of a shorter month) */
export function transportDateRange(today: Date = new Date()): { min: string; max: string } {
  const last = new Date(today.getFullYear(), today.getMonth() + MAX_MONTHS_AHEAD, 1);
  const lastDay = new Date(last.getFullYear(), last.getMonth() + 1, 0).getDate();
  last.setDate(Math.min(today.getDate(), lastDay));
  return { min: isoDay(today), max: isoDay(last) };
}

/**
 * A "HH:MM" time on the quarter hour: rounded up for a departure ("after"), down for a return ("before"), so that the
 * search stays within the hours the user gave
 */
export function roundTime(value: string, direction: 'up' | 'down'): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(value ?? '');
  if (!match) {
    return value;
  }
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  const rounded = (direction === 'up' ? Math.ceil : Math.floor)(minutes / TIME_STEP_MINUTES) * TIME_STEP_MINUTES;
  // not past the last quarter of the day
  const bounded = Math.min(rounded, 24 * 60 - TIME_STEP_MINUTES);
  return `${pad(Math.floor(bounded / 60))}:${pad(bounded % 60)}`;
}

/**
 * Checks the dates and times of a search
 *
 * @param search `{ date, returnDate, minDeparture, maxReturn }`
 * @returns The problem, if any: a return date before the departure date, or (for a return the same day) a return time
 *   that is not after the departure time, or a date out of transportDateRange
 */
export function transportDatesError(search: {
  date?: string | null;
  returnDate?: string | null;
  minDeparture?: string | null;
  maxReturn?: string | null;
}): 'return-before-departure' | 'return-time-before-departure-time' | 'date-out-of-range' | null {
  const { min, max } = transportDateRange();
  if ([search.date, search.returnDate].some((day) => day && (day < min || day > max))) {
    return 'date-out-of-range';
  }

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
 * @param search `{ from, date, returnDate, minDeparture, maxReturn, maxDuration, hikingDuration }`, the return date and
 *   the last two being optional
 * @returns The `transport_*` parameters
 */
export function buildTransportQuery(search: TransportSearch): Record<string, string> {
  const query: Record<string, string> = {};

  for (const [key, name] of Object.entries(FIELDS) as [FieldKey, string][]) {
    let value: unknown;
    if (key === 'from') {
      value = formatTransportFrom(search.from);
    } else if (key === 'returnDate') {
      value = laterReturnDate(search);
    } else if (key === 'minDeparture' || key === 'maxReturn') {
      value = roundTime(search[key], key === 'minDeparture' ? 'up' : 'down');
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
export function hasTransportQuery(query: LocationQuery | null | undefined): boolean {
  return Boolean(query?.[TRANSPORT_QUERY_PREFIX + FIELDS.from]);
}

/**
 * Reads the transport search of a query string
 *
 * @returns `{ from, date, returnDate, minDeparture, maxReturn, maxDuration, hikingDuration }` (the return date being
 *   null for a return the same day), or null if the query does not contain a complete search
 */
export function parseTransportQuery(query: LocationQuery | null | undefined): ParsedTransportSearch | null {
  const read = (key: FieldKey): string | undefined => {
    const value = query?.[TRANSPORT_QUERY_PREFIX + FIELDS[key]];
    return (Array.isArray(value) ? value[0] : value) ?? undefined;
  };

  const from = formatTransportFrom(read('from') ?? null);
  const date = read('date');
  // the links made before the times were on the quarter hour
  const minDeparture = read('minDeparture') && roundTime(read('minDeparture')!, 'up');
  const maxReturn = read('maxReturn') && roundTime(read('maxReturn')!, 'down');

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
export function transportSearchKey(search: TransportSearch): string {
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
export function withoutTransportQuery(query: LocationQuery): LocationQueryRaw {
  return Object.fromEntries(Object.entries(query).filter(([name]) => !name.startsWith(TRANSPORT_QUERY_PREFIX)));
}

/** Number of starting points remembered to be proposed again */
export const MAX_RECENT_ADDRESSES = 5;

/**
 * Adds an address to the recent ones: first, without duplicate (two addresses at the same rounded point are the same
 * starting point)
 *
 * @param recent The recent address selections, most recent first
 * @param address The address selection to add
 * @returns The new list, at most MAX_RECENT_ADDRESSES long
 */
export function addRecentAddress(recent: AddressSelection[], address: AddressSelection): AddressSelection[] {
  const from = formatTransportFrom(address);
  if (!from) {
    return recent;
  }

  return [address, ...recent.filter((other) => formatTransportFrom(other) !== from)].slice(0, MAX_RECENT_ADDRESSES);
}
