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
  script.addEventListener('error', onScriptError);
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

// The ad script chooses its ad units by device, which it tells from the user agent, not from the width of the page:
// 300×250 on the home page and on phones and tablets, 728×90 on the other pages of the computers. The same test leaves
// the room of the ad it will display, so that the page does not shift when the ad comes (the script comes after the
// load event, the ad a few seconds later).
const MOBILE_USER_AGENT = /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i;

export function adSlotHeight(homePage: boolean) {
  return homePage || MOBILE_USER_AGENT.test(navigator.userAgent) ? 250 : 90;
}

// the part of Google Publisher Tag, which the ad script loads, used here
interface SlotRenderEndedEvent {
  isEmpty: boolean;
  slot: { getSlotElementId(): string };
}
type SlotRenderEndedListener = (event: SlotRenderEndedEvent) => void;
interface GoogleTag {
  cmd: { push(callback: () => void): void };
  pubads?(): {
    addEventListener(type: 'slotRenderEnded', listener: SlotRenderEndedListener): void;
    removeEventListener(type: 'slotRenderEnded', listener: SlotRenderEndedListener): void;
  };
}

declare global {
  interface Window {
    googletag?: GoogleTag;
  }
}

const scriptFailureListeners = new Set<() => void>();
let scriptFailed = false;

function onScriptError() {
  scriptFailed = true;
  scriptFailureListeners.forEach((listener) => listener());
}

function runWithGoogleTag(callback: (googletag: Required<GoogleTag>) => void) {
  // the commands run once Google Publisher Tag is loaded: never if it is not (blocked)
  window.googletag ??= { cmd: [] };
  window.googletag.cmd.push(() => callback(window.googletag as Required<GoogleTag>));
}

/**
 * Tells whether the slot of the given div shows an ad, each time it is filled (it is refreshed), and that it shows none
 * when the ad script does not load (blocked). Returns the function that stops watching it.
 */
export function watchAdSlot(divId: string, onRender: (filled: boolean) => void) {
  const listener: SlotRenderEndedListener = (event) => {
    if (event.slot.getSlotElementId() === divId) {
      onRender(!event.isEmpty);
    }
  };
  const onFailure = () => onRender(false);

  if (scriptFailed) {
    onFailure();
  }
  scriptFailureListeners.add(onFailure);
  runWithGoogleTag((googletag) => googletag.pubads().addEventListener('slotRenderEnded', listener));

  return () => {
    scriptFailureListeners.delete(onFailure);
    runWithGoogleTag((googletag) => googletag.pubads().removeEventListener('slotRenderEnded', listener));
  };
}
