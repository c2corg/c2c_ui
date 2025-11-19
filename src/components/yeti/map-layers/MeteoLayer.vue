<script>
import layerMixin from './layer';

import Yetix from '@/components/yeti/Yetix';
import ol from '@/js/libs/ol';

/* create a faketile source, that draws transparent images, so that click are working only on layer */
class FakeTile extends ol.source.ImageTile {
  constructor() {
    super();

    const setReady = () => {
      this.setLoader((z) => {
        const [width, height] = this.getTileSize(z);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');

        context.fillStyle = 'rgba(0, 0, 0, 0.01)';
        context.fillRect(0, 0, width, height);

        return Promise.resolve(context.canvas);
      });
      this.setState('ready');
    };

    setReady();
  }
}

export default {
  mixins: [layerMixin],
  props: {
    visible: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  data() {
    return {
      lon: 0,
      lat: 0,
    };
  },
  watch: {
    visible() {
      this.updateVisibility();
    },
  },
  mounted() {
    this.layer = new ol.layer.Tile({
      name: 'meteoLayer',
      source: new FakeTile(),
    });
    this.map.addLayer(this.layer);

    this.markerLayer = new ol.layer.Vector({
      source: new ol.source.Vector(),
      style: [
        new ol.style.Style({
          image: new ol.style.Circle({
            radius: 8,
            fill: new ol.style.Fill({
              color: 'orangered',
            }),
            stroke: new ol.style.Stroke({
              color: 'rgba(0, 0, 0, 0.75)',
            }),
          }),
        }),
        new ol.style.Style({
          image: new ol.style.Circle({
            radius: 2,
            fill: new ol.style.Fill({
              color: 'white',
            }),
            stroke: new ol.style.Stroke({
              // transparent stroke so that the two circles are correctly aligned
              color: '#0000',
            }),
          }),
        }),
      ],
    });
    this.map.addLayer(this.markerLayer);

    this.updateVisibility();
  },
  methods: {
    updateVisibility() {
      this.layer.setVisible(this.visible);
      this.markerLayer.setVisible(this.visible);
    },
    onMapClick(evt) {
      let lonLat = ol.proj.toLonLat(evt.coordinate);
      this.lon = Number(lonLat[0].toFixed(5));
      this.lat = Number(lonLat[1].toFixed(5));

      let marker = new ol.Feature(new ol.geom.Point(evt.coordinate));
      this.markerLayer.getSource().clear();
      this.markerLayer.getSource().addFeature(marker);

      Yetix.$emit('lon-lat', { lon: this.lon, lat: this.lat });
    },
  },
  render() {
    return null;
  },
};
</script>
