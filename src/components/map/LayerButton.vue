<template>
  <div
    class="layer-button"
    @click="$emit('click')"
    :class="{ selected, 'show-slider': showSlider }"
    :style="{
      'background-image': 'url(' + assetUrl('layers', layer.image || layer.get('image')) + ')',
    }"
  >
    <span :id="titleId" class="layer-button-title">{{
      $gettext(layer.title || layer.get?.('title'), titleContext)
    }}</span>
    <div
      class="layer-button-country"
      v-if="country"
      :style="{ 'background-image': 'url(' + assetUrl('flags', country + '.svg') + ')' }"
    ></div>
    <div
      class="layer-button-config"
      v-if="isConfigurable && selected"
      @click.stop="showSlider = !showSlider"
      :title="$gettext('Configure layer')"
    >
      <fa-icon icon="gear" />
    </div>
    <div class="layer-button-slider" v-if="showSlider" @click.stop>
      <input-slider v-model="opacity" :aria-labelledby="titleId" :tooltips="false" :lazy="false" />
    </div>
    <div class="layer-button-border"></div>
  </div>
</template>

<script>
import { assetUrl } from '@/js/asset-urls';
import { useUid } from '@/js/uid';

export default {
  name: 'LayerButton',
  props: {
    layer: {
      type: Object,
      required: true,
    },
    titleContext: {
      type: String,
      default: undefined,
    },
    selected: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['click'],

  setup() {
    return useUid();
  },

  data() {
    return {
      showSlider: false,
      opacity: 100,
    };
  },

  computed: {
    // the layer title names the opacity slider handle for assistive technologies
    titleId() {
      return `layer-button-title-${this.uid}`;
    },

    country() {
      return this.layer.country || this.layer.get?.('country');
    },
    isConfigurable() {
      return !!this.layer.get?.('configurable');
    },
  },

  watch: {
    selected() {
      if (!this.selected) {
        this.showSlider = false;
      }
    },
    opacity() {
      this.layer.set?.('opacity', this.opacity / 100);
    },
  },

  mounted() {
    this.opacity = (this.layer.get?.('opacity') ?? 1) * 100;
  },

  methods: {
    assetUrl,
  },
};
</script>

<style scoped lang="scss">
$button-width: 78px;
$button-height: $button-width;
$button-radius: 5px;
$button-inner-radius: 2px;
$button-selected-border: 3px;
$config-button-width: 17px;
$config-button-height: $config-button-width;

.layer-button {
  position: relative;
  width: $button-width;
  height: $button-height;
  margin: 10px;
  cursor: pointer;
  border-radius: $button-radius;
  padding: 5px;
  vertical-align: bottom;

  &:hover {
    filter: brightness(80%);
  }
}

.layer-button.selected > .layer-button-border {
  position: absolute;
  top: 0;
  left: 0;
  width: $button-width;
  height: $button-width;
  border-radius: $button-radius;
  border: $button-selected-border solid #fff;
  pointer-events: none;
}

.layer-button-title {
  position: absolute;
  padding-bottom: 2px;
  bottom: 0;
  left: 0;
  width: $button-width;
  border-bottom-left-radius: $button-radius;
  border-bottom-right-radius: $button-radius;
  font-size: 0.8em;
  text-align: center;
  background-color: rgba($color: #000, $alpha: 0.5);
}

.layer-button-country {
  width: 20px;
  height: 15px;
  background-size: contain;
  border-radius: $button-inner-radius;
}

.layer-button-config {
  position: absolute;
  top: 0;
  right: 0;
  width: $config-button-width;
  height: $config-button-height;
  border-radius: 0 $button-radius 0 $button-inner-radius;
  background-color: rgb(0, 59, 136, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.layer-button.show-slider .layer-button-config {
  border-radius: 0 $button-radius 0 0;
}

.layer-button.selected .layer-button-config {
  top: 2px;
  right: 2px;
}

.layer-button-slider {
  position: absolute;
  background-color: rgb(0, 59, 136, 0.7);
  box-sizing: content-box;
  border-radius: $button-radius 0 0 0;
  top: 0;
  left: 0;
  width: $button-width - $config-button-width;
  height: $config-button-height;
}

.layer-button-slider .input-slider {
  // the handles stay in the box, as with the former vue-slider-component contained option
  --slider-handle-width: 14px;
  --slider-handle-height: 14px;

  margin: 6px 7px;
}

.layer-button.selected .layer-button-slider {
  top: $button-selected-border - 1;
  width: $button-width - $config-button-width - $button-selected-border - 1;
  padding-left: $button-selected-border - 1;
}
</style>
