import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { transform } from 'ol/proj';

import navitiaService from './navitia-service';

import config from '@/js/config';

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

// coordinates of any geometry: a position, or nested arrays of positions
export type NestedCoordinates = number[] | NestedCoordinates[];

// query parameters of the API, the undefined, null and empty ones being skipped
export type Query = Record<string, unknown>;

// the starting point: an address selection (`geometry.coordinates`), `[lon, lat]` or an already formatted "lon;lat"
export type From = string | number[] | { geometry?: { coordinates?: number[] } } | null | undefined;

export type DocumentType = 'route' | 'waypoint';

// a transport search, as far as the isochrones go
export type TransportSearch = {
  from: From;
  // "YYYY-MM-DD"
  date: string;
  // "YYYY-MM-DD", the day of the return of a trip of several days: when not set, the return is the day of the departure
  returnDate?: string | null;
  // "HH:MM"
  minDeparture: string;
  // "HH:MM"
  maxReturn: string;
  maxDuration?: number | null;
  hikingDuration?: number | null;
};

// the geometry of an isochrone, in EPSG:4326 (GeoJSON), or an empty string when it could not be computed
export type IsochroneGeometry = { type: string; coordinates: NestedCoordinates } | '' | null | undefined;

export type OverlayContext = {
  allerGeom?: IsochroneGeometry;
  retourGeom?: IsochroneGeometry;
  intersectionGeom?: IsochroneGeometry;
};

type OverlayStyle = typeof POLYGON_STYLE;

const isPosition = (node: NestedCoordinates): node is number[] =>
  typeof node[0] === 'number' && typeof node[1] === 'number';

/**
 * Formats a "from" input into the Navitia "lon;lat" coordinates string.
 *
 * Accepts either an address selection object (as returned by `input-address`, with `geometry.coordinates`), a plain
 * `[lon, lat]` array, or an already-formatted string.
 */
function formatFromCoordinates(from: From): string {
  if (typeof from === 'string') return from;
  const coordinates = Array.isArray(from) ? from : from?.geometry?.coordinates;
  if (!coordinates) return '';
  return navitiaService.formatCoordinates(coordinates);
}

/** Resolve which job family (route segment) to use depending on the document type. */
function roundTripJobFamily(documentType: DocumentType) {
  return documentType === 'waypoint' ? 'journeyroundtripwaypoints' : 'journeyroundtriproutes';
}

/**
 * The return date to send: only for a return another day than the departure, as the API takes the departure date for
 * the return date when it is not sent.
 */
function laterReturnDate(date: string, returnDate?: string | null) {
  return returnDate && returnDate !== date ? returnDate : undefined;
}

class ItinevertService {
  axios: AxiosInstance = axios.create({ baseURL: config.urls.api });
  jobID: string | null = null;
  eventSource: EventSource | null = null;

  /** --------------- Query to API --------------- */

  /**
   * Retrieves the outbound/return/intersection isochrones of a public transport search. The API computes them once per
   * search (the topoguide filters on the same search, with its parameters in the query string, see `transport-query`).
   *
   * Resolves to `{ aller_geom, retour_geom, intersection_geom }`.
   */
  getTransportIsochrones(search: TransportSearch) {
    const params = this.enhanceQuery(
      {
        from: formatFromCoordinates(search.from),
        date: search.date,
        min_departure: search.minDeparture,
        max_return: search.maxReturn,
      },
      { return_date: laterReturnDate(search.date, search.returnDate), max_duration: search.maxDuration }
    );

    return this.axios.get('/navitia/transportisochrones', { params });
  }

  /**
   * Synchronously checks whether a single document is reachable both ways (aller + retour) by public transport.
   *
   * Resolves to `{ aller: {found, departure, arrival}, retour: {...}, compatible }`.
   *
   * @param date The departure date, "YYYY-MM-DD"
   * @param minDeparture The minimum departure time, "HH:MM"
   * @param maxReturn The maximum return time, "HH:MM"
   * @param hikingDurationMinutes Optional hiking duration, in minutes, used to check the compatibility of the
   *   aller/retour margin against the actual course duration
   * @param returnDate Optional return date, "YYYY-MM-DD", for a trip of several days (the departure date by default)
   */
  getRoundTripReachable(
    documentId: number,
    documentType: DocumentType,
    date: string,
    minDeparture: string,
    maxReturn: string,
    from: From,
    hikingDurationMinutes?: number | null,
    returnDate?: string | null
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
      { hiking_duration: hikingDurationMinutes, return_date: laterReturnDate(date, returnDate) }
    );

