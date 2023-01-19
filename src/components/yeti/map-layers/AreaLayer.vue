<script>
import layerMixin from './layer';

import { cartoLayers, dataLayers } from '@/components/map/map-layers';
import Yetix from '@/components/yeti/Yetix';
import ol from '@/js/libs/ol';

// c2c layers
let c2c_cartoLayers = cartoLayers();
let c2c_dataLayers = dataLayers();

export default {
  mixins: [layerMixin],
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
  },
  watch: {
    showAreas() {
      this.onShowAreas();
    },
  },
  mounted() {
    // override default values for each c2c layer:
    // className = allow for compositiing between layers
    // prerender/postrender = set bend modes to create clipping
    c2c_cartoLayers = c2c_cartoLayers.map((layer) => {
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

    c2c_dataLayers = c2c_dataLayers.map((layer) => {
      layer.className_ = Yetix.BLEND_MODES_CLASS_NAME;
      layer.setOpacity(0.9);
      layer.on('prerender', (evt) => {
        // multiply: means pixels are multiplied with actual ones
        evt.context.globalCompositeOperation = 'multiply';
      });
      layer.on('postrender', (evt) => {
        evt.context.globalCompositeOperation = 'source-over';
      });
      return layer;
    });

    // layer for outer stroke of areas
    this.areasStrokeLayer = new ol.layer.Vector({
      renderMode: 'image',
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
    this.map.addLayer(this.areasStrokeLayer);

    // layer for clip
    // should set className, this forces ol to create another canvas
    this.areasLayer = new ol.layer.Vector({
      className: Yetix.BLEND_MODES_CLASS_NAME,
      renderMode: 'image',
      source: new ol.source.Vector(),
      style: new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'white',
        }),
      }),
    });
    this.map.addLayer(this.areasLayer);

    // group for c2c layers, clipped
    this.groupLayer = new ol.layer.Group({
      layers: [...c2c_cartoLayers, ...c2c_dataLayers],
    });
    this.map.addLayer(this.groupLayer);

    // showAreas checked?
    this.onShowAreas();

    // only in first mount
    if (this.areas.length === 0) {
      // set areas (yeti valid areas)
      Yetix.fetchAreas().then(this.onAreasResult);
      // event
      Yetix.$on('mapMoveEnd', this.onMapMoveEnd);
      Yetix.$on('layer-visibility', this.onLayerVisibility);
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
      this.areasLayer.setVisible(this.showAreas);
      this.groupLayer.setVisible(this.showAreas);
      this.areasStrokeLayer.setVisible(this.showAreas);
    },
    onMapMoveEnd() {
      // is area OK ?
      this.isAreaOK();
    },
    onLayerVisibility(cartoLayerIndex, dataLayersIndexes) {
      // toggle visibility based on currently active layers
      c2c_cartoLayers.map((layer, index) => {
        layer.setVisible(index === cartoLayerIndex);
      });

      c2c_dataLayers.map((layer, index) => {
        layer.setVisible(dataLayersIndexes.includes(index));
      });
    },
  },
  render() {
    return null;
  },
};
</script>
