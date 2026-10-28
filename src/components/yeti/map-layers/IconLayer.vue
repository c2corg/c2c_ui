<template>
  <div ref="overlayElement" class="overlay">
    <p class="overlay-header" :style="{ background: color }">
      <slot></slot>
    </p>
    <div class="overlay-content">
      <slot name="overlay"></slot>
    </div>
    <img :src="iconCardSrc" alt="" class="overlay-icon" />
  </div>
</template>

<script setup lang="ts">
import type Feature from 'ol/Feature';
import type Point from 'ol/geom/Point';
import type VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';
import type Icon from 'ol/style/Icon';
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';

import { useLayer } from './layer';

import Yetix from '@/components/yeti/yetix';
import yetixEvents from '@/components/yeti/yetix-events';
import ol from '@/js/libs/ol';

const props = defineProps({
  // icons of the layer built on this one, if it has its own
  customIconSrc: {
    type: String,
    default: undefined,
  },
  customIconCardSrc: {
    type: String,
    default: undefined,
  },
  name: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  selector: {
    type: Object,
    required: true,
  },
});
const emit = defineEmits(['layer', 'add-features', 'set-overlay', 'unset-overlay']);

const { map, getFeaturesFromData, getPropertiesFromFeatures } = useLayer();

// the state of the layer in Yetix, by its name: flowcapt, setShowFlowcapt...
const yetix = Yetix as unknown as Record<string, unknown>;

const overlayElement = useTemplateRef<HTMLElement>('overlayElement');
let layer: VectorLayer<VectorSource<Feature<Point>>>;
let activeFeature: Feature<Point> | null = null;
// selected feature for hover
let selectedFeature: Feature<Point> | null = null;

const letter = computed(() => props.name.charAt(0).toUpperCase());
const capitalizedName = computed(() => letter.value + props.name.slice(1));
const dataLayer = computed(() => yetix[props.name] as unknown[]);
const showLayer = computed(() => yetix['show' + capitalizedName.value] as boolean);
const fetch = () => (yetix['fetch' + capitalizedName.value] as () => Promise<{ data: unknown }>)();
const setState = (state: unknown) => (yetix['set' + capitalizedName.value] as (state: unknown) => void)(state);

function onShowLayer() {
  (yetix['setShow' + capitalizedName.value] as (show: boolean) => void)(!showLayer.value);
}

const layerSelector = computed(() => ({
  ...props.selector,
  checked: showLayer.value,
  action: onShowLayer,
}));

const createIcon = (color = 'black') => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="-10 -10 20 20">
      <circle r="9" fill="${color}" stroke="white" stroke-width="1.5" />
      <text y="4" text-anchor="middle" font-family="sans-serif" font-size="10px" font-weight="bold" fill="white">${letter.value}</text>
    </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
};

// style
const iconSrc = props.customIconSrc || createIcon(props.color);
const style = new ol.style.Style({
  image: new ol.style.Icon({
    src: iconSrc,
    size: [26, 26],
  }),
});

// hovered style
const hoveredStyle = style.clone();
hoveredStyle.setZIndex(1);
hoveredStyle.getImage()!.setScale(1.3);

// "selected" style (only for card)
const iconCardSrc = ref(props.customIconCardSrc || createIcon());
const selectedStyle = new ol.style.Style({
  image: new ol.style.Icon({
    src: iconCardSrc.value,
    size: [26, 26],
  }),
});

const overlay = new ol.Overlay({
  positioning: 'top-left',
  offset: [-4, -6],
  className: 'overlay-container',
});

function getLayer() {
  return layer;
}

function onResult(data: { data: unknown }) {
  const features = getFeaturesFromData(data) as Feature<Point>[];

  // set data in state
  setState(getPropertiesFromFeatures(features));

  // add features
  layer.getSource()!.addFeatures(features);

  // store their style
  layer.getSource()!.forEachFeature((feature) => {
    feature.set('normalStyle', style);
    feature.set('hoveredStyle', hoveredStyle);
    feature.set('selectedStyle', selectedStyle);
  });

  // emit features for parent (modify style for each feature for example)
  emit('add-features', features);
}

function openOverlay(feature: Feature<Point>) {
  overlay.setPosition(feature.getGeometry()!.getCoordinates());
}

function closeOverlay(force = false) {
  overlay.setPosition(undefined);

  if (force) {
    emit('unset-overlay');
    activeFeature = null;
  }
}

function updateVisibility() {
  // set layer visibility
  layer.setVisible(showLayer.value);
  // if a feature is active (selected) and layer is visible
  // open overlay, else close
  if (activeFeature && showLayer.value) {
    openOverlay(activeFeature);
  } else {
    closeOverlay();
  }
}

function onMapClick(evt: unknown, feature: Feature<Point>) {
  emit('set-overlay', feature);
  activeFeature = feature;
  openOverlay(feature);

  // set icon for card on click
  iconCardSrc.value = (feature.get('selectedStyle').getImage() as Icon).getSrc()!;
}

function onMapLooseClick() {
  closeOverlay(true);
}

function onMapPointerMove(evt: unknown, feature: Feature<Point>) {
  if (selectedFeature && selectedFeature !== feature) {
    selectedFeature.setStyle(selectedFeature.get('normalStyle'));
  }
  selectedFeature = feature;
  // then, apply hovered style on specific feature
  feature.setStyle(feature.get('hoveredStyle'));
}

function onMapLoosePointerMove() {
  if (selectedFeature !== null) {
    selectedFeature.setStyle(selectedFeature.get('normalStyle'));
    selectedFeature = null;
  }
}

watch(showLayer, () => {
  // on first load
  if (dataLayer.value.length === 0) {
    // set data
    fetch().then(onResult);
  }
  // then, switch visibility
  updateVisibility();
});

onMounted(() => {
  layer = new ol.layer.Vector({
    source: new ol.source.Vector<Feature<Point>>(),
    style: style,
  });
  layer.set('name', capitalizedName.value + 'Layer');
  map.value.addLayer(layer);

  overlay.setElement(overlayElement.value!);
  map.value.addOverlay(overlay);

  // prevent event on map when overlay is open
  overlayElement.value!.addEventListener('pointermove', (evt) => {
    evt.stopImmediatePropagation();
    yetixEvents.emit('map-pointermove', evt);
  });

  // showLayer checked?
  layer.setVisible(showLayer.value);

  // get data?
  if (showLayer.value && dataLayer.value.length === 0) {
    fetch().then(onResult);
  }

  // the layer built on this one emits it again
  emit('layer', layerSelector.value);
});

// OverlaysLayers gives the map events to the layers; the layers built on this one, through useIconLayer()
defineExpose({ getLayer, onMapClick, onMapLooseClick, onMapPointerMove, onMapLoosePointerMove });
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables';

.overlay {
  min-width: 150px;
  max-width: 100%;
  background: $white;
  border-radius: 4px;
  box-shadow:
    0 0 3px rgba($black, 0.5),
    0 3px 8px rgba($black, 0.5);
  overflow: hidden;
}
.overlay-header {
  font-size: 0.9em;
  padding: 5px 0;
  text-align: center;
  color: $white;
}
.overlay-content {
  text-align: center;
  padding: 5px;
  vertical-align: 1px;
}
.overlay-content a:hover,
.overlay-content a:focus {
  text-decoration: underline;
}
.overlay-link-icon {
  margin-left: 5px;
}
.overlay-icon {
  position: absolute;
  transform: scale(1.3);
  top: -7px;
  left: -9px; /* iconSize / 2 */
  margin: auto;
  z-index: 2;
  pointer-events: none;
}
</style>
