<template>
  <div class="ad-slot" :class="{ 'is-empty': empty }">
    <div
      id="camptocamp_htd"
      :key="page"
      class="ams-ad is-flex is-justify-content-center"
      :style="{ minHeight: empty ? '0px' : `${height}px` }"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { adSlotHeight, loadAdScript, useAdPage, watchAdSlot } from '@/js/ad-script';
import { useIsHomePage } from '@/js/composables/home-page';

const DIV_ID = 'camptocamp_htd';

const page = useAdPage();

// the room of the ad is left from the start, so that the page does not shift when it comes; it is given back when the
// slot gets no ad, or when the ad script does not load (blocked)
const height = adSlotHeight(useIsHomePage().value);
const empty = ref(false);

let stopWatching: (() => void) | undefined;

const watchSlot = () => {
  stopWatching?.();
  stopWatching = watchAdSlot(DIV_ID, (filled) => {
    empty.value = !filled;
  });
};

// each page has its own slot (a new div): its room is left again, until the ad script says it has no ad either, or
// says nothing in time
watch(page, () => {
  empty.value = false;
  watchSlot();
});

// the ad script displays its slots as soon as it runs, and Google Publisher Tag gives up on a slot whose div is not
// in the page yet: it is only asked for once this div is mounted (it is then added after the page has loaded)
onMounted(() => {
  watchSlot();
  loadAdScript();
});

onBeforeUnmount(() => stopWatching?.());
</script>

<style scoped>
/* when the slot gets no ad, its room goes smoothly, rather than the page jumping up a few seconds after it loaded */
.ams-ad {
  transition: min-height 0.3s ease;
}

@media (prefers-reduced-motion: reduce) {
  .ams-ad {
    transition: none;
  }
}
</style>
