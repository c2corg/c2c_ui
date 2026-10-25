// Google Analytics 4 through gtag.js. The script is loaded only once the user accepts statistics cookies (GDPR),
// and page views are sent on route changes. vm.$ga.enable() / vm.$ga.disable() follow the user's choice.

import type { App } from 'vue';
import type { RouteLocationNormalized, Router } from 'vue-router';

const GTAG_URL = 'https://www.googletagmanager.com/gtag/js';

export type Analytics = { enable(): void; disable(): void };

declare module 'vue' {
  interface ComponentCustomProperties {
    $ga: Analytics;
  }
}

declare global {
  interface Window {
    dataLayer: unknown[];
    // gtag.js stops sending hits while ga-disable-<measurement ID> is true
    [gaDisable: `ga-disable-${string}`]: boolean;
  }
}

// do not send a page view if only the query has changed: the document title is part of the route
export function shouldTrack(
  to: Pick<RouteLocationNormalized, 'name' | 'params'>,
  from: Pick<RouteLocationNormalized, 'name' | 'params'>
): boolean {
  return to.name !== from.name || String(to.params.id) !== String(from.params.id);
}

export default function install(app: App, { id, router }: { id?: string; router: Router }) {
  // a GA4 measurement ID; anything else (an empty key, a former Universal Analytics UA- key) turns analytics off
  const valid = /^G-[A-Z0-9]+$/.test(id ?? '');
  let enabled = false;
  let loaded = false;
  let pendingRoute: RouteLocationNormalized | null = null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function gtag(..._args: unknown[]) {
    // gtag.js reads the arguments objects pushed in dataLayer
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  }

  function load() {
    window.dataLayer = window.dataLayer || [];
    gtag('js', new Date());
    gtag('config', id, {
      send_page_view: false, // sent on route changes
      // cookies on this host only, as before (GA4 would set them on the parent domain)
      cookie_domain: window.location.hostname === 'localhost' ? 'none' : window.location.hostname,
    });

    const script = document.createElement('script');
    script.async = true;
    script.src = `${GTAG_URL}?id=${id}`;
    document.head.appendChild(script);
    loaded = true;
  }

  function sendPageView(route: RouteLocationNormalized) {
    gtag('event', 'page_view', {
      page_title: 'Camptocamp.org',
      page_location: window.location.origin + router.resolve(route.fullPath).href,
    });
  }

  router.afterEach((to, from) => {
    if (!from.matched.length || shouldTrack(to, from)) {
      if (enabled) {
        sendPageView(to);
      } else {
        // sent if the user accepts statistics on this page
        pendingRoute = to;
      }
    }
  });

  const analytics: Analytics = {
    enable() {
      if (!valid || enabled) {
        return;
      }
      window[`ga-disable-${id}`] = false;
      if (!loaded) {
        load();
      }
      enabled = true;
      if (pendingRoute) {
        sendPageView(pendingRoute);
        pendingRoute = null;
      }
    },

    disable() {
      if (!valid) {
        return;
      }
      // gtag.js stops sending hits when this flag is set
      window[`ga-disable-${id}`] = true;
      enabled = false;
    },
  };
  app.config.globalProperties.$ga = analytics;

  if (app.config.globalProperties.$gdpr?.gdprValue?.statistics) {
    app.config.globalProperties.$ga.enable();
  }
}
