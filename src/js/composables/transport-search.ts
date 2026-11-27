// The public transport search of a list of routes or waypoints (the `transport_*` parameters of the url, see
// transport-query): its isochrones for the map, and the round-trip checks of the documents of the page
import { computed, type Ref, ref, shallowRef, watch } from 'vue';
import { useRoute } from 'vue-router';

import itinevertService, {
  buildIsochroneOverlayDocuments,
  type DocumentType,
  MAX_ROUTE_THRESHOLD,
} from '@/js/apis/itinevert-service';
import { isDurationUnknown, type RoundTripResult } from '@/js/transport-accessibility';
import {
  hasTransportQuery,
  parseTransportQuery,
  type TransportContext,
  transportSearchKey,
} from '@/js/transport-query';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const durationUnknown = (document: C2cDocument) => isDurationUnknown(document as { duration_unknown?: boolean });

export function useTransportSearch(documentType: Ref<string>, documents: Ref<C2cDocument[]>) {
  const route = useRoute();

  // shallow: always replaced as a whole (and its geometries are deep)
  const transportContext = shallowRef<TransportContext | null>(null);
  const batchVerifying = ref(false);
  const batchError = ref(false);

  const hasTransportContext = computed(
    () => ['route', 'waypoint'].includes(documentType.value) && hasTransportQuery(route.query)
  );

  // identifies the search of the url: the other filters change the url, not the search
  const searchKey = computed(() => {
    const search = hasTransportContext.value ? parseTransportQuery(route.query) : null;
    return search ? transportSearchKey(search) : null;
  });

  /**
   * The documents of the page whose schedules are not checked yet: the results are kept while the search is the same.
   * The routes of unknown duration are never checked, their accessibility cannot be verified without their duration.
   */
  const documentsToVerify = computed(() => {
    const results = transportContext.value?.results ?? {};
    return documents.value
      .filter((document) => !results[document.document_id!] && !durationUnknown(document))
      .slice(0, MAX_ROUTE_THRESHOLD);
  });

  /** Number of documents of the page whose duration is unknown (the API lists them after the others) */
  const durationUnknownCount = computed(() => documents.value.filter(durationUnknown).length);
  const firstDurationUnknownIndex = computed(() => documents.value.findIndex(durationUnknown));

  const canVerifyBatch = computed(
    () => hasTransportContext.value && !!transportContext.value && documentsToVerify.value.length > 0
  );

  // the areas of the search, drawn on the map
  const isochroneOverlays = computed(() => buildIsochroneOverlayDocuments(transportContext.value));

  /**
   * Reads the transport search of the url, with its isochrones for the map. They are asked to the API, which computes
   * them once per search.
   */
  function loadTransportContext(key: string | null) {
    const search = key ? parseTransportQuery(route.query) : null;

    if (!search) {
      transportContext.value = null;
      return;
    }

    transportContext.value = {
      fromAddress: search.from,
      date: search.date,
      returnDate: search.returnDate,
      minDeparture: search.minDeparture,
      maxReturn: search.maxReturn,
      hikingDuration: search.hikingDuration,
      allerGeom: null,
      retourGeom: null,
      intersectionGeom: null,
      results: null,
    };

    itinevertService
      .getTransportIsochrones(search)
      .then(({ data }) => {
        // the search may have changed meanwhile
        if (searchKey.value === key && transportContext.value) {
          transportContext.value = {
            ...transportContext.value,
            allerGeom: data.aller_geom || null,
            retourGeom: data.retour_geom || null,
            intersectionGeom: data.intersection_geom || null,
          };
        }
      })
      .catch((error) => {
        // the isochrones are only shown on the map
        console.warn('Error while loading the transport isochrones:', error);
      });
  }

  /**
   * Checks the schedules of the documents of the page not checked yet (a job of the API, followed by its progress
   * stream), and adds their results to the ones already known. The page is the unit: the wait is short and the user
   * sees the results of what is on screen, then checks the next page if wanted.
   */
  async function verifyBatch() {
    const context = transportContext.value;
    if (!context || !canVerifyBatch.value || batchVerifying.value) {
      return;
    }

    batchVerifying.value = true;
    batchError.value = false;
    const type = documentType.value as DocumentType;
    const key = searchKey.value;

    const failed = (error?: unknown) => {
      console.warn('Error while checking the schedules:', error);
      batchError.value = true;
      batchVerifying.value = false;
    };

    try {
      await itinevertService.startRoundTripJob(
        documentsToVerify.value.map((document) => document.document_id!),
        type,
        context.date,
        context.minDeparture,
        context.maxReturn,
        context.fromAddress,
        context.hikingDuration || undefined,
        context.returnDate
      );

      itinevertService.monitorProgress(
        undefined,
        async () => {
          try {
            const response = await itinevertService.getRoundTripJobResult(type);
            const results: Record<number, RoundTripResult> = response.data?.result?.results ?? {};
            if (searchKey.value === key && transportContext.value) {
              transportContext.value = {
                ...transportContext.value,
                results: { ...transportContext.value.results, ...results },
              };
            }
            batchVerifying.value = false;
          } catch (error) {
            failed(error);
          }
        },
        failed,
        type === 'waypoint' ? 'journeyroundtripwaypoints' : 'journeyroundtriproutes'
      );
    } catch (error) {
      failed(error);
    }
  }

  watch(searchKey, loadTransportContext, { immediate: true });

  return {
    transportContext,
    hasTransportContext,
    documentsToVerify,
    durationUnknownCount,
    firstDurationUnknownIndex,
    canVerifyBatch,
    batchVerifying,
    batchError,
    isochroneOverlays,
    verifyBatch,
  };
}