    return this.axios.get('/navitia/roundtripreachable', { params });
  }

  /**
   * Starts a batch round-trip verification job for a shortlist of documents (capped at MAX_ROUTE_THRESHOLD). The
   * documents whose duration is unknown must not be part of it: their accessibility cannot be verified.
   *
   * Resolves to the job ID (also stored in `this.jobID`).
   */
  async startRoundTripJob(
    documentIds: number[],
    documentType: DocumentType,
    date: string,
    minDeparture: string,
    maxReturn: string,
    from: From,
    hikingDurationMinutes?: number | null,
    returnDate?: string | null
  ): Promise<string> {
    const params = this.enhanceQuery(
      {
        ids: documentIds.join(','),
        from: formatFromCoordinates(from),
        date,
        min_departure: minDeparture,
        max_return: maxReturn,
      },
      { hiking_duration: hikingDurationMinutes, return_date: laterReturnDate(date, returnDate) }
    );

    const family = roundTripJobFamily(documentType);
    this.jobID = (await this.axios.get(`/navitia/${family}/start`, { params })).data['job_id'];
    return this.jobID as string;
  }

  /**
   * Retrieves the result of a batch round-trip verification job: `{ status, result: { results: { <document_id>: {aller,
   * retour, compatible} }, total } }`. The result of a document whose accessibility cannot be verified (its duration is
   * unknown) is `{ compatible: null, duration_unknown: true }`.
   */
  getRoundTripJobResult(documentType: DocumentType, jobId: string | null = this.jobID): Promise<AxiosResponse> {
    const family = roundTripJobFamily(documentType);
    return this.axios.get(`/navitia/${family}/result/${jobId}`);
  }

  /**
   * Opens an SSE connection to monitor the progress of a background job (either the round-trip verification job
   * families above, or any other `/navitia/<family>/progress/<jobId>` route following the same protocol).
   *
   * @param onProgress Callback invoked with the raw SSE message data on each progress event
   * @param onDone Callback invoked once the job is done
   * @param onError Callback invoked with the raw SSE error data if the job fails
   * @param family The route segment identifying the job family, e.g. "journeyroundtriproutes"
   */
  monitorProgress(
    onProgress: ((data: string) => void) | undefined,
    onDone: (() => void) | undefined,
    onError: ((data?: unknown) => void) | undefined,
    family: string
  ): EventSource {
    if (!this.jobID) {
      throw new Error('No job started yet');
    }

    // Close any existing stream just in case
    this.cancelProgress();

    const eventSource = new EventSource(`${config.urls.api}/navitia/${family}/progress/${this.jobID}`);
    this.eventSource = eventSource;

    eventSource.onmessage = (event) => {
      onProgress?.(event.data);
    };

    eventSource.addEventListener('done', () => {
      onDone?.();
      this.cancelProgress(true);
    });

    eventSource.addEventListener('error', (event) => {
      onError?.((event as MessageEvent)?.data);
      this.cancelProgress(true);
    });

    return eventSource;
  }

  cancelProgress(resetJob = false) {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (resetJob) {
      this.jobID = null;
    }
  }

  /** --------------- Helper functions for queries --------------- */

  /** Enhance a base query with extra fields, skipping keys that are undefined/null/empty. */
  enhanceQuery(baseQuery: Query, newQuery: Query): Query {
    const query = { ...baseQuery };
    for (const key in newQuery) {
      if (Object.hasOwn(newQuery, key) && newQuery[key]) {
        // Add or update the property in the query, only if defined
        query[key] = newQuery[key];
      }
    }
    return query;
  }
}

/** Project geometry's coordinates from sourceProj to targetProj */
export function projectCoordinates(
  coords: NestedCoordinates[],
  sourceProj = 'EPSG:4326',
  targetProj = 'EPSG:3857'
): NestedCoordinates[] {
  return coords.map(function recur(node: NestedCoordinates): NestedCoordinates {
    if (isPosition(node)) {
      return transform([node[0], node[1]], sourceProj, targetProj);
    }
    return (node as NestedCoordinates[]).map(recur);
  });
}

/** Create a bbox string out of geometry's coordinates */
export function createBboxString(coords: NestedCoordinates): string {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  (function recur(node: NestedCoordinates) {
    if (isPosition(node)) {
      const x = node[0],
        y = node[1];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      return;
    }
    (node as NestedCoordinates[]).forEach(recur);
  })(coords);
  return `${minX},${minY},${maxX},${maxY}`;
}

/**
 * Projects a GeoJSON geometry (as returned by the transportisochrones/roundtrip endpoints, in EPSG:4326) into EPSG:3857
 * so it can be fed straight into a synthetic map document's `geom`. Null when the geometry is absent ("", null).
 */
export function projectGeometry(geometry: IsochroneGeometry) {
  if (!geometry || typeof geometry !== 'object' || !geometry.coordinates) {
    return null;
  }
  return { type: geometry.type, coordinates: projectCoordinates(geometry.coordinates as NestedCoordinates[]) };
}

/**
 * Builds the up-to-3 synthetic "area" map documents used to overlay the aller/retour/intersection isochrones on the
 * Topoguide map, following the same synthetic-document pattern as the rest of the app (negative `document_id`, `type:
 * 'a'`, `nonInteractive` property).
 *
 * @param context The stashed Itinevert search context: `{ allerGeom, retourGeom, intersectionGeom }`
 */
export function buildIsochroneOverlayDocuments(context?: OverlayContext | null) {
  if (!context) return [];

  const overlays: { id: number; geometry: IsochroneGeometry; style: OverlayStyle }[] = [
    { id: ALLER_SYNTHETIC_ID, geometry: context.allerGeom, style: ALLER_POLYGON_STYLE },
    { id: RETOUR_SYNTHETIC_ID, geometry: context.retourGeom, style: RETOUR_POLYGON_STYLE },
    { id: INTERSECTION_SYNTHETIC_ID, geometry: context.intersectionGeom, style: INTERSECTION_POLYGON_STYLE },
  ];

  return overlays.flatMap(({ id, geometry, style }) => {
    const projected = projectGeometry(geometry);
    if (!projected) return [];

    return [
      {
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
      },
    ];
  });
}

export default new ItinevertService();
