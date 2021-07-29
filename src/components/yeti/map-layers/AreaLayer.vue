<script>
import layerMixin from './layer';

import { state, mutations, actions, bus } from '@/components/yeti/yetix';
import ol from '@/js/libs/ol';

export default {
  mixins: [layerMixin],
  computed: {
    mapZoom() {
      return state.mapZoom;
    },
    areas() {
      return state.areas;
    },
    areasLayerStyle() {
      let levelStrokeWidth = 2;
      let levelStrokeOpacity = 4;
      let lineWidthStroke = Math.max(0, Math.min(this.mapZoom - 6, levelStrokeWidth));
      let opacityStroke = Math.max(0, Math.min(this.mapZoom - 6, levelStrokeOpacity)) / 4;
      let lineDashStroke = opacityStroke * 6;

      return new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'hsla(30, 100%, 40%,' + opacityStroke + ')',
          width: lineWidthStroke,
          lineDash: [lineDashStroke],
        }),
      });
    },
  },
  mounted() {
    this.areasLayer = new ol.layer.Vector({
      renderMode: 'image',
      source: new ol.source.Vector(),
      style: this.areasLayerStyle,
    });
    this.map.addLayer(this.areasLayer);

    // only in first mount
    if (this.areas.length === 0) {
      // set areas (yeti valid areas)
      actions.fetchAreas().then(this.onAreasResult);
      // event
      bus.$on('mapMoveEnd', this.onMapMoveEnd);
    }
  },
  methods: {
    onAreasResult(data) {
      let areasFeatures = data.data;
      // read geoJSON, and project to 3857 (geoJSON is 4326 by default)
      areasFeatures = new ol.format.GeoJSON().readFeatures(areasFeatures, { featureProjection: 'EPSG:3857' });

      let areas = areasFeatures.map((area) => {
        return area.getProperties();
      });

      // set areas in state
      mutations.setAreas(areas);

      // to improve map rendering, we will build linestrings from polygon
      // first, flatten coords
      let rawCoords = areasFeatures[0].getGeometry().getCoordinates();
      let coords = [];
      for (let i = 0; i < rawCoords.length; i++) {
        coords.push(...rawCoords[i]);
      }
      // then, build linestrings
      let features = [];
      for (let i = 0; i < coords.length; i++) {
        for (let j = 0; j < coords[i].length - 1; j++) {
          features.push(new ol.Feature(new ol.geom.LineString([coords[i][j], coords[i][j + 1]])));
        }
      }
      // add features
      this.areasLayer.getSource().addFeatures(features);
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
      mutations.setAreaOk(areaOk);
    },
    onMapMoveEnd() {
      // is area OK ?
      this.isAreaOK();
      // update areas layer style
      this.areasLayer.setStyle(this.areasLayerStyle);
    },
  },
  render() {
    return null;
  },
};
</script>
