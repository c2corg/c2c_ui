<script>
import { dataLayers } from '@/components/map/map-layers';
import Yetix from '@/components/yeti/Yetix';
import { getPreferences } from '@/js/vue-plugins/local-storage';

// stored under the component name, as before: existing preferences are kept
const preferences = getPreferences('Yeti');

export default {
  name: 'Yeti',
  emits: ['layers'],

  computed: {
    slopesLayersSelector() {
      return Yetix.slopesLayersSelector;
    },
  },
  watch: {
    slopesLayersSelector: {
      handler(layers) {
        layers.map((layer, index) => {
          let slopeLayer = this.slopesLayers[index];
          this.setVisible(slopeLayer, layer.checked);
          this.setLayerOpacity(slopeLayer, layer.opacity);
          this.setLayerBlendModes(slopeLayer, layer.blendModes);
        });
      },
      deep: true,
    },
  },
  created() {
    this.slopesLayers = dataLayers();

    // set our style
    this.slopesLayers = this.slopesLayers.map((layer) => {
      return this.setBlendModes(layer);
    });

    // first, get stored map layer
    let storedLayerNames = preferences.get('yeti-map-layers-slopes', []);

    let slopesLayersSelector = this.slopesLayers.map((layer) => {
      return {
        title: layer.get('title'),
        checked: storedLayerNames.includes(layer.get('title')),
        opacity: layer.getOpacity(),
        blendModes: true,
        image: layer.get('image'),
        country: layer.get('country'),
      };
    });

    Yetix.setSlopesLayersSelector(slopesLayersSelector);
  },
  mounted() {
    // emit new layers
    this.$emit('layers', this.slopesLayers);
  },
  methods: {
    setVisible(layer, visible) {
      layer.setVisible(visible);
    },
    setLayerOpacity(layer, opacity) {
      layer.setOpacity(opacity);
    },
    setLayerBlendModes(layer, isBlend) {
      layer.on('prerender', (evt) => {
        evt.context.globalCompositeOperation = isBlend ? 'multiply' : 'source-over';
      });
      // force re-render
      layer.setOpacity(layer.getOpacity() + 0.01);
    },
    setBlendModes(layer) {
      layer.setOpacity(0.9);
      layer.on('prerender', (evt) => {
        evt.context.globalCompositeOperation = 'multiply';
      });
      layer.on('postrender', (evt) => {
        evt.context.globalCompositeOperation = 'source-over';
      });
      return layer;
    },
  },
  render() {
    return null;
  },
};
</script>
