<template>
  <div class="yeti-subpanel">
    <div class="layers-group">
      <sub-panel-title><span v-translate>Overlays</span></sub-panel-title>
      <div class="layer-items">
        <div v-for="layer of overlaysLayersLarge" :key="layer.title" class="layer-item">
          <layer-button v-model="layer.checked" :image="layer.image" :country="layer.country" @change="layer.action">
            <span>{{ layer.title }}</span>
          </layer-button>
        </div>
      </div>
      <div class="layer-controls">
        <dropdown-content v-for="layer of overlaysLayersLargeCheckedAndNeedContent" :key="layer.title" class="mb-2">
          <component :is="layer.contentTitleComponent" :layer="layer" />
          <template #content>
            <component :is="layer.contentComponent" />
          </template>
        </dropdown-content>
      </div>
    </div>
    <div class="layers-group">
      <div class="layer-items">
        <div v-for="layer of overlaysLayersSmall" :key="layer.title" class="layer-item is-small">
          <layer-button v-model="layer.checked" :image="layer.image" :country="layer.country" @change="layer.action">
            <span>{{ layer.title }}</span>
          </layer-button>
        </div>
      </div>
      <div class="layer-controls">
        <dropdown-content v-for="layer of overlaysLayersSmallCheckedAndNeedContent" :key="layer.title" class="mb-2">
          <component :is="layer.contentTitleComponent" :layer="layer" />
          <template #content>
            <component :is="layer.contentComponent" />
          </template>
        </dropdown-content>
      </div>
    </div>
    <div class="layers-group">
      <sub-panel-title><span>YETI</span></sub-panel-title>
      <div class="layer-items">
        <div v-for="layer of yetiLayersSelector" :key="layer.title" class="layer-item">
          <layer-button v-model="layer.checked" :disabled="layer.disabled" :image="layer.image" @change="layer.action">
            <span>{{ layer.title }}</span>
          </layer-button>
        </div>
      </div>
      <div class="layer-controls">
        <dropdown-content v-for="layer of yetiLayersSelectorChecked" :key="layer.title" class="mb-2">
          <span>
            <fa-icon icon="gear" />
            <span>{{ layer.title }}</span>
          </span>
          <template #content>
            <div class="layer-control-item">
              <slider v-model="layer.opacity" :min="0" :max="1" :interval="0.01">
                <span v-translate>Opacity</span>
              </slider>
            </div>
            <div class="layer-control-item">
              <input-checkbox v-model="layer.blendModes">
                <span>Blend pixels</span>
              </input-checkbox>
            </div>
          </template>
        </dropdown-content>
      </div>
    </div>
    <div class="layers-group">
      <sub-panel-title><span v-translate>Slopes</span></sub-panel-title>
      <div class="layer-items">
        <div v-for="layer of slopesLayersSelector" :key="layer.title" class="layer-item">
          <layer-button v-model="layer.checked" :image="layer.image" :country="layer.country">
            <span>{{ $gettext(layer.title, 'Map slopes layer') }}</span>
          </layer-button>
        </div>
      </div>
      <div class="layer-controls">
        <dropdown-content v-for="layer of slopesLayersSelectorChecked" :key="layer.title" class="mb-2">
          <span>
            <fa-icon icon="gear" />
            <span>{{ $gettext(layer.title, 'Map slopes layer') }}</span>
          </span>
          <template #content>
            <div class="layer-control-item">
              <slider v-model="layer.opacity" :min="0" :max="1" :interval="0.01">
                <span v-translate>Opacity</span>
              </slider>
            </div>
            <div class="layer-control-item">
              <input-checkbox v-model="layer.blendModes">
                <span>Blend pixels</span>
              </input-checkbox>
            </div>
          </template>
        </dropdown-content>
      </div>
    </div>
    <div class="layers-group">
      <sub-panel-title><span v-translate>Base layers</span></sub-panel-title>
      <div class="layer-items">
        <div
          v-for="layer of baseLayersSelector"
          :key="layer.title"
          class="layer-item"
          :class="{ 'is-small': layer.small }"
        >
          <layer-button
            type="radio"
            name="baselayer"
            v-model="selectedBaseLayer"
            :model="layer"
            :image="layer.image"
            :country="layer.country"
          >
            <span>{{ $gettext(layer.title, 'Map layer') }}</span>
          </layer-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import DropdownContent from '@/components/yeti/DropdownContent.vue';
