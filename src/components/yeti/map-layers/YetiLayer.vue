<template>
  <div>
    <div class="legend">
      <div>
        <div class="legend-button is-pulled-right ol-control">
          <button type="button" @click="showLegend = !showLegend">
            <span v-translate>Legend</span>
          </button>
        </div>
      </div>
      <div class="legend-content" v-show="showLegend === true">
        <p class="is-italic" v-if="!mapLegend" v-translate>Legend will appear automatically with the generated image</p>
        <div v-else>
          <ul>
            <li v-for="(item, i) of mapLegend.items" :key="i">
              <span class="legend-color" :style="'background:' + item.color" />
              <!-- $gettext('Risky slopes') -->
              <!-- $gettext('Risky slopes, increased risk due to orientation') -->
              <!-- $gettext('Residual risk >1') -->
              <!-- $gettext('Residual risk >1.3') -->
              <!-- $gettext('Residual risk >1.5') -->
              <span>{{ $gettext(item.text['en']) }}</span>
            </li>
          </ul>
          <!-- $gettext('From danger 3, consider the slopes which dominate the route') -->
          <p class="is-size-6 is-italic">{{ $gettext(mapLegend.comment['en']) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import layerMixin from './layer';
import layerSelectorWatcherMixin from './layer-selector-watcher';

import Yetix from '@/components/yeti/Yetix';
import ol from '@/js/libs/ol';

export default {
  mixins: [layerMixin, layerSelectorWatcherMixin],
  data() {
    return {
      showLegend: undefined,
      mapLegend: null,
    };
  },
  computed: {
    yetiData() {
      return Yetix.yetiData;
    },
    yetiExtent() {
      return Yetix.yetiExtent;
    },
    showAreas() {
      return Yetix.showAreas;
    },
    showYeti() {
      return Yetix.showYeti;
    },
    yetiOk() {
      return Yetix.yetiOk;
    },
    layerSelector() {
      return {
        title: this.$gettext('Risk'),
        checked: this.showYeti,
        action: this.onShowYeti,
        disabled: {
          condition: !this.yetiOk,
          title: this.$gettext('No risk to show yet'),
          message: this.$gettext('Compute one for a specific zone from the “Risk” tab'),
        },
        image: 'yeti-risk.jpg',
        opacity: Yetix.YETI_LAYER_OPACITY,
        blendModes: true,
      };
    },
    yetiLayersSelector() {
      return Yetix.yetiLayersSelector;
    },
  },
  watch: {
    yetiData() {
      if (!this.yetiData) {
        this.clearLayers();
        return;
      }
      this.drawImage();
    },
    yetiExtent() {
      this.drawExtent(this.yetiExtent);
    },
    showAreas() {
      // switch classname when showareas updates
      this.setLayerClassName();
    },
    showYeti() {
      this.layer.setVisible(this.showYeti);
      this.extentLayer.setVisible(this.showYeti);
    },
    yetiLayersSelector: {
      handler(layers) {
        this.setLayerOpacity(layers[0].opacity);
        this.setLayerBlendModes(layers[0].blendModes);
      },
      deep: true,
    },
  },
  created() {
    this.layer = new ol.layer.Image({
      source: new ol.source.ImageStatic({
        url: null,
        imageExtent: ol.extent.createEmpty(),
      }),
      opacity: Yetix.YETI_LAYER_OPACITY,
    });
    this.extentLayer = new ol.layer.Vector({
      source: new ol.source.Vector(),
      style: [
        new ol.style.Style({
          fill: new ol.style.Fill({
            color: 'hsla(30, 100%, 60%, .45)',
          }),
        }),
        new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: 'hsla(30, 100%, 40%, 1)',
            width: 2,
          }),
          geometry: (feature) => {
            return new ol.geom.Polygon([feature.getGeometry().getCoordinates()[1]]);
          },
        }),
      ],
    });
    // blend modes multiply for yeti layer
    this.layer.on('prerender', (evt) => {
      evt.context.globalCompositeOperation = 'multiply';
    });
    this.layer.on('postrender', (evt) => {
      evt.context.globalCompositeOperation = 'source-over';
    });
  },
  mounted() {
    this.map.addLayer(this.layer);
    this.map.addLayer(this.extentLayer);

    this.setLayerClassName();

    this.$emit('layer', this.layerSelector);
  },
  methods: {
    onShowYeti() {
      Yetix.setShowYeti(!this.showYeti);
    },
    clearLayers() {
      this.layer.setSource(null);

      this.extentLayer.getSource().clear();
    },
    drawExtent(extent) {
      // extend extent
      let extentFill = ol.extent.buffer(extent, Math.max(extent[2] - extent[0], extent[3] - extent[1]) / 10);
      // then, create a donut polygon
      let feature = new ol.Feature(new ol.geom.Polygon([this.toLinearRing(extentFill), this.toLinearRing(extent)]));
      // add feature to extentlayer
      this.extentLayer.getSource().addFeature(feature);
    },
    drawImage() {
      let xml = new DOMParser().parseFromString(this.yetiData, 'application/xml');
      let imageBase64 = xml.getElementsByTagName('wps:ComplexData')[0].textContent;
      let imageBbox = xml.getElementsByTagName('wps:ComplexData')[1].textContent;
      let imageExtent = ol.proj.transformExtent(imageBbox.split(',').map(Number), 'EPSG:4326', 'EPSG:3857');

      this.layer.setSource(
        new ol.source.ImageStatic({
          imageLoadFunction(image) {
            image.getImage().src = 'data:image/png;base64,' + imageBase64;
          },
          imageExtent,
        })
      );
      // source is set
      Yetix.setYetiOk(true);
      // set map legend
      this.setLegend(xml);
    },
    setLegend(xml) {
      this.mapLegend = JSON.parse(xml.getElementsByTagName('wps:ComplexData')[2].textContent);
      this.mapLegend.items.forEach((item) => {
        item.color = `rgb(${item.color[0]}, ${item.color[1]}, ${item.color[2]})`;
      });
      // add attribution (each attribution on its own line)
      this.layer.getSource().setAttributions(this.mapLegend.attributions);
    },
    toLinearRing(extent) {
      let minX = extent[0];
      let minY = extent[1];
      let maxX = extent[2];
      let maxY = extent[3];
      return [
        [minX, minY],
        [minX, maxY],
        [maxX, maxY],
        [maxX, minY],
        [minX, minY],
      ];
    },
    setLayerClassName() {
      // it switches classname based on showareas visibility
      // use same name as areas if showareas, so blend modes will apply to this layer
      // or use default ol-layer to apply blend modes to whole layers
      this.layer.className_ = this.showAreas ? Yetix.BLEND_MODES_CLASS_NAME : 'ol-layer';
    },
    setLayerOpacity(opacity) {
      this.layer.setOpacity(opacity);
    },
    setLayerBlendModes(isBlend) {
      this.layer.on('prerender', (evt) => {
        evt.context.globalCompositeOperation = isBlend ? 'multiply' : 'source-over';
      });
      // force re-render
      this.layer.setOpacity(this.layer.getOpacity() + 0.01);
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables';

.legend {
  position: absolute;
  z-index: 6;
  top: 1.25rem;
  right: 1.25rem;

  .legend-button {
    position: static;

    button {
      width: auto;
      padding: 0 0.5em;
    }
  }

  .legend-content {
    margin-top: 0.5rem;
    margin-left: 1.25rem;
    border-radius: 2px;
    border: 1px solid lightgray;
    padding: 0.5rem;
    background: white;
    clear: both;
  }

  .legend-color {
    vertical-align: bottom;
    display: inline-block;
    width: 21px;
    height: 21px;
    margin-right: 5px;
  }
}

@media screen and (max-width: $tablet) {
  .legend {
    top: 0.5rem;

    .legend-content {
      margin-left: 0.5rem;
    }
  }
}
</style>
