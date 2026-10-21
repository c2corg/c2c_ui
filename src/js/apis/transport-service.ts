import axios, { type AxiosInstance } from 'axios';

import retryOn429 from './retry-on-429';

import concurrencyLimit from '@/js/concurrency-limit';
import config from '@/js/config';

// A document with many access waypoints, or the printing view showing up to 100 documents,
// would otherwise send one request per waypoint at once.
const limit = concurrencyLimit(4);

type DocumentId = string | number;

export type Stoparea = { distance?: number; [key: string]: unknown };

export type DocumentsStopareas = {
  stopareas: (Stoparea & { document_id: DocumentId; distance: number })[];
  // a document without any stop
  missingTransportForWaypoint: boolean;
  // per document id: whether it has stops
  documentResults: Record<string, boolean>;
};

class TransportService {
  axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      baseURL: config.urls.api,
    });
    retryOn429(this.axios);
  }

  /** Retrieves public transport stops for a given waypoint */
  getStopareas(waypointId: DocumentId) {
    return limit(() => this.axios.get<{ stopareas?: Stoparea[] }>(`/waypoints/${waypointId}/stopareas`));
  }

  /** Retrieves the public transport stops located in an extent ([xmin, ymin, xmax, ymax], EPSG:3857), with their lines and the waypoints they are associated with */
  getStopareasInExtent(extent: number[]) {
    return this.axios.get('/stopareas', { params: { bbox: extent.map(Math.round).join(',') } });
  }

  /** Get list of waypoint ids that are accessible in TC for a route */
  getWaypointsAccessibleTC(routeId: DocumentId) {
    return this.axios.get(`/routes/${routeId}/stopareaswaypoints`).then((response) => response.data);
  }

  /** Check if a waypoint is accessible by public transport */
  isReachable(waypointId: DocumentId): Promise<boolean> {
    return limit(() => this.axios.get<boolean>(`/waypoints/${waypointId}/isReachable`)).then(
      (response) => response.data
    );
  }

  /** Retrieves stops for multiple waypoints and determines if all are reachable */
  getStopareasForDocuments(documents?: ({ document_id?: DocumentId } | null)[]): Promise<DocumentsStopareas> {
    if (!documents || documents.length === 0) {
      return Promise.resolve({ stopareas: [], missingTransportForWaypoint: false, documentResults: {} });
    }

    const documentResults: Record<string, boolean> = {};
    const allStopareas: DocumentsStopareas['stopareas'] = [];

    const fetchPromises = documents.map((doc) => {
      if (!doc || !doc.document_id) {
        console.warn('Invalid document or missing ID :', doc);
        return Promise.resolve();
      }
      const documentId = doc.document_id;

      return this.getStopareas(documentId)
        .then((response) => {
          const data = response.data;
          const hasStopareas = !!data.stopareas && data.stopareas.length > 0;

          // Store whether this document has stops
          documentResults[documentId] = hasStopareas;

          if (hasStopareas) {
            // Add document_id to each stoparea for reference
            const stopareasForDocument = (data.stopareas ?? []).map((stoparea) => ({
              ...stoparea,
              document_id: documentId, // Associate stoparea with document
              distance: stoparea.distance ?? 0,
            }));
            allStopareas.push(...stopareasForDocument);
          }
        })
        .catch((error: unknown) => {
          console.error(`Error retrieving stops for document ${documentId}:`, error);
          documentResults[documentId] = false;
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
  }
}

export default new TransportService();
