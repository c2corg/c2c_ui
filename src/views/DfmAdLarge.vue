<template>
  <!-- a new div on each page (useAdPage) -->
  <div id="camptocamp_htad" :key="page" class="ams-ad is-flex is-justify-content-center is-clipped" />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

import { loadAdScript, useAdPage } from '@/js/ad-script';

const page = useAdPage();

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
</style>
