<template>
  <div>
    <p class="title is-size-5" v-translate>Winter hiking routes</p>
    <ul>
      <li v-for="(item, i) of winterRouteLegend" :key="i">
        <img class="image" :src="assetUrl('yeti/legends', item.image)" />
        <span class="title">{{ item.title }}</span>
        <span class="text" v-if="item.text">{{ item.text }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import Yetix from '@/components/yeti/Yetix.vue';
import { assetUrl } from '@/js/asset-urls';

const winterRouteLegend = computed(() => Yetix.winterRouteLegend);
</script>

<style scoped>
li {
  padding: 5px;
}
.image {
  vertical-align: bottom;
  display: inline-block;
  margin-right: 5px;
}
.title {
  font-size: 1rem;
}
.text {
  display: block;
  padding-left: 30px;
}
</style>
