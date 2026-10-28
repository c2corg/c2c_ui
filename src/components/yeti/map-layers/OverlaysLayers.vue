<template>
  <div>
    <protected-areas-layer ref="protectedAreasLayer" @layer="onLayer($event, 2)" />
    <meteo-layer ref="meteoLayer" :visible="meteoTab" />
    <winter-route-layer ref="winterRouteLayer" @layer="onLayer($event, 1)" />
    <avalanche-bulletins-layer ref="avalancheBulletinsLayer" @layer="onLayer($event, 0)" />
    <data-avalanche-layer ref="dataAvalancheLayer" @layer="onLayer($event, 3)" />
    <ffvl-layer ref="ffvlLayer" @layer="onLayer($event, 7)" />
    <flowcapt-layer ref="flowcaptLayer" @layer="onLayer($event, 6)" />
    <nivoses-layer ref="nivosesLayer" @layer="onLayer($event, 4)" />
    <romma-layer ref="rommaLayer" @layer="onLayer($event, 5)" />
    <route-layer ref="routeLayer" />
  </div>
</template>

<script setup lang="ts">
import type { FeatureLike } from 'ol/Feature';
import type MapBrowserEvent from 'ol/MapBrowserEvent';
import type BaseLayer from 'ol/layer/Base';
import type TileLayer from 'ol/layer/Tile';
import { computed, onBeforeUnmount, onMounted, useTemplateRef } from 'vue';

import { useLayer } from './layer';

import AvalancheBulletinsLayer from '@/components/yeti/map-layers/AvalancheBulletinsLayer.vue';
import DataAvalancheLayer from '@/components/yeti/map-layers/DataAvalancheLayer.vue';
import FfvlLayer from '@/components/yeti/map-layers/FfvlLayer.vue';
import FlowcaptLayer from '@/components/yeti/map-layers/FlowcaptLayer.vue';
import MeteoLayer from '@/components/yeti/map-layers/MeteoLayer.vue';
import NivosesLayer from '@/components/yeti/map-layers/NivosesLayer.vue';
import ProtectedAreasLayer from '@/components/yeti/map-layers/ProtectedAreasLayer.vue';
import RommaLayer from '@/components/yeti/map-layers/RommaLayer.vue';
import RouteLayer from '@/components/yeti/map-layers/RouteLayer.vue';
import WinterRouteLayer from '@/components/yeti/map-layers/WinterRouteLayer.vue';
import Yetix from '@/components/yeti/yetix';
import yetixEvents from '@/components/yeti/yetix-events';
import type { SelectorLayer } from '@/components/yeti/yetix-types';
import ol from '@/js/libs/ol';

// a feature under the pointer, or the pixel of a raster layer
type Hit = FeatureLike | NonNullable<ReturnType<TileLayer['getData']>>;
type MapEvent = MapBrowserEvent<PointerEvent>;
// what each layer exposes: its OpenLayers layer, and what it does on a click or a move over it, or elsewhere
type OverlayLayer = {
  getLayer(): BaseLayer;
  onMapClick?(evt: MapEvent, feature: Hit): void;
  onMapLooseClick?(): void;
  onMapPointerMove?(evt: MapEvent, feature: Hit): void;
  onMapLoosePointerMove?(): void;
};

const { map } = useLayer();

// layers, in click order
const LAYER_REFS = [
  'protectedAreasLayer',
  'meteoLayer',
  'winterRouteLayer',
  'avalancheBulletinsLayer',
  'dataAvalancheLayer',
  'ffvlLayer',
  'flowcaptLayer',
  'nivosesLayer',
  'rommaLayer',
  'routeLayer',
];
const layerRefs = LAYER_REFS.map((name) => useTemplateRef<OverlayLayer>(name));
let layers: OverlayLayer[] = [];

const editMode = computed(() => Yetix.editMode);
const activeTab = computed(() => Yetix.activeTab);
const tabs = computed(() => Yetix.tabs as { id: string }[]);
const meteoTab = computed(() => tabs.value[activeTab.value]?.id === 'meteo');

function dealWithEventsOnEachLayer(
  evt: MapEvent,
  fnMap: 'onMapClick' | 'onMapPointerMove',
  fnMapLoose: 'onMapLooseClick' | 'onMapLoosePointerMove'
) {
  // no event if editMode is on
  if (editMode.value) {
    return;
  }
  layers.every((layer) => {
    const olLayer = layer.getLayer();

    // go to next layer if this layer is not visible
    if (!olLayer.getVisible()) {
      return true;
    }

    let feature: Hit | null = null;

    if (evt.pixel) {
      // vector layers
      feature =
        map.value.getFeaturesAtPixel(evt.pixel, {
          layerFilter: (_layer) => _layer.get('name') === olLayer.get('name'),
        })[0] ?? null;

      // raster layers (or group of raster layers)
      if (!feature) {
        let rasterLayers: TileLayer[] = [];
        if (olLayer instanceof ol.layer.Tile) {
          rasterLayers = [olLayer];
        }
        if (olLayer instanceof ol.layer.Group) {
          rasterLayers = [...olLayer.getLayers().getArray()].reverse() as TileLayer[];
        }
        rasterLayers.every((rasterLayer) => {
          const data = rasterLayer.getData(evt.pixel);
          if (data && (data as Uint8ClampedArray)[3] > 0) {
            feature = data;
            return false;
          }
          return true;
        });
      }
    }

    if (feature) {
      layer[fnMap]?.(evt, feature);

      // say to other layers that event is already captured
      const otherLayers = layers.filter((_layer) => _layer.getLayer().get('name') !== olLayer.get('name'));
      otherLayers.forEach((other) => other[fnMapLoose]?.());

      // stop iterating layers
      return false;
    } else {
      layer[fnMapLoose]?.();
    }

    // continue to next layer
    return true;
  });
}

function onLayer(layer: SelectorLayer, index: number) {
  Yetix.addLayerToOverlaysLayersSelector(layer, index);
}

// deal with events
// each layer could react to click events, BUT
// if layer is on top, it should prevent layers beneath to also react
const onMapClick = (evt: unknown) => dealWithEventsOnEachLayer(evt as MapEvent, 'onMapClick', 'onMapLooseClick');
const onMapPointerMove = (evt: unknown) =>
  dealWithEventsOnEachLayer(evt as MapEvent, 'onMapPointerMove', 'onMapLoosePointerMove');

onMounted(() => {
  layers = layerRefs.map((layerRef) => layerRef.value!).reverse();

  yetixEvents.on('map-click', onMapClick);
  yetixEvents.on('map-pointermove', onMapPointerMove);
});

// they stayed after leaving the page
onBeforeUnmount(() => {
  yetixEvents.off('map-click', onMapClick);
  yetixEvents.off('map-pointermove', onMapPointerMove);
});
</script>
