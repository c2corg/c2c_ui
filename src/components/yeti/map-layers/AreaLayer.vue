<template>
  <div>
    <base-layers @layers="onBaseLayers"></base-layers>
    <slopes-layers @layers="onSlopesLayers"></slopes-layers>
  </div>
</template>
<script>
import layerMixin from './layer';
import layerSelectorWatcherMixin from './layer-selector-watcher';

import Yetix from '@/components/yeti/Yetix';
import BaseLayers from '@/components/yeti/map-layers/BaseLayers';
import SlopesLayers from '@/components/yeti/map-layers/SlopesLayers';
import ol from '@/js/libs/ol';

export default {
  components: {
    BaseLayers,
    SlopesLayers,
  },
  mixins: [layerMixin, layerSelectorWatcherMixin],
  computed: {
    mapZoom() {
      return Yetix.mapZoom;
    },
    areas() {
      return Yetix.areas;
    },
    showAreas() {
      return Yetix.showAreas;
    },
    layerSelector() {
      return {
        title: this.$gettext('Extent'),
        checked: this.showAreas,
        action: this.onShowAreas,
        disabled: {
          condition: this.mapZoom > Yetix.BLEND_MODES_MAX_ZOOM,
          title: this.$gettext('Disabled at this zoom level'),
          message: this.$gettext('Zoom out and it will be OK'),
        },
        image: 'yeti-extent.jpg',
      };
    },
  },
  watch: {
    showAreas() {
      this.updateVisibility();
    },
  },
  created() {
    // layer for outer stroke of areas
    this.areasStrokeLayer = new ol.layer.VectorImage({
      source: new ol.source.Vector(),
      style: [
        new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: `rgba(0, 0, 0, 0.2)`,
            width: 14,
          }),
        }),
        new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: `rgba(0, 0, 0, 0.75)`,
            width: 1,
          }),
        }),
      ],
    });
    // layer for clip
    // should set className, this forces ol to create another canvas
    this.areasLayer = new ol.layer.VectorImage({
      className: Yetix.BLEND_MODES_CLASS_NAME,
      source: new ol.source.Vector(),
      style: new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'white',
        }),
      }),
    });
    // group for c2c layers, clipped
    this.groupLayer = new ol.layer.Group({
      layers: [],
    });

    this.baseLayers = [];
    this.slopesLayers = [];
  },
  mounted() {
    // add layers
    this.map.addLayer(this.areasStrokeLayer);
    this.map.addLayer(this.areasLayer);
    this.map.addLayer(this.groupLayer);

    // showAreas checked?
    this.updateVisibility();

    this.$emit('layer', this.layerSelector);

    // only in first mount
    if (this.areas.length === 0) {
      // set areas (yeti valid areas)
      Yetix.fetchAreas().then(this.onAreasResult);
      // event
      Yetix.$on('mapMoveEnd', this.onMapMoveEnd);
    }
  },
  methods: {
    onAreasResult(data) {
      let areasFeatures = this.getFeaturesFromData(data);
      let areas = this.getPropertiesFromFeatures(areasFeatures);

      // set areas in state
      Yetix.setAreas(areas);

      // add features
      this.areasLayer.getSource().addFeatures(areasFeatures);
      this.areasStrokeLayer.getSource().addFeatures(areasFeatures);

      // check is area OK
      this.isAreaOK();
    },
    isAreaOK() {
      let mapExtent = this.getExtent('EPSG:3857');

      let areaOk = true;

      for (let area in this.areas) {
        let polygon = this.areas[area].geometry;
        if (polygon.intersectsExtent(mapExtent)) {
          break;
        } else {
          areaOk = false;
        }
      }
      Yetix.setAreaOk(areaOk);
    },
    onShowAreas() {
      Yetix.setShowAreas(!this.showAreas);
    },
    updateVisibility() {
      this.areasLayer.setVisible(this.showAreas);
      this.groupLayer.setVisible(this.showAreas);
      this.areasStrokeLayer.setVisible(this.showAreas);
    },
    onMapMoveEnd() {
      // is area OK ?
      this.isAreaOK();
    },
    onBaseLayers(baseLayers) {
      let layers = baseLayers.map((layer) => {
        layer.className_ = Yetix.BLEND_MODES_CLASS_NAME;
        layer.on('prerender', (evt) => {
          // source-atop: means the source (this layer) will only be drawn on actual pixels (area layer)
          // but only when MAX_ZOOM
          if (this.mapZoom <= Yetix.BLEND_MODES_MAX_ZOOM) {
            evt.context.globalCompositeOperation = 'source-atop';
          }
        });
        layer.on('postrender', (evt) => {
          // source-over: returns to default
          evt.context.globalCompositeOperation = 'source-over';
        });
        return layer;
      });
      this.baseLayers = layers;

      this.groupLayer.setLayers(new ol.Collection(layers));
    },
    onSlopesLayers(slopesLayers) {
      let layers = slopesLayers.map((layer) => {
        layer.className_ = Yetix.BLEND_MODES_CLASS_NAME;
        return layer;
      });
      this.slopesLayers = layers;

      let groupLayers = this.groupLayer.getLayers();
      layers.map((layer) => groupLayers.push(layer));
      this.groupLayer.setLayers(groupLayers);
    },
  },
};
</script>