import LayerButton from '@/components/yeti/LayerButton.vue';
import Slider from '@/components/yeti/Slider.vue';
import SubPanelTitle from '@/components/yeti/SubPanelTitle.vue';
import Yetix from '@/components/yeti/Yetix.vue';
import type { SelectorLayer } from '@/components/yeti/yetix-types';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { getPreferences } from '@/js/vue-plugins/local-storage';

// stored under the name the component had, as before: existing preferences are kept
const preferences = getPreferences('Yeti');

const { $gettext } = useGlobalProperties();

const showAreasWasTrue = ref<boolean | null>(null);

const mapZoom = computed(() => Yetix.mapZoom as number);
const baseLayersSelector = computed(() => Yetix.baseLayersSelector as SelectorLayer[]);
const selectedBaseLayer = computed({
  get: () => baseLayersSelector.value.find((layer) => layer.checked),
  set(layer) {
    baseLayersSelector.value.forEach((other) => (other.checked = false));
    layer!.checked = true;
    // store current map layers base
    preferences.set('yeti-map-layers-base', layer!.title);
  },
});
const slopesLayersSelector = computed(() => Yetix.slopesLayersSelector as SelectorLayer[]);
const slopesLayersSelectorChecked = computed(() => slopesLayersSelector.value.filter((layer) => layer.checked));
const overlaysLayersSelector = computed(() => Yetix.overlaysLayersSelector as SelectorLayer[]);
const overlaysLayersLarge = computed(() => overlaysLayersSelector.value.filter((layer) => !layer.small));
const overlaysLayersSmall = computed(() => overlaysLayersSelector.value.filter((layer) => layer.small));
const overlaysLayersLargeCheckedAndNeedContent = computed(() =>
  overlaysLayersLarge.value.filter((layer) => layer.checked && layer.contentComponent)
);
const overlaysLayersSmallCheckedAndNeedContent = computed(() =>
  overlaysLayersSmall.value.filter((layer) => layer.checked && layer.contentComponent)
);
const yetiLayersSelector = computed(() => Yetix.yetiLayersSelector as SelectorLayer[]);
const yetiLayersSelectorChecked = computed(() =>
  yetiLayersSelector.value.filter((layer) => layer.checked && layer.title !== $gettext('Extent'))
);
const showAreas = computed(() => Yetix.showAreas as boolean);

// uncheck yeti extent checkbox when zoom is reached
// store old state if true, and revert back when zoom is valid
// (good for perf because only 2 layers max will be visible instead of 4)
watch(mapZoom, () => {
  if (mapZoom.value > Yetix.BLEND_MODES_MAX_ZOOM) {
    if (showAreas.value) {
      showAreasWasTrue.value = showAreas.value;
    }
    Yetix.setShowAreas(false);
  } else if (showAreasWasTrue.value) {
    Yetix.setShowAreas(true);
    showAreasWasTrue.value = null;
  }
});

// store current slope layers
watch(slopesLayersSelectorChecked, (layers) => {
  preferences.set(
    'yeti-map-layers-slopes',
    layers.map((layer) => layer.title)
  );
});
</script>

<style scoped lang="scss">
$width: calc(70 / 14 * 1rem);
$height: calc(50 / 14 * 1rem);

.layers-group {
  margin-bottom: 2rem;
}
.layer-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, $width);
  grid-template-rows: repeat(auto-fill, 1.429rem);
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
  margin-left: 3px;
  margin-right: 3px;
}
.layer-item {
  grid-row-end: span 4;
}
.is-small {
  grid-column-end: span 2;
  grid-row-end: span 1;
}
.layer-controls {
  margin-top: 1rem;
}
.layer-control-item {
  margin: 0.5rem 1rem;
}
</style>
