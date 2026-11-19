// The pages of documents scroll across their maps: a wheel or touch gesture that starts while the page is still moving
// belongs to the page, so that scrolling past a map does not zoom or pan it. A gesture that starts on a still page goes
// to the map, as before.

// how long after its last scroll event the page is still moving (a touch stops the momentum of a flick, so the touch
// that follows a flick comes a few ms after its last scroll event)
export const PAGE_MOVING_DELAY = 300;
// the longest gap between two wheel events of one gesture (trackpad inertia included)
export const WHEEL_GESTURE_GAP = 200;
// on the root element while the page moves: the map lets the browser scroll the page from a touch (touch-action)
export const PAGE_SCROLLING_CLASS = 'page-scrolling';

const TOUCH_EVENTS = ['touchstart', 'touchmove', 'touchend', 'touchcancel'] as const;

/**
 * Hands to the page the wheel and touch gestures on the map that start while the page scrolls.
 *
 * `mapElement` is the container of the MapLibre map, `rootElement` an ancestor holding it and the controls, and
 * `enabled` says whether to do it (not in full screen). Returns the function that stops it.
 */
export function scrollPassthrough(mapElement: HTMLElement, rootElement: HTMLElement, enabled: () => boolean) {
  let lastPageScroll = -Infinity;
  let lastWheel = -Infinity;
  let wheelToPage = false;
  let touchToPage = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  // a single timer per scroll burst, not one per scroll event
  const endScrolling = () => {
    const left = PAGE_MOVING_DELAY - (performance.now() - lastPageScroll);
    if (left > 0) {
      timer = setTimeout(endScrolling, left);
      return;
    }
    timer = undefined;
    rootElement.classList.remove(PAGE_SCROLLING_CLASS);
  };

  const onScroll = (event: Event) => {
    // the scrolling of a list over the map (the layer switcher) is not the page's
    if (event.target instanceof Node && rootElement.contains(event.target)) return;
    if (!enabled()) return;
    lastPageScroll = performance.now();
    if (timer === undefined) {
      rootElement.classList.add(PAGE_SCROLLING_CLASS);
      timer = setTimeout(endScrolling, PAGE_MOVING_DELAY);
    }
  };

  const onWheel = (event: WheelEvent) => {
    const now = performance.now();
    // decided once per gesture, or a gesture that brings the page to its end would zoom the map once the page stops
    if (now - lastWheel > WHEEL_GESTURE_GAP) {
      // a trackpad pinch (ctrlKey) is never a page scroll: it always zooms the map
      wheelToPage = !event.ctrlKey && enabled() && now - lastPageScroll < PAGE_MOVING_DELAY;
    }
    lastWheel = now;
    // MapLibre does not see it, and the browser scrolls the page (no preventDefault)
    if (wheelToPage) event.stopPropagation();
  };

  const onTouch = (event: TouchEvent) => {
    // decided by the first finger, for the whole gesture; the class, not the time, as the touch-action that the browser
    // applies to the gesture is the one of the class
    if (event.type === 'touchstart' && event.touches.length === event.changedTouches.length) {
      touchToPage = rootElement.classList.contains(PAGE_SCROLLING_CLASS);
    }
    if (touchToPage) event.stopPropagation();
  };

  // capture: before MapLibre, whose listeners are on the map element (target or bubbling phase)
  const options = { capture: true, passive: true };
  document.addEventListener('scroll', onScroll, options);
  mapElement.addEventListener('wheel', onWheel, options);
  TOUCH_EVENTS.forEach((type) => mapElement.addEventListener(type, onTouch, options));

  return () => {
    document.removeEventListener('scroll', onScroll, options);
    mapElement.removeEventListener('wheel', onWheel, options);
    TOUCH_EVENTS.forEach((type) => mapElement.removeEventListener(type, onTouch, options));
    clearTimeout(timer);
    rootElement.classList.remove(PAGE_SCROLLING_CLASS);
  };
}
