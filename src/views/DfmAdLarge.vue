<template>
  <div id="camptocamp_htad" class="ams-ad is-flex is-justify-content-center is-clipped" />
</template>

<script lang="ts">
import { loadAdScript } from '@/js/ad-script';

// a component without options: its script only asks for the ad script, once, when the ad components are first
// imported; the script is added after the page has loaded
export default {};

loadAdScript();
</script>

<style lang="css" scoped>
#camptocamp_htad {
  min-width: 728px;
}
</style>
