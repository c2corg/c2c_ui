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
    <div class="ol-control opacity" v-if="isLayerLoaded">
      <div class="opacity-slider">
        <vue-slider
          v-model="opacity"
          :min="0"
          :max="1"
          :interval="0.01"
          tooltip="none"
          direction="btt"
          :rail-style="{ background: 'rgba(0,0,0,.25)' }"
          :process-style="{ background: 'white' }"
          @change="onUpdateOpacity"
        />
      </div>
    </div>
  </div>
</template>
<script>
import layerMixin from './layer';

import 'vue-slider-component/theme/default.css';

import ol from '@/js/libs/ol';

const ATTRIBUTION = 'RGE ALTI®';
const OPACITY = 0.75;

export default {
  components: {
    VueSlider: () => import(/* webpackChunkName: "slider" */ 'vue-slider-component'),
  },
  mixins: [layerMixin],
  props: {
    data: {
      type: String,
      default: null,
    },
    extent: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      isLayerLoaded: false,
      opacity: OPACITY,
      showLegend: undefined,
      mapLegend: null,
    };
  },
  watch: {
    data() {
      if (!this.data) {
        this.clearLayers();
        return;
      }
      this.drawImage();
    },
    extent() {
      this.drawExtent(this.extent);
    },
  },
  methods: {
    clearLayers() {
      this.layer.setSource(null);
      this.isLayerLoaded = false;

      this.extentLayer.getSource().clear();
    },

    drawExtent(extent) {
      // extend extent
      const extentFill = ol.extent.buffer(extent, Math.max(extent[2] - extent[0], extent[3] - extent[1]) / 10);
      // then, create a donut polygon
      const feature = new ol.Feature(new ol.geom.Polygon([this.toLinearRing(extentFill), this.toLinearRing(extent)]));
      // add feature to extentlayer
      this.extentLayer.getSource().addFeature(feature);
    },

    drawImage() {
      const xml = new DOMParser().parseFromString(this.data, 'application/xml');
      const imageBase64 = xml.getElementsByTagName('wps:ComplexData')[0].textContent;
      const imageBbox = xml.getElementsByTagName('wps:ComplexData')[1].textContent;
      const imageExtent = ol.proj.transformExtent(imageBbox.split(',').map(Number), 'EPSG:4326', 'EPSG:3857');

      this.layer.setSource(
        new ol.source.ImageStatic({
          imageLoadFunction(image) {
            image.getImage().src = 'data:image/png;base64,' + imageBase64;
          },
          attributions: ATTRIBUTION,
          imageExtent,
        })
      );
      // source is set
      this.isLayerLoaded = true;
      // set map legend
      this.setLegend(xml);
    },

    onUpdateOpacity() {
      this.layer.setOpacity(this.opacity);
    },

    setLegend(xml) {
      this.mapLegend = JSON.parse(xml.getElementsByTagName('wps:ComplexData')[2].textContent);
      this.mapLegend.items.forEach((item) => {
        item.color = `rgb(${item.color[0]}, ${item.color[1]}, ${item.color[2]})`;
      });
    },

    toLinearRing(extent) {
      const minX = extent[0];
      const minY = extent[1];
      const maxX = extent[2];
      const maxY = extent[3];
      return [
        [minX, minY],
        [minX, maxY],
        [maxX, maxY],
        [maxX, minY],
        [minX, minY],
      ];
    },
  },
  created() {
    this.layer = new ol.layer.Image({
      source: new ol.source.ImageStatic({
        url: null,
        imageExtent: ol.extent.createEmpty(),
      }),
      opacity: this.opacity,
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
  },
  mounted() {
    this.map.addLayer(this.layer);
    this.map.addLayer(this.extentLayer);
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables.scss';

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

.opacity {
  position: absolute;
  z-index: 5;
  top: 3.5rem;
  right: 1.25rem;

  .opacity-slider {
    font-size: 1.14em;
    margin: 1px;
    width: 1.375em;
    padding: 1rem 0;
    background: rgba(0, 60, 136, 0.5);
    border-radius: 2px;

    &:hover {
      background: rgba(0, 60, 136, 0.7);
    }
  }

  .vue-slider {
    padding: 0 9px !important;
    height: 300px !important;
    max-height: 30vh;
  }

  .vue-slider-process {
    background: $white;
  }

  .vue-slider-rail {
    background: $black;
  }
}

@media screen and (max-width: $tablet) {
  .legend {
    top: 0.5rem;

    .legend-content {
      margin-left: 0.5rem;
    }
  }

  .opacity {
    top: 2.75rem;
  }
}
</style>