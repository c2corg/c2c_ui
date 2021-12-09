<script>
import layerMixin from './layer';

import Yetix from '@/components/yeti/Yetix';
import ol from '@/js/libs/ol';

let areasLayerStyle = (mapZoom) => {
  const MIN_ZOOM = 8;
  const MAX_ZOOM = 10;
  const MIN_OPACITY = 0;
  const MAX_OPACITY = 0.8;

  let opacity = MAX_OPACITY;
  let strokeWidth = 1;

  if (mapZoom) {
    // opacity should be
    // 0.8 (default)
    // gradually decreasing between min and max zooms
    // 0 when zoom is > max
    if (mapZoom >= MIN_ZOOM && mapZoom <= MAX_ZOOM) {
      opacity = (MAX_ZOOM - mapZoom) * (MAX_OPACITY / (MAX_ZOOM - MIN_ZOOM));
    } else if (mapZoom > MAX_ZOOM) {
      opacity = MIN_OPACITY;
    }

    // increase stroke when zoom > max
    if (mapZoom > MAX_ZOOM) {
      strokeWidth = 2;
    }
  }

  return new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: `hsla(20, 90%, 45%, .85)`,
      width: strokeWidth,
    }),
    fill: new ol.style.Fill({
      color: `hsla(20, 90%, 55%, ${opacity})`,
    }),
  });
};

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
    this.areasLayer = new ol.layer.Vector({
      renderMode: 'image',
      source: new ol.source.Vector(),
      style: areasLayerStyle(),
    });
    this.map.addLayer(this.areasLayer);

    // showAreas checked?
    this.areasLayer.setVisible(this.showAreas);

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
    },
    onMapMoveEnd() {
      // is area OK ?
      this.isAreaOK();
      // update areas layer style
      this.areasLayer.setStyle(areasLayerStyle(this.mapZoom));
    },
  },
  render() {
    return null;
  },
};
</script>
