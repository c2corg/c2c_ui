import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import constants from '@/js/constants';

/**
 * The current route.
 *
 * Until the first navigation is resolved (the route view is loaded lazily), the route is vue-router's start location,
 * `/`: the route then comes from the history, so that the other pages don't first render with the layout of the home
 * page, and then shift by the height of the ad (#4883).
 */
function useCurrentRoute() {
  const route = useRoute();
  const router = useRouter();
  return computed(() => (route.matched.length ? route : router.resolve(router.options.history.location)));
}

/** Whether the page is the home page, whose layout has no ad in the navigation. */
export function useIsHomePage() {
  const currentRoute = useCurrentRoute();
  return computed(() => currentRoute.value.path === '/' || currentRoute.value.path === '/home');
}

// the routes of the documents' views, named after their type (src/js/vue-plugins/router.ts)
const DOCUMENT_VIEWS = new Set<unknown>(Object.values(constants.objectDefinitions).map((def) => def.documentType));

/**
 * Whether the page shows the ad at its top (in the navigation, or under it): only the views of the documents do, not
 * their lists, edition, history... The home page has its own.
 */
export function useHasTopAd() {
  const currentRoute = useCurrentRoute();
  return computed(() => DOCUMENT_VIEWS.has(currentRoute.value.name));
}
