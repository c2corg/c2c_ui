<template>
  <div>
    <winter-route-layer @layer="onLayer($event, 1)" />
    <avalanche-bulletins-layer @layer="onLayer($event, 0)" />
    <data-avalanche-layer @layer="onLayer($event, 2)" />
    <ffvl-layer @layer="onLayer($event, 6)" />
    <flowcapt-layer @layer="onLayer($event, 5)" />
    <nivoses-layer @layer="onLayer($event, 3)" />
    <romma-layer @layer="onLayer($event, 4)" />
    <route-layer />
  </div>
</template>

<script>
import layerMixin from './layer';

import Yetix from '@/components/yeti/Yetix';
import AvalancheBulletinsLayer from '@/components/yeti/map-layers/AvalancheBulletinsLayer.vue';
import DataAvalancheLayer from '@/components/yeti/map-layers/DataAvalancheLayer.vue';
import FfvlLayer from '@/components/yeti/map-layers/FfvlLayer.vue';
import FlowcaptLayer from '@/components/yeti/map-layers/FlowcaptLayer.vue';
import NivosesLayer from '@/components/yeti/map-layers/NivosesLayer.vue';
import RommaLayer from '@/components/yeti/map-layers/RommaLayer.vue';
import RouteLayer from '@/components/yeti/map-layers/RouteLayer.vue';
import WinterRouteLayer from '@/components/yeti/map-layers/WinterRouteLayer.vue';
import ol from '@/js/libs/ol';

export default {
  components: {
    AvalancheBulletinsLayer,
    DataAvalancheLayer,
    FfvlLayer,
    FlowcaptLayer,
    NivosesLayer,
    RommaLayer,
    RouteLayer,
    WinterRouteLayer,
  },
  mixins: [layerMixin],
  computed: {
    editMode() {
      return Yetix.editMode;
    },
  },
  mounted() {
    // deal with events
    // each layer could react to click events, BUT
    // if layer is on top, it should prevent layers beneath to also react

    // layers, in click order
    this.layers = this.$children.reverse();

    // add events
    Yetix.$on('map-click', (evt) => {
      this.dealWithEventsOnEachLayer(evt, 'onMapClick', 'onMapLooseClick');
    });

    Yetix.$on('map-pointermove', (evt) => {
      this.dealWithEventsOnEachLayer(evt, 'onMapPointerMove', 'onMapLoosePointerMove');
    });
  },
  methods: {
    dealWithEventsOnEachLayer(evt, fnMap, fnMapLoose) {
      // no event if editMode is on
      if (this.editMode) {
        return;
      }
      this.layers.every((layer) => {
        let olLayer = layer.getLayer();

        // go to next layer if this layer is not visible
        if (!olLayer.getVisible()) {
          return true;
        }

        let feature = null;

        if (evt.pixel) {
          // vector layers
          feature = this.map.getFeaturesAtPixel(evt.pixel, {
            layerFilter: function (_layer) {
              return _layer.get('name') === olLayer.get('name');
            },
          })[0];

          // raster layers
          if (!feature && olLayer instanceof ol.layer.Tile) {
            let data = olLayer.getData(evt.pixel);
            if (data && data[3] > 0) {
              feature = data;
            }
          }
        }

        if (feature) {
          if (layer[fnMap]) {
            layer[fnMap](evt, feature);
          }

          // say to other layers that event is already captured
          let otherLayers = this.layers.filter((_layer) => _layer.getLayer().get('name') !== olLayer.get('name'));
          otherLayers.forEach((layer) => {
            if (layer[fnMapLoose]) {
              layer[fnMapLoose]();
            }
          });

          // stop iterating layers
          return false;
        } else {
          if (layer[fnMapLoose]) {
            layer[fnMapLoose]();
          }
        }

        // continue to next layer
        return true;
      });
    },
    onLayer(layer, index) {
      Yetix.addLayerToOverlaysLayersSelector(layer, index);
    },
  },
};
</script>
