<script setup lang="ts">
import type { Extent } from 'ol/extent';
import type Polygon from 'ol/geom/Polygon';
import type RenderEvent from 'ol/render/Event';
import { computed, onMounted, watch } from 'vue';

import { useLayer } from './layer';

import Yetix from '@/components/yeti/Yetix.vue';
import type { SelectorLayer } from '@/components/yeti/yetix-types';
import { useGlobalProperties } from '@/js/composables/global-properties';
import ol from '@/js/libs/ol';

// renderless: it only adds OpenLayers layers to the map
defineOptions({ render: () => null });
const emit = defineEmits(['layer']);

const { $gettext } = useGlobalProperties();
const { map } = useLayer();

const yetiData = computed(() => Yetix.yetiData as string | null);

const yetiExtent = computed(() => Yetix.yetiExtent as Extent);

const showAreas = computed(() => Yetix.showAreas);

const showYeti = computed(() => Yetix.showYeti);

const yetiOk = computed(() => Yetix.yetiOk);

const layerSelector = computed(() => {
  return {
    title: $gettext('Risk'),
    checked: showYeti.value,
    action: onShowYeti,
    disabled: {
      condition: !yetiOk.value,
      title: $gettext('No risk to show yet'),
      message: $gettext('Compute one for a specific zone from the “Risk” tab'),
    },
    image: 'yeti-risk.jpg',
    opacity: Yetix.YETI_LAYER_OPACITY,
    blendModes: true,
  };
});

const yetiLayersSelector = computed(() => Yetix.yetiLayersSelector as SelectorLayer[]);

function getLayer() {
  return layer;
}

function onShowYeti() {
  Yetix.setShowYeti(!showYeti.value);
}

function clearLayers() {
  layer.setSource(null);

  extentLayer.getSource()!.clear();
}

function drawExtent(extent: Extent) {
  // extend extent
  let extentFill = ol.extent.buffer(extent, Math.max(extent[2] - extent[0], extent[3] - extent[1]) / 10);
  // then, create a donut polygon
  let feature = new ol.Feature(new ol.geom.Polygon([toLinearRing(extentFill), toLinearRing(extent)]));
  // add feature to extentlayer
  extentLayer.getSource()!.addFeature(feature);
}

function drawImage() {
  const xml = new DOMParser().parseFromString(yetiData.value!, 'application/xml');
  const imageBase64 = xml.getElementsByTagName('wps:ComplexData')[0].textContent;
  const imageBbox = xml.getElementsByTagName('wps:ComplexData')[1].textContent!;
  const imageExtent = ol.proj.transformExtent(imageBbox.split(',').map(Number), 'EPSG:4326', 'EPSG:3857');

  layer.setSource(
    new ol.source.ImageStatic({
      // the image is in the response: no URL to load
      url: '',
      imageLoadFunction(image) {
        (image.getImage() as HTMLImageElement).src = 'data:image/png;base64,' + imageBase64;
      },
      imageExtent,
    })
  );
  // source is set
  Yetix.setYetiOk(true);
  // set yeti legend
  setLegend(xml);
}

function setLegend(xml: Document) {
  const legend = JSON.parse(xml.getElementsByTagName('wps:ComplexData')[2].textContent!);
  legend.items.forEach((item: { color: number[] | string }) => {
    item.color = `rgb(${item.color[0]}, ${item.color[1]}, ${item.color[2]})`;
  });
  // add attribution (each attribution on its own line)
  layer.getSource()!.setAttributions(legend.attributions);
  // set legend in yetix
  Yetix.setYetiLegend(legend);
}

function toLinearRing(extent: Extent) {
  let minX = extent[0];
  let minY = extent[1];
  let maxX = extent[2];
  let maxY = extent[3];
  return [
    [minX, minY],
    [minX, maxY],
    [maxX, maxY],
    [maxX, minY],
    [minX, minY],
  ];
}

function setLayerClassName() {
  // it switches classname based on showareas visibility
  // use same name as areas if showareas, so blend modes will apply to this layer
  // or use default ol-layer to apply blend modes to whole layers
  (layer as unknown as { className_: string }).className_ = showAreas.value ? Yetix.BLEND_MODES_CLASS_NAME : 'ol-layer';
}

function setLayerOpacity(opacity: number) {
  layer.setOpacity(opacity);
}

// the canvas of a layer being rendered
function context(evt: RenderEvent) {
  return evt.context as CanvasRenderingContext2D;
}

function setLayerBlendModes(isBlend: boolean) {
  layer.on('prerender', (evt) => {
    context(evt).globalCompositeOperation = isBlend ? 'multiply' : 'source-over';
  });
  // force re-render
  layer.setOpacity(layer.getOpacity() + 0.01);
}

watch(
  layerSelector,
  (layer) => {
    emit('layer', layer);
  },
  { deep: true }
);

watch(yetiData, () => {
  if (!yetiData.value) {
    clearLayers();
    return;
  }
  drawImage();
});

watch(yetiExtent, () => {
  drawExtent(yetiExtent.value);
});

watch(showAreas, () => {
  // switch classname when showareas updates
  setLayerClassName();
});

watch(showYeti, () => {
  layer.setVisible(showYeti.value);
  extentLayer.setVisible(showYeti.value);
});

watch(
  yetiLayersSelector,
  (layers) => {
    setLayerOpacity(layers[0].opacity!);
    setLayerBlendModes(layers[0].blendModes!);
  },
  { deep: true }
);

// created
const layer = new ol.layer.Image({
  source: new ol.source.ImageStatic({
    url: null as unknown as string,
    imageExtent: ol.extent.createEmpty(),
  }),
  opacity: Yetix.YETI_LAYER_OPACITY,
});
const extentLayer = new ol.layer.Vector({
  source: new ol.source.Vector(),
  style: [
    new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'hsla(30, 100%, 60%, .45)',
      }),
    }),
    new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'hsla(30, 100%, 40%, 1)',
        width: 2,
      }),
      geometry: (feature) => {
        return new ol.geom.Polygon([(feature.getGeometry() as Polygon).getCoordinates()[1]]);
      },
    }),
  ],
});
// blend modes multiply for yeti layer
layer.on('prerender', (evt) => {
  context(evt).globalCompositeOperation = 'multiply';
});
layer.on('postrender', (evt) => {
  context(evt).globalCompositeOperation = 'source-over';
});

onMounted(() => {
  map.value.addLayer(layer);
  map.value.addLayer(extentLayer);

  setLayerClassName();

  emit('layer', layerSelector.value);
});

defineExpose({ getLayer });
</script>
