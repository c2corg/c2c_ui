<template>
  <span class="transport-badge" :style="{ background: '#' + (line.color || '5f6368'), color }">
    <img :src="assetUrl('boxes', `${icon}.svg`)" alt="" :style="{ filter: iconFilter }" />
    <span class="transport-badge-name">{{ line.short_name }}</span>
  </span>
</template>

<script>
import { assetUrl } from '@/js/asset-urls';
import { modeIcon, textColor } from '@/js/transport-utils';

export default {
  props: {
    // short_name, mode, color, text_color (the line of a feed: color without #)
    line: {
      type: Object,
      required: true,
    },
  },

  computed: {
    icon() {
      return modeIcon(this.line.mode);
    },

    color() {
      return textColor(this.line.color, this.line.text_color);
    },

    // the icons are grey: black or white as the text
    iconFilter() {
      return this.color.toLowerCase() === '#ffffff' ? 'brightness(0) invert(1)' : 'brightness(0)';
    },
  },

  methods: {
    assetUrl,
  },
};
</script>

<style scoped lang="scss">
.transport-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3em;
  padding: 0.1em 0.6em;
  border-radius: 1em;
  font-weight: bold;
  line-height: 1.6;
  vertical-align: middle;

  img {
    height: 1em;
  }
}
</style>
