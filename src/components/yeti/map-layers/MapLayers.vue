<template>
  <div>
    <base-layers @layers="onBaseLayers"></base-layers>
    <slopes-layers @layers="onSlopesLayers"></slopes-layers>
  </div>
</template>

<script>
import layerMixin from './layer';

import Yetix from '@/components/yeti/Yetix';
import BaseLayers from '@/components/yeti/map-layers/BaseLayers';
import SlopesLayers from '@/components/yeti/map-layers/SlopesLayers';

export default {
  components: {
    BaseLayers,
    SlopesLayers,
  },
  mixins: [layerMixin],
  computed: {
    mapZoom() {
      return Yetix.mapZoom;
    },
    showAreas() {
      return Yetix.showAreas;
    },
  },
  watch: {
    showAreas() {
      this.updateCartoLayersOpacity();
    },
  },
  created() {
    this.baseLayers = [];
    this.slopesLayers = [];
  },
  mounted() {
    Yetix.$on('mapMoveEnd', this.onMapMoveEnd);
  },
  methods: {
    onBaseLayers(baseLayers) {
      this.baseLayers = baseLayers;
      baseLayers.map((layer) => this.map.addLayer(layer));
    },
    onSlopesLayers(slopesLayers) {
      this.slopesLayers = slopesLayers;
      slopesLayers.map((layer) => this.map.addLayer(layer));
    },
    onMapMoveEnd() {
      // if Yeti extent is here, update (on zooming for example)
      if (this.showAreas) {
        this.updateCartoLayersOpacity();
      }
    },
    updateCartoLayersOpacity() {
      const MIN_ZOOM = Yetix.BLEND_MODES_MIN_ZOOM;
      const MAX_ZOOM = Yetix.BLEND_MODES_MAX_ZOOM;
      const MIN_OPACITY = 0.25;
      const MAX_OPACITY = 1;
      const DELTA_OPACITY = MAX_OPACITY - MIN_OPACITY;

      let opacity = MIN_OPACITY;
      // opacity should increase gradually between min and max zooms
      if (this.mapZoom >= MIN_ZOOM && this.mapZoom <= MAX_ZOOM) {
        // opacity is between 1 and 0
        opacity = (MAX_ZOOM - this.mapZoom) * (MAX_OPACITY / (MAX_ZOOM - MIN_ZOOM));
        // map value to min/max opacity
        opacity = Math.abs(1 - opacity) * DELTA_OPACITY + MIN_OPACITY;
      } else if (this.mapZoom > MAX_ZOOM) {
        opacity = MAX_OPACITY;
      }

      // for each carto layers, set opacity if yeti extent is shown
      this.baseLayers.forEach((layer) => {
        layer.setOpacity(this.showAreas ? opacity : 1);
      });
    },
  },
  render() {
    return null;
  },
};
</script>
