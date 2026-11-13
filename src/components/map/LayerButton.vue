<template>
  <div
    class="layer-button"
    @click="$emit('click')"
    :class="{ selected, 'show-slider': showSlider }"
    :style="
      image
        ? { 'background-image': 'url(' + assetUrl('layers', image) + ')' }
        : { 'background-color': layer.color || '#333' }
    "
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

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { assetUrl } from '@/js/asset-urls';
import { useUid } from '@/js/uid';

const props = defineProps({
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
});

defineEmits(['click']);

const { uid } = useUid();

const showSlider = ref(false);
const opacity = ref((props.layer.get?.('opacity') ?? 1) * 100);

// the layer title names the opacity slider handle for assistive technologies
const titleId = computed(() => `layer-button-title-${uid}`);
const image = computed(() => props.layer.image || props.layer.get?.('image'));
const country = computed(() => props.layer.country || props.layer.get?.('country'));
const isConfigurable = computed(() => !!props.layer.get?.('configurable'));

watch(
  () => props.selected,
  () => {
    if (!props.selected) {
      showSlider.value = false;
    }
  }
);

watch(opacity, () => {
  props.layer.set?.('opacity', opacity.value / 100);
});
</script>

<style scoped>
.layer-button {
  --layer-button-width: 78px;
  --layer-button-radius: 5px;
  --layer-button-inner-radius: 2px;
  --layer-button-selected-border: 3px;
  --layer-button-config-width: 17px;

  position: relative;
  width: var(--layer-button-width);
  height: var(--layer-button-width);
  margin: 10px;
  cursor: pointer;
  border-radius: var(--layer-button-radius);
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
  width: var(--layer-button-width);
  height: var(--layer-button-width);
  border-radius: var(--layer-button-radius);
  border: var(--layer-button-selected-border) solid var(--c2c-white);
  pointer-events: none;
}

.layer-button-title {
  position: absolute;
  padding-bottom: 2px;
  bottom: 0;
  left: 0;
  width: var(--layer-button-width);
  border-bottom-left-radius: var(--layer-button-radius);
  border-bottom-right-radius: var(--layer-button-radius);
  font-size: 0.8em;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.5);
}

.layer-button-country {
  width: 20px;
  height: 15px;
  background-size: contain;
  border-radius: var(--layer-button-inner-radius);
}

.layer-button-config {
  position: absolute;
  top: 0;
  right: 0;
  width: var(--layer-button-config-width);
  height: var(--layer-button-config-width);
  border-radius: 0 var(--layer-button-radius) 0 var(--layer-button-inner-radius);
  background-color: rgb(0, 59, 136, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.layer-button.show-slider .layer-button-config {
  border-radius: 0 var(--layer-button-radius) 0 0;
}

.layer-button.selected .layer-button-config {
  top: 2px;
  right: 2px;
}

.layer-button-slider {
  position: absolute;
  background-color: rgb(0, 59, 136, 0.7);
  box-sizing: content-box;
  border-radius: var(--layer-button-radius) 0 0 0;
  top: 0;
  left: 0;
  width: calc(var(--layer-button-width) - var(--layer-button-config-width));
  height: var(--layer-button-config-width);
}

.layer-button-slider .input-slider {
  /* the handles stay in the box, as with the former vue-slider-component contained option */
  --slider-handle-width: 14px;
  --slider-handle-height: 14px;

  margin: 6px 7px;
}

.layer-button.selected .layer-button-slider {
  top: calc(var(--layer-button-selected-border) - 1px);
  width: calc(var(--layer-button-width) - var(--layer-button-config-width) - var(--layer-button-selected-border) - 1px);
  padding-left: calc(var(--layer-button-selected-border) - 1px);
}
</style>
