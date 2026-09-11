<template>
  <div>
    <p class="title is-size-5" v-translate>Winter hiking routes</p>
    <ul>
      <li v-for="(item, i) of winterRouteLegend" :key="i">
        <img class="image" :src="legendImages['/src/assets/img/yeti/legends/' + item.image]" />
        <span class="title">{{ item.title }}</span>
        <span class="text" v-if="item.text">{{ item.text }}</span>
      </li>
    </ul>
  </div>
</template>

<script>
import Yetix from '@/components/yeti/Yetix';

// Vite cannot resolve a webpack-style `require('.../legends/' + item.image)` at build time.
const legendImages = import.meta.glob('/src/assets/img/yeti/legends/*.png', { eager: true, import: 'default' });

export default {
  data() {
    return {
      legendImages,
    };
  },

  computed: {
    winterRouteLegend() {
      return Yetix.winterRouteLegend;
    },
  },
};
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
