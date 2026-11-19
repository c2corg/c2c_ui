<template>
  <div class="ad-slot" :class="{ 'is-empty': empty }">
    <div
      id="camptocamp_htd"
      class="ams-ad is-flex is-justify-content-center"
      :style="empty ? undefined : { minHeight: `${height}px` }"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

import { adSlotHeight, loadAdScript, watchAdSlot } from '@/js/ad-script';
import { useIsHomePage } from '@/js/composables/home-page';

const DIV_ID = 'camptocamp_htd';

// the room of the ad is left from the start, so that the page does not shift when it comes; it is given back when the
// slot gets no ad, or when the ad script does not load (blocked)
const height = adSlotHeight(useIsHomePage().value);
const empty = ref(false);

let stopWatching: (() => void) | undefined;

// the ad script displays its slots as soon as it runs, and Google Publisher Tag gives up on a slot whose div is not
// in the page yet: it is only asked for once this div is mounted (it is then added after the page has loaded)
onMounted(() => {
  stopWatching = watchAdSlot(DIV_ID, (filled) => {
    empty.value = !filled;
  });
  loadAdScript();
});

onBeforeUnmount(() => stopWatching?.());
</script>
