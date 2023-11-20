<script>
import { cartoLayers } from '@/components/map/map-layers';
import Yetix from '@/components/yeti/Yetix';

export default {
  computed: {
    baseLayersSelector() {
      return Yetix.baseLayersSelector;
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
      // set maxzoom to 16 for IGN maps
      if (layer.get('title') === 'IGN maps') {
        layer.getSource().tileGrid.maxZoom = 16;
      }
      // disable animation on load
      layer.getSource().tileOptions.transition = 0;

      return layer;
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
