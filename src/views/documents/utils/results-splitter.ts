// The splitter between the results and the map of the search pages, on desktop (c2corg/c2c_ui#5048): the width of the
// results, in % of the row, is dragged or changed with the arrow keys, and stored in the preferences. Without a stored
// width, the Bulma classes of the results give it.
import { type Ref, computed, onBeforeUnmount, ref, watch } from 'vue';

import type { LocalStorageItem } from '@/js/vue-plugins/local-storage';

export const MIN_RESULTS_WIDTH = 25;
export const MAX_RESULTS_WIDTH = 75;
const KEYBOARD_STEP = 2;

export const clampResultsWidth = (width: number) =>
  Math.round(Math.min(MAX_RESULTS_WIDTH, Math.max(MIN_RESULTS_WIDTH, width)) * 10) / 10;

interface Options {
  preferences: LocalStorageItem;
  // the preference the width is stored under, e.g. one for the list and one for the cards
  key: Ref<string>;
  row: Ref<HTMLElement | null>;
  results: Ref<HTMLElement | null>;
  // the map needs an explicit resize when its container changes
  onResize: () => void;
}

export function useResultsSplitter({ preferences, key, row, results, onResize }: Options) {
  const read = () => {
    const stored = preferences.get(key.value);
    return typeof stored === 'number' && Number.isFinite(stored) ? clampResultsWidth(stored) : undefined;
  };

  // the stored width, in % of the row; undefined for the one of the Bulma classes
  const width = ref(read());
  watch(key, () => (width.value = read()));

  const resizing = ref(false);

  // the width the results have, in px and in % of the row, whichever gives it
  const pixelWidth = ref<number>();
  const measuredWidth = ref<number>();
  const measure = () => {
    if (!row.value || !results.value || !row.value.clientWidth) {
      return undefined;
    }
    pixelWidth.value = results.value.offsetWidth;
    measuredWidth.value = (100 * results.value.offsetWidth) / row.value.clientWidth;
    return measuredWidth.value;
  };
  const valueNow = computed(() => Math.round(width.value ?? measuredWidth.value ?? 50));

  const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(() => measure());
  watch(
    [row, results],
    ([newRow, newResults]) => {
      observer?.disconnect();
      for (const element of [newRow, newResults]) {
        if (element) {
          observer?.observe(element);
        }
      }
    },
    { immediate: true }
  );

  // once per frame at most while dragging
  let frame = 0;
  const scheduleResize = () => {
    frame ||= requestAnimationFrame(() => {
      frame = 0;
      onResize();
    });
  };

  const setWidth = (value: number) => {
    width.value = clampResultsWidth(value);
    scheduleResize();
  };

  const save = () => {
    if (width.value !== undefined) {
      preferences.set(key.value, width.value);
    }
  };

  function onPointerDown(event: PointerEvent) {
    if (event.button !== 0 || !row.value || !results.value) {
      return;
    }
    event.preventDefault();
    const handle = event.currentTarget as HTMLElement;
    // where the splitter was grabbed, from the edge of the results: the edge follows the pointer without a jump
    const grabOffset = event.clientX - results.value.getBoundingClientRect().right;
    let moved = false;

    const move = (moveEvent: PointerEvent) => {
      if (!row.value) {
        return;
      }
      const rect = row.value.getBoundingClientRect();
      moved = true;
      setWidth((100 * (moveEvent.clientX - grabOffset - rect.left)) / rect.width);
    };
    const end = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', end);
      handle.removeEventListener('pointercancel', end);
      resizing.value = false;
      // a click, or the first one of a double click, keeps the default width
      if (moved) {
        save();
      }
    };

    handle.setPointerCapture?.(event.pointerId);
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
    resizing.value = true;
  }

  function onKeydown(event: KeyboardEvent) {
    const step = { ArrowLeft: -KEYBOARD_STEP, ArrowRight: KEYBOARD_STEP }[event.key];
    if (!step) {
      return;
    }
    event.preventDefault();
    setWidth((width.value ?? measure() ?? 50) + step);
    save();
  }

  // back to the width of the Bulma classes
  function reset() {
    width.value = undefined;
    preferences.remove(key.value);
    scheduleResize();
  }

  onBeforeUnmount(() => {
    observer?.disconnect();
    cancelAnimationFrame(frame);
  });

  return { width, valueNow, pixelWidth, resizing, onPointerDown, onKeydown, reset };
}
