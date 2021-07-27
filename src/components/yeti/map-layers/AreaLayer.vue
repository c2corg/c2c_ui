<script>
import axios from 'axios';

import layerMixin from './layer';

import { $yetix } from '@/components/yeti/yetix';
import ol from '@/js/libs/ol';

const YETI_URL_AREAS = 'https://api.ensg.eu/yeti-extent';

export default {
  mixins: [layerMixin],
  computed: {
    areasLayerStyle() {
      let levelStrokeWidth = 2;
      let levelStrokeOpacity = 4;
      let lineWidthStroke = Math.max(0, Math.min(this.mapZoom() - 6, levelStrokeWidth));
      let opacityStroke = Math.max(0, Math.min(this.mapZoom() - 6, levelStrokeOpacity)) / 4;
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
    // set areas (yeti valid areas)
    axios.get(YETI_URL_AREAS).then(this.onAreasResult);
    //
    $yetix.$on('mapMoveEnd', this.onMapMoveEnd);
  },
  methods: {
    onAreasResult(data) {
      let areas = data.data;
      let rawFeatures = new ol.format.GeoJSON().readFeatures(areas);
      // geojson is 4326, convert to 3857
      rawFeatures[0].getGeometry().transform('EPSG:4326', 'EPSG:3857');

      this.areas = rawFeatures.map((area) => {
        return area.getProperties();
      });

      // flatten coords
      let rawCoords = rawFeatures[0].getGeometry().getCoordinates();
      let coords = [];
      for (let i = 0; i < rawCoords.length; i++) {
        coords.push(...rawCoords[i]);
      }
      // then, build linestrings instead of polygon (perf)
      let features = [];
      for (let i = 0; i < coords.length; i++) {
        for (let j = 0; j < coords[i].length - 1; j++) {
          features.push(new ol.Feature(new ol.geom.LineString([coords[i][j], coords[i][j + 1]])));
        }
      }

      // add features
      this.areasLayer.getSource().addFeatures(features);
      // is area OK
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

      $yetix.$emit('areaOk', areaOk);
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
