/**
 * V-infinite-scroll="{ load, disabled, distance }"
 *
 * Calls `load()` when the bottom of the element is less than `distance` px (default 0) below the bottom of its
 * scrolling container (its nearest ancestor with overflow-y auto or scroll, else the window): on mount, on scroll and
 * resize (throttled), and when `disabled` turns false. Same behaviour as vue-infinite-scroll, which only exists for Vue
 * 2 and reads its options from the component by name; the hooks of both Vue 2 and Vue 3 are defined.
 */

const THROTTLE_DELAY = 200;

const states = new WeakMap();

function getScrollContainer(el) {
  for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return node;
    }
  }
  return window;
}

function check(el) {
  const state = states.get(el);
  if (!state || state.options.disabled) {
    return;
  }
  const containerBottom =
    state.container === window ? window.innerHeight : state.container.getBoundingClientRect().bottom;
  if (el.getBoundingClientRect().bottom - containerBottom <= (state.options.distance ?? 0)) {
    state.options.load();
  }
}

// at most one check every THROTTLE_DELAY ms, the last scroll of a burst included
function throttle(fn) {
  let timer = null;
  let pending = false;
  const run = () => {
    timer = setTimeout(() => {
      timer = null;
      if (pending) {
        pending = false;
        fn();
        run();
      }
    }, THROTTLE_DELAY);
  };
  const throttled = () => {
    if (timer) {
      pending = true;
      return;
    }
    fn();
    run();
  };
  throttled.cancel = () => clearTimeout(timer);
  return throttled;
}

function mount(el, { value }) {
  const container = getScrollContainer(el);
  const listener = throttle(() => check(el));
  states.set(el, { options: value, container, listener });
  container.addEventListener('scroll', listener, { passive: true });
  window.addEventListener('resize', listener, { passive: true });
  check(el);
}

function update(el, { value }) {
  const state = states.get(el);
  if (!state) {
    return;
  }
  const wasDisabled = state.options.disabled;
  state.options = value;
  if (wasDisabled && !value.disabled) {
    check(el);
  }
}

function unmount(el) {
  const state = states.get(el);
  if (!state) {
    return;
  }
  state.listener.cancel();
  state.container.removeEventListener('scroll', state.listener);
  window.removeEventListener('resize', state.listener);
  states.delete(el);
}

export default {
  // Vue 2
  inserted: mount,
  componentUpdated: update,
  unbind: unmount,
  // Vue 3
  mounted: mount,
  updated: update,
  unmounted: unmount,
};
