<template>
  <div>
    <p class="title is-size-5" v-translate>YETI Risk</p>
    <ul>
      <li v-for="(item, i) of yetiLegend.items" :key="i">
        <span class="color" :style="'background:' + item.color" />
        <!-- $gettext('Risky slopes') -->
        <!-- $gettext('Risky slopes, increased risk due to orientation') -->
        <!-- $gettext('Residual risk >1') -->
        <!-- $gettext('Residual risk >1.3') -->
        <!-- $gettext('Residual risk >1.5') -->
        <span>{{ $gettext(item.text['en']) }}</span>
      </li>
    </ul>
    <!-- $gettext('From danger 3, consider the slopes which dominate the route') -->
    <p class="is-size-6 is-italic">{{ $gettext(yetiLegend.comment['en']) }}</p>
  </div>
</template>

<script>
import Yetix from '@/components/yeti/Yetix';

export default {
  computed: {
    yetiLegend() {
      return Yetix.yetiLegend;
    },
  },
};
</script>

<style scoped>
.color {
  vertical-align: bottom;
  display: inline-block;
  width: 21px;
  height: 21px;
  margin-right: 5px;
}
</style>
