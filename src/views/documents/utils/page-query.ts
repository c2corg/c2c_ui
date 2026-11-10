// Offset and limit of the document list, read from the url and kept within what the api serves.
//
// Both page selectors (the one in the header and the one below the results) use it, so that they always show the same
// page and lead to the same previous and next pages.
import { computed, type Ref } from 'vue';
import { useRoute, type RouteLocationNormalizedLoaded, type RouteLocationRaw } from 'vue-router';

const LIMIT_MIN = 30;
const LIMIT_MAX = 100;

type Route = Pick<RouteLocationNormalizedLoaded, 'name' | 'params' | 'query'>;

function toInt(value: unknown, fallback: number) {
  const result = parseInt(String(value), 10);
  return Number.isNaN(result) ? fallback : result;
}

export function getOffset(route: Route) {
  return Math.max(toInt(route.query.offset, 0), 0);
}

export function getLimit(route: Route) {
  return Math.min(Math.max(toInt(route.query.limit, LIMIT_MIN), LIMIT_MIN), LIMIT_MAX);
}

// offset of the page an offset belongs to: on a page boundary, and not past the last page. total is null when unknown
export function pageStartFor(offset: number, limit: number, total: number | null) {
  const start = Math.floor(offset / limit) * limit;
  return total !== null && start >= total ? Math.floor(Math.max(total - 1, 0) / limit) * limit : start;
}

export function pageQuery(route: Route, offset: number, limit: number): RouteLocationRaw {
  const query = {
    ...route.query,
    offset: String(Math.max(offset, 0)),
    limit: String(Math.max(Math.min(limit, LIMIT_MAX), LIMIT_MIN)),
  };
  return { name: route.name, params: route.params, query };
}

// Where to go when the url does not point at a page (offset in the middle of a page, past the last one, unusable
// limit), null when it does. The total is not known before the results are loaded: pass null to only check the alignment.
export function normalizedPageQuery(route: Route, total: number | null): RouteLocationRaw | null {
  const limit = getLimit(route);
  const start = pageStartFor(getOffset(route), limit, total);
  const isOffsetOk = String(route.query.offset ?? 0) === String(start);
  const isLimitOk = String(route.query.limit ?? LIMIT_MIN) === String(limit);

  return isOffsetOk && isLimitOk ? null : pageQuery(route, start, limit);
}

// total: the number of documents, null until it is known
export function usePageQuery(total: Ref<number | null>) {
  const route = useRoute();

  const offset = computed(() => getOffset(route));
  const queryLimit = computed(() => getLimit(route));
  // offset of the page shown
  const pageStart = computed(() => pageStartFor(offset.value, queryLimit.value, total.value));

  const previousPageQuery = computed(() =>
    pageStart.value > 0 ? pageQuery(route, pageStart.value - queryLimit.value, queryLimit.value) : null
  );
  const nextPageQuery = computed(() =>
    total.value !== null && pageStart.value + queryLimit.value < total.value
      ? pageQuery(route, pageStart.value + queryLimit.value, queryLimit.value)
      : null
  );

  // the same documents per page, starting from the page that holds the first document shown
  function limitQuery(limit: number) {
    return pageQuery(route, pageStartFor(pageStart.value, limit, total.value), limit);
  }

  function pageAt(newOffset: number) {
    return pageQuery(route, newOffset, queryLimit.value);
  }

  return { offset, queryLimit, pageStart, previousPageQuery, nextPageQuery, limitQuery, pageAt };
}
