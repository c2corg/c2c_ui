<template>
  <div id="camptocamp_htad" class="ams-ad is-flex is-justify-content-center is-clipped" />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

import { loadAdScript } from '@/js/ad-script';

// the ad script displays its slots as soon as it runs, and Google Publisher Tag gives up on a slot whose div is not
// in the page yet: it is only asked for once this div is mounted (it is then added after the page has loaded)
onMounted(loadAdScript);
</script>

<style lang="css" scoped>
/* the width of its ad (728px), whatever the ad script puts in it */
#camptocamp_htad {
  flex: none;
  width: 728px;
}

/* on each page, the ad script defines its slot again: Google Publisher Tag adds a new container to the div, and leaves
   the previous ones in it, empty. Side by side, they widened the div (in the navigation bar, its buttons then wrapped
   on 4 lines, higher than the bar): only the last one, the slot's, is shown */
#camptocamp_htad > :deep(div:not(:last-child)) {
  display: none;
}
</style>
