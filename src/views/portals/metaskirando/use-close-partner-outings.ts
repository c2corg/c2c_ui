// The outings of the partner sites close to a route or a waypoint (close-partner-outings.ts), for the "Last outings"
// box of their page: one GET /partner-outings when the document is shown, nothing elsewhere.
import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue';

import partnerOutingsService, { type PartnerOuting } from '@/js/apis/partner-outings-service';
import { useViewMode } from '@/js/composables/view-mode';
import config from '@/js/config';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';
import { closeOutings, closeQuery, referencePoints } from '@/views/portals/metaskirando/close-partner-outings';

/**
 * The outings of the other sites are not yet on camptocamp.org: they show where the /metaskirando entry of the main
 * menu does (main-menu.ts).
 */
export const partnerOutingsEnabled = () => config.isBackendSelectable || config.urls.name !== 'prod';

/**
 * The partner outings close to the document, the newest first: none for another document than a route or a waypoint,
 * outside of the normal view (edit preview, version, printing), and when the API fails or predates them (404).
 */
export function useClosePartnerOutings(document: Ref<C2cDocument>, lang: () => string | undefined) {
  const { isNormalView } = useViewMode();

  const isRoute = computed(() => document.value.type === 'r');
  const wanted = computed(
    () => partnerOutingsEnabled() && isNormalView.value && ['r', 'w'].includes(document.value.type ?? '')
  );
  const points = computed(() => (wanted.value ? referencePoints(document.value) : []));
  // a route lists the outings of its activities; a waypoint, all of them
  const query = computed(() =>
    closeQuery(points.value, {
      activities: isRoute.value ? (document.value.activities ?? undefined) : undefined,
      lang: lang(),
    })
  );

  const outings = ref<PartnerOuting[]>([]);
  let controller: AbortController | null = null;

  async function load() {
    controller?.abort();
    outings.value = [];
    if (!query.value) {
      return;
    }
    const current = (controller = new AbortController());
    try {
      const answer = await partnerOutingsService.getAll(query.value, current.signal);
      if (current === controller) {
        outings.value = closeOutings(answer.items ?? [], points.value).map(({ outing }) => outing);
      }
    } catch {
      // no partner outing: the box is the same as before
    }
  }

  watch(() => JSON.stringify(query.value), load, { immediate: true });
  onBeforeUnmount(() => controller?.abort());

  return { outings };
}
