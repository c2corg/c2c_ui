<template>
  <div ref="overlay" class="overlay">
    <p class="overlay-header" :style="{ background: color }">
      <slot></slot>
    </p>
    <div class="overlay-content">
      <slot name="overlay"></slot>
    </div>
    <img :src="icon('$color-text')" alt="" class="overlay-icon" />
  </div>
</template>

<script>
import layerMixin from './layer';

import Yetix from '@/components/yeti/Yetix';
import ol from '@/js/libs/ol';

export default {
  mixins: [layerMixin],
  props: {
    name: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
  },
  computed: {
    letter() {
      return this.name.charAt(0).toUpperCase();
    },
    capitalizedName() {
      return this.letter + this.name.slice(1);
    },
    dataLayer() {
      return Yetix[this.name];
    },
    showLayer() {
      return Yetix['show' + this.capitalizedName];
    },
    fetch() {
      return Yetix['fetch' + this.capitalizedName];
    },
    setState() {
      return Yetix['set' + this.capitalizedName];
    },
    mapZoom() {
      return Yetix.mapZoom;
    },
  },
  watch: {
    showLayer() {
      // on first load
      if (this.dataLayer.length === 0) {
        // set data
        this.fetch().then(this.onResult);
      }
      // then, switch visibility
      this.onShowLayer();
    },
  },
  created() {
    this.icon = (color) => {
      let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="-10 -10 20 20">
          <circle r="9" fill="${color}" stroke="white" stroke-width="1.5" />
          <text y="4" text-anchor="middle" font-family="sans-serif" font-size="10px" font-weight="bold" fill="white">${this.letter}</text>
        </svg>`;
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    };

    this.style = new ol.style.Style({
      image: new ol.style.Icon({
        src: this.icon(this.color),
        size: [26, 26],
      }),
    });

    this.overlay = new ol.Overlay({
      positioning: 'top-left',
      offset: [-4, -6],
      className: 'overlay-container',
    });
  },
  mounted() {
    this.layer = new ol.layer.Vector({
      source: new ol.source.Vector(),
      style: this.style,
    });
    this.map.addLayer(this.layer);

    this.overlay.setElement(this.$refs.overlay);
    this.map.addOverlay(this.overlay);
    this.activeFeature = false;

    // showLayer checked?
    this.layer.setVisible(this.showLayer);

    // only in first mount
    if (this.dataLayer.length === 0) {
      // events
      Yetix.$on('mapClick', this.onMapClick);
    }
  },
  methods: {
    onResult(data) {
      let features = this.getFeaturesFromData(data);
      let props = this.getPropertiesFromFeatures(features);

      // set data in state
      this.setState(props);

      // add features
      this.layer.getSource().addFeatures(features);
    },
    onShowLayer() {
      // set layer visibility
      this.layer.setVisible(this.showLayer);
      // if a feature is active (selected) and layer is visible
      // open overlay, else close
      if (this.activeFeature && this.showLayer) {
        this.openOverlay(this.activeFeature);
      } else {
        this.closeOverlay();
      }
    },
    onMapClick(e, clickedFeature) {
      this.closeOverlay(true);
      if (this.layer.getVisible()) {
        this.map.forEachFeatureAtPixel(
          e.pixel,
          (feature) => {
            if (feature !== clickedFeature) {
              return false;
            }
            this.$parent.setOverlay(feature);
            this.activeFeature = feature;
            this.openOverlay(feature);
            return true;
          },
          {
            layerFilter: (layer) => {
              return layer === this.layer;
            },
          }
        );
      }
    },
    openOverlay(feature) {
      let coordinates = feature.getGeometry().getCoordinates();
      this.overlay.setPosition(coordinates);
    },
    closeOverlay(force = false) {
      this.overlay.setPosition(undefined);

      if (force) {
        this.$parent.unsetOverlay();
        this.activeFeature = false;
      }
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables';

.overlay {
  min-width: 150px;
  max-width: 100%;
  background: $white;
  border-radius: 4px;
  box-shadow: 0 0 3px rgba($black, 0.5), 0 3px 8px rgba($black, 0.5);
  overflow: hidden;
}
.overlay-header {
  font-size: 0.9em;
  padding: 5px 0;
  text-align: center;
  color: $white;
}
.overlay-content {
  text-align: center;
  padding: 5px;
  vertical-align: 1px;
}
.overlay-content a:hover,
.overlay-content a:focus {
  text-decoration: underline;
}
.overlay-link-icon {
  margin-left: 5px;
}
.overlay-icon {
  position: absolute;
  transform: scale(1.3);
  top: -7px;
  left: -10px; /* iconSize / 2 */
  margin: auto;
  z-index: 2;
  pointer-events: none;
}
</style>
