// The script of the ad network (admysports), added once by the ad components. It then loads the whole ad stack (Google
// Publisher Tag, AdSense, Prebid: about 600 KB of scripts), which competed with the site's own scripts and the largest
// contentful paint while the page loaded. It is now added after the page's load event, when the browser is idle
// (within 3 s), and only once an ad component is mounted: the script displays its slots right away, and their div
// must already be in the page (the home page, a lazy route, renders its ad after the load event).

const AD_SCRIPT_ID = 'ad_script';
const AD_SCRIPT_URL = 'https://static.admysports.com/hb/site/camptocamp/hb_camptocamp.js';
const IDLE_TIMEOUT = 3000;

function addAdScript() {
  if (document.getElementById(AD_SCRIPT_ID)) {
    return;
  }
  const script = document.createElement('script');
  script.id = AD_SCRIPT_ID;
  script.src = AD_SCRIPT_URL;
  document.head.appendChild(script);
}

function whenIdle(callback: () => void) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout: IDLE_TIMEOUT });
  } else {
    setTimeout(callback, 0);
  }
}

let requested = false;

export function loadAdScript() {
  if (requested) {
    return;
  }
  requested = true;
  if (document.readyState === 'complete') {
    whenIdle(addAdScript);
  } else {
    window.addEventListener('load', () => whenIdle(addAdScript), { once: true });
  }
}
