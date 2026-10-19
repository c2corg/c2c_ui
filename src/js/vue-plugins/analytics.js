// Google Analytics 4 through gtag.js. The script is loaded only once the user accepts statistics cookies (GDPR),
// and page views are sent on route changes. vm.$ga.enable() / vm.$ga.disable() follow the user's choice.

const GTAG_URL = 'https://www.googletagmanager.com/gtag/js';

// do not send a page view if only the query has changed: the document title is part of the route
export function shouldTrack(to, from) {
  return to.name !== from.name || String(to.params.id) !== String(from.params.id);
}

export default function install(Vue, { id, router }) {
  // a GA4 measurement ID; anything else (an empty key, a former Universal Analytics UA- key) turns analytics off
  const valid = /^G-[A-Z0-9]+$/.test(id ?? '');
  let enabled = false;
  let loaded = false;
  let pendingRoute = null;

  function gtag() {
    // gtag.js reads the arguments objects pushed in dataLayer

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

  function sendPageView(route) {
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

  Vue.prototype.$ga = {
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

  if (Vue.prototype.$gdpr?.gdprValue?.statistics) {
    Vue.prototype.$ga.enable();
  }
}
