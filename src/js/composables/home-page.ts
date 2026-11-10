import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

/**
 * Whether the page is the home page, whose layout has no ad in the navigation.
 *
 * Until the first navigation is resolved (the route view is loaded lazily), the route is vue-router's start location,
 * `/`: the path then comes from the history, so that the other pages don't first render with the home layout, and then
 * shift by the height of the ad (#4883).
 */
export function useIsHomePage() {
  const route = useRoute();
  const router = useRouter();
  return computed(() => {
    const path = route.matched.length ? route.path : router.options.history.location.split(/[?#]/)[0];
    return path === '/' || path === '/home';
  });
}
