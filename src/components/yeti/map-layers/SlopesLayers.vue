<script setup lang="ts">
import type BaseLayer from 'ol/layer/Base';
import type Layer from 'ol/layer/Layer';
import type RenderEvent from 'ol/render/Event';
import { computed, onMounted, watch } from 'vue';

import { dataLayers } from '@/components/map/map-layers';
import Yetix from '@/components/yeti/yetix';
import type { SelectorLayer } from '@/components/yeti/yetix-types';
import { getPreferences } from '@/js/vue-plugins/local-storage';

// renderless: it only adds OpenLayers layers to the map
defineOptions({ render: () => null });

// stored under the name the component had, as before: existing preferences are kept
const preferences = getPreferences('Yeti');

const emit = defineEmits(['layers']);

const slopesLayersSelector = computed(() => Yetix.slopesLayersSelector as SelectorLayer[]);

// draw the layer multiplied with the layers below
function compose(evt: RenderEvent, operation: CanvasRenderingContext2D['globalCompositeOperation']) {
  (evt.context as CanvasRenderingContext2D).globalCompositeOperation = operation;
}

function setLayerBlendModes(layer: Layer, isBlend: boolean) {
  layer.on('prerender', (evt) => compose(evt, isBlend ? 'multiply' : 'source-over'));
  // force re-render
  layer.setOpacity(layer.getOpacity() + 0.01);
}

function setBlendModes(layer: Layer) {
  layer.setOpacity(0.9);
  layer.on('prerender', (evt) => compose(evt, 'multiply'));
  layer.on('postrender', (evt) => compose(evt, 'source-over'));
  return layer;
}

// set our style
const slopesLayers: Layer[] = (dataLayers() as Layer[]).map(setBlendModes);

// first, get stored map layer
const storedLayerNames = preferences.get('yeti-map-layers-slopes', []) as string[];

watch(
  slopesLayersSelector,
  (layers) => {
    layers.forEach((layer, index) => {
      const slopeLayer = slopesLayers[index];
      slopeLayer.setVisible(layer.checked);
      slopeLayer.setOpacity(layer.opacity!);
      setLayerBlendModes(slopeLayer, layer.blendModes!);
    });
  },
  { deep: true }
);

// after the watcher: it shows the stored layers (as the watcher declared before created() did)
Yetix.setSlopesLayersSelector(
  slopesLayers.map((layer) => ({
    title: layer.get('title'),
    checked: storedLayerNames.includes(layer.get('title')),
    opacity: layer.getOpacity(),
    blendModes: true,
    image: layer.get('image'),
    country: layer.get('country'),
  }))
);

onMounted(() => {
  // emit new layers
  emit('layers', slopesLayers as BaseLayer[]);
});
</script>
