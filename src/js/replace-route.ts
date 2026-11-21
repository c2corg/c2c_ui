import {
  isNavigationFailure,
  NavigationFailureType,
  type RouteLocationNormalized,
  type RouteLocationRaw,
  type Router,
} from 'vue-router';

// A router.replace that another navigation, started before it was over, cancelled: done again by `retry` once that
// navigation is over, if it stayed on the same page (the same view, the same document). Two parts of a page write its URL
// at the same time: the document view puts the title in the path, the map its settings in the query; the last navigation
// started cancels the other one, which would be lost. `retry` reads the route again and does nothing when the URL is
// already right
export async function replaceRoute(router: Router, location: RouteLocationRaw, retry: () => void): Promise<void> {
  const from = router.currentRoute.value;
  const samePage = (to: RouteLocationNormalized) => to.name === from.name && to.params.id === from.params.id;

  // the navigation that cancelled this one may end before or after this one is told it is cancelled
  let ended: RouteLocationNormalized | undefined;
  let waiting = false;
  const stop = router.afterEach((to, _from, failure) => {
    if (failure) return;
    stop();
    if (!waiting) ended = to;
    else if (samePage(to)) retry();
  });

  const failure = await router.replace(location);
  if (!isNavigationFailure(failure, NavigationFailureType.cancelled)) {
    stop();
    return;
  }
  if (!ended) waiting = true;
  else if (samePage(ended)) retry();
}
