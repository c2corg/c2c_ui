<template>
  <span class="transport-badge" :style="{ backgroundColor: colour, color: textColour }">
    <img :src="assetUrl('boxes', `${icon}.svg`)" alt="" :style="{ filter: iconFilter }" />
    <span v-if="label" class="transport-badge-name">{{ label }}</span>
  </span>
</template>

<script>
import { assetUrl } from '@/js/asset-urls';
import { modeIcon, readableTextColour } from '@/js/transport-utils';

export default {
  props: {
    // the number of the line
    label: {
      type: String,
      default: '',
    },

    // bus, tram, train... as OpenStreetMap writes them
    mode: {
      type: String,
      default: undefined,
    },

    // background, as #rrggbb
    colour: {
      type: String,
      required: true,
    },
  },

  computed: {
    icon() {
      return modeIcon(this.mode);
    },

    textColour() {
      return readableTextColour(this.colour);
    },

    // the icons are grey: black or white as the text
    iconFilter() {
      return this.textColour === '#ffffff' ? 'brightness(0) invert(1)' : 'brightness(0)';
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
