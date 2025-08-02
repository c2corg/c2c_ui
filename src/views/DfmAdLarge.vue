<template>
  <div id="camptocamp_htad" class="ams-ad is-flex is-justify-content-center is-clipped" />
</template>

<script>
export default {};

if (!document.getElementById('ad_script')) {
  const s = document.createElement('script');
  s.id = 'ad_script';
  s.src = 'https://static.admysports.com/hb/site/camptocamp/hb_camptocamp.js';
  document.getElementsByTagName('head')[0].appendChild(s);
}
</script>

<style lang="css" scoped>
#camptocamp_htad {
  min-width: 728px;
}
</style>
