import { computed } from 'vue';
import { useRoute } from 'vue-router';

// The script of the ad network (admysports), added once by the ad components. It then loads the whole ad stack (Google
// Publisher Tag, AdSense, Prebid: about 600 KB of scripts), which competed with the site's own scripts and the largest
// contentful paint while the page loaded. It is now added after the page's load event, when the browser is idle
// (within 3 s), and only once an ad component is mounted: the script displays its slots right away, and their div
// must already be in the page (the home page, a lazy route, renders its ad after the load event).

const AD_SCRIPT_ID = 'ad_script';
const AD_SCRIPT_URL = 'https://static.admysports.com/hb/site/camptocamp/hb_camptocamp.js';
const IDLE_TIMEOUT = 3000;
// Google Publisher Tag, which the ad script adds as soon as it runs: ad blockers working on addresses (DNS filters such
// as personalDNSfilter) block it, and not always the ad script itself
const GOOGLE_TAG_URL = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
// The ad script asks for its ads at the latest 3.7 s after it runs (1.5 s waiting for the consent, 1.2 s of auction,
// 1 s more), and Google Ad Manager answers within a few hundred milliseconds: a slot told nothing 5 s after the script
// has loaded, or after a new page, gets no ad (Google Publisher Tag replaced by an ad blocker's stub, auction stuck).
const AD_DEADLINE = 5000;

function addAdScript() {
  if (document.getElementById(AD_SCRIPT_ID)) {
    return;
  }
  const script = document.createElement('script');
  script.id = AD_SCRIPT_ID;
  script.src = AD_SCRIPT_URL;
  script.addEventListener('load', onScriptLoad);
  script.addEventListener('error', onScriptError);
  // the error of a script does not bubble: it is only seen while it goes down from the window
  window.addEventListener('error', onResourceError, true);
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

/**
 * The page, as the ad script tells them apart (path and query), to give its slot a new div on each page: the ad script
 * then defines its slot again (it watches its divs), and Google Publisher Tag adds a new container to the div. In the
 * same div, it left the previous ones, empty: side by side, they widened the div, and the buttons of the navigation bar
 * wrapped on 4 lines, higher than the bar. A new div leaves them with the old one.
 */
export function useAdPage() {
  const route = useRoute();
  return computed(() => route.fullPath.split('#')[0]);
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

const scriptLoadListeners = new Set<() => void>();
let scriptLoaded = false;

function onScriptLoad() {
  scriptLoaded = true;
  scriptLoadListeners.forEach((listener) => listener());
}

const scriptFailureListeners = new Set<() => void>();
let scriptFailed = false;

function onScriptError() {
  if (scriptFailed) {
    return;
  }
  scriptFailed = true;
  scriptFailureListeners.forEach((listener) => listener());
}

function onResourceError(event: Event) {
  const target = event.target;
  if (target instanceof HTMLScriptElement && target.src.startsWith(GOOGLE_TAG_URL)) {
    onScriptError();
  }
}

function runWithGoogleTag(callback: (googletag: Required<GoogleTag>) => void) {
  // the commands run once Google Publisher Tag is loaded: never if it is not (blocked)
  window.googletag ??= { cmd: [] };
  window.googletag.cmd.push(() => callback(window.googletag as Required<GoogleTag>));
}

/**
 * Tells whether the slot of the given div shows an ad, each time it is filled (it is refreshed), and that it shows none
 * when the ad stack does not load (blocked), or when nothing is told about the slot in time (AD_DEADLINE, from the load
 * of the ad script or from this call, whichever comes last; an ad coming later is still told). A new page has a new
 * slot: it is watched again. Returns the function that stops watching it.
 */
export function watchAdSlot(divId: string, onRender: (filled: boolean) => void) {
  let told = false;
  let deadline: ReturnType<typeof setTimeout> | undefined;

  const listener: SlotRenderEndedListener = (event) => {
    if (event.slot.getSlotElementId() === divId) {
      told = true;
      clearTimeout(deadline);
      onRender(!event.isEmpty);
    }
  };
  const onFailure = () => {
    told = true;
    clearTimeout(deadline);
    onRender(false);
  };
  const startDeadline = () => {
    if (!told) {
      deadline = setTimeout(onFailure, AD_DEADLINE);
    }
  };

  if (scriptFailed) {
    onFailure();
  } else if (scriptLoaded) {
    startDeadline();
  } else {
    scriptLoadListeners.add(startDeadline);
  }
  scriptFailureListeners.add(onFailure);
  runWithGoogleTag((googletag) => googletag.pubads().addEventListener('slotRenderEnded', listener));

  return () => {
    clearTimeout(deadline);
    scriptLoadListeners.delete(startDeadline);
    scriptFailureListeners.delete(onFailure);
    runWithGoogleTag((googletag) => googletag.pubads().removeEventListener('slotRenderEnded', listener));
  };
}
