import { computed, nextTick, onBeforeUnmount, ref } from 'vue';

import { getPreferences } from '@/js/vue-plugins/local-storage';
import { DESKTOP_BREAKPOINT } from '@/stores/screen';

// The side menu of the website (SideMenu.vue): a rail of icons, which opens over the page while the pointer rests on
// it or the keyboard is in it, or pinned open beside the page (App.vue leaves it its room). Pinned is kept on this device
const preferences = getPreferences('SideMenu');
const pinned = ref(preferences.get<unknown>('pinned') === true);

// pinned open only on a wide screen: on a phone on its side or a tablet, the menu open beside it would squeeze the page.
// Without matchMedia (very old browsers, tests), the screen is taken as wide
const wideQuery = window.matchMedia?.(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
const wide = ref(wideQuery?.matches ?? true);
wideQuery?.addEventListener?.('change', (event) => (wide.value = event.matches));
const effectivePinned = computed(() => pinned.value && wide.value);

// the pointer rests a while before the menu opens, and may leave it a while: crossing the rail opens nothing,
// a slip out of the menu does not close it
export const OPEN_DELAY = 120;
export const CLOSE_DELAY = 250;

export function useSideMenuPinned() {
  return effectivePinned;
}

export function useSideMenuCanPin() {
  return computed(() => wide.value);
}

function setPinned(value: boolean) {
  pinned.value = value;
  try {
    preferences.set('pinned', value);
  } catch {
    // storage blocked or full: for this visit only
  }
  // the page changed width: what follows the window's (charts, the list of documents...) follows it too
  void nextTick(() => window.dispatchEvent(new Event('resize')));
}

export function useSideMenu() {
  const hovered = ref(false);
  // the pointer is on the menu now (hovered follows it with a delay)
  let inside = false;
  const focused = ref(false);
  // after a choice in the menu, or closed on purpose: the pointer must leave it before it opens again
  const held = ref(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  const later = (delay: number, action: () => void) => {
    clearTimeout(timer);
    timer = setTimeout(action, delay);
  };

  const expanded = computed(() => effectivePinned.value || focused.value || (hovered.value && !held.value));

  // a finger opens nothing: its tap goes to the icon, the pin opens the menu
  function onPointerEnter(event: PointerEvent) {
    if (event.pointerType !== 'touch') {
      inside = true;
      later(OPEN_DELAY, () => (hovered.value = true));
    }
  }

  function onPointerLeave(event: PointerEvent) {
    if (event.pointerType !== 'touch') {
      inside = false;
      held.value = false;
      later(CLOSE_DELAY, () => (hovered.value = false));
    }
  }

  // from the keyboard only: a click also focuses the link it is on
  function onFocusIn(event: FocusEvent) {
    if ((event.target as Element).matches?.(':focus-visible')) {
      focused.value = true;
    }
  }

  function onFocusOut(event: FocusEvent) {
    const menu = event.currentTarget as Element;
    if (!menu.contains(event.relatedTarget as Node | null)) {
      focused.value = false;
    }
  }

  function close() {
    clearTimeout(timer);
    hovered.value = false;
    focused.value = false;
    held.value = inside;
  }

  function togglePinned() {
    if (pinned.value) {
      close();
    }
    setPinned(!pinned.value);
  }

  onBeforeUnmount(() => clearTimeout(timer));

  return {
    pinned: effectivePinned,
    canPin: computed(() => wide.value),
    expanded,
    onPointerEnter,
    onPointerLeave,
    onFocusIn,
    onFocusOut,
    close,
    togglePinned,
  };
}
