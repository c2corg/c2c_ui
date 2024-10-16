<script>
import { cartoLayers } from '@/components/map/map-layers';
import Yetix from '@/components/yeti/Yetix';
import ol from '@/js/libs/ol';

export default {
  computed: {
    baseLayersSelector() {
      return Yetix.baseLayersSelector;
    },
    mapZoom() {
      return Yetix.mapZoom;
    },
    zoomDelta() {
      return Yetix.ZOOM_DELTA;
    },
  },
  watch: {
    baseLayersSelector: {
      handler(layers) {
        this.baseLayers.map((layer, i) => layer.setVisible(layers[i].checked));
      },
      deep: true,
    },
  },
  created() {
    this.baseLayers = cartoLayers();

    // filter UK (remove)
    this.baseLayers = this.baseLayers.filter((layer) => {
      return layer.get('country') !== 'gb';
    });

    this.baseLayers = this.baseLayers.map((layer) => {
      // disable animation on load
      layer.getSource().tileOptions.transition = 0;

      return layer;
    });

    // On classic IGN layer, scan25 shows starting z=15
    // Here, we contruct two differents IGN layers:
    // - the classic layer (from z=0 to z=13.5)
    // - scan25 from z=13.5
    // We put them on a group, and make the switch visually

    // the zoom when the switch occurs
    const ZOOM_SWITCH = 13.5;

    this.baseLayers = this.baseLayers.map((layer) => {
      // find IGN layer
      if (layer.get('title') === 'IGN maps') {
        // get info of classic layer
        let title = layer.get('title');
        let image = layer.get('image');
        let country = layer.get('country');
        let type = layer.get('type');

        // build new layer
        const IGN_BASE_URL = 'https://data.geopf.fr/private/wmts?apikey=ign_scan_ws';
        const IGN_LAYER_SCAN25TOUR = 'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR';

        let resolutions = [];
        let matrixIds = [];
        let proj3857 = ol.proj.get('EPSG:3857');
        let maxResolution = ol.extent.getWidth(proj3857.getExtent()) / 256;

        for (let i = 0; i < 18; i++) {
          matrixIds[i] = i.toString();
          resolutions[i] = maxResolution / Math.pow(2, i);
        }

        let tileGrid = new ol.tilegrid.WMTS({
          origin: [-20037508, 20037508],
          resolutions,
          matrixIds,
        });

        let source = new ol.source.WMTS({
          url: IGN_BASE_URL,
          layer: IGN_LAYER_SCAN25TOUR,
          matrixSet: 'PM',
          format: `image/jpeg`,
          projection: 'EPSG:3857',
          tileGrid,
          style: 'normal',
          attributions: ['© <a href="//www.geoportail.fr/" target="_blank" rel="noreferrer noopener">Geoportail</a>'],
        });

        let layerScan = new ol.layer.Tile({
          source,
        });

        // set zoom visibility between layers
        layer.setVisible(true);
        layer.setMaxZoom((ZOOM_SWITCH + 0.1) / this.zoomDelta);

        layerScan.setVisible(true);
        layerScan.setMinZoom((ZOOM_SWITCH - 0.1) / this.zoomDelta);
        // allow greater zooms but limit tiles to 16
        layerScan.getSource().tileGrid.maxZoom = 16;

        // return group with the 2 two layers
        return new ol.layer.Group({
          layers: [layerScan, layer],
          title,
          image,
          country,
          type,
          visible: false,
          opacity: 1,
        });
      } else {
        // return layer
        return layer;
      }
    });

    // create layers selector
    let baseLayersSelector = this.baseLayers.map((layer) => {
      return {
        title: layer.get('title'),
        checked: layer.get('visible'),
        opacity: layer.getOpacity(),
        image: layer.get('image'),
        country: layer.get('country'),
      };
    });

    Yetix.setBaseLayersSelector(baseLayersSelector);
  },
  mounted() {
    // emit new layers
    this.$emit('layers', this.baseLayers);
  },
  render() {
    return null;
  },
};
</script>
