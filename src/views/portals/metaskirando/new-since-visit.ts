// "New since last visit", per source. The legacy site kept the highest id seen per site in cookies; the ids of the
// sources are not ordered (nor numbers for all of them), so the ids shown are kept instead: an outing is new when
// its source showed it neither at the previous visit nor before. The first visit to a source shows nothing as new.
// A visit lasts VISIT_GAP: a reload inside it keeps the same comparison (the legacy "current" cookie, 15 minutes).
import { readVisits, writeVisits, type Visits } from './metaskirando-storage';

import type { PartnerOuting } from '@/js/apis/partner-outings-service';

export const VISIT_GAP_MS = 15 * 60 * 1000;
// the ids kept per source: the loaded set is at most a few hundreds
export const MAX_SEEN = 500;

/**
 * Records that these outings were shown, and tells which of them are new. Pass the same tracker for the whole life of
 * the page: the baseline of a source is fixed when it is first seen, filters changing later do not move it.
 */
export function createVisitTracker(now: () => number = Date.now) {
  // the visits as stored, updated as the page shows outings; null until the first observation
  let visits: Visits | null = null;
  const baselines = new Map<string, Set<string> | null>();

  function observe(items: PartnerOuting[]) {
    visits ??= readVisits();
    const bySource = new Map<string, string[]>();
    for (const item of items) {
      bySource.set(item.source, [...(bySource.get(item.source) ?? []), item.id]);
    }
    for (const [source, ids] of bySource) {
      const previous = visits[source];
      if (!baselines.has(source)) {
        // a source seen for the first time by this page: a new visit, or the one still going on
        const sameVisit = previous && now() - previous.at < VISIT_GAP_MS;
        const baseline = sameVisit ? previous.baseline : (previous?.seen ?? null);
        baselines.set(source, baseline && new Set(baseline));
        visits[source] = {
          seen: dedupe([...(sameVisit ? previous.seen : []), ...ids]),
          baseline: baseline ?? null,
          at: sameVisit ? previous.at : now(),
        };
      } else {
        visits[source] = { ...visits[source], seen: dedupe([...visits[source].seen, ...ids]) };
      }
    }
    if (bySource.size) {
      writeVisits(visits);
    }
  }

  /** Whether the source showed the outing neither at its previous visit nor before */
  function isNew(outing: PartnerOuting) {
    const baseline = baselines.get(outing.source);
    return !!baseline && !baseline.has(outing.id);
  }

  return { observe, isNew };
}

const dedupe = (ids: string[]) => [...new Set(ids)].slice(-MAX_SEEN);
