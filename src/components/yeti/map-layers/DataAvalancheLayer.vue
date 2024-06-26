<template>
  <icon-layer :name="name" :color="color" :selector="layerSelector" @add-features="onFeatures">
    <span v-translate>Data-Avalanche</span>
    <template #overlay>
      <div class="data-avalanche-content">
        <p v-if="!isDateValid" class="is-size-7 pl-1 pb-5 has-text-left">
          <span class="has-text-primary">
            <fa-icon icon="info-circle" />
            <em>> {{ daysValid }} <span v-translate>days</span></em>
          </span>
        </p>

        <p class="is-size-7 px-1 pb-5">
          <span>
            <strong>{{ overlay.title }}</strong>
            <em>{{ overlay.localisation }}</em>
          </span>
        </p>
      </div>
      <p class="is-size-7 has-text-left px-3">
        <a :href="overlay.url" target="_blank">
          <strong>©Data-avalanche.org</strong>
          <fa-icon icon="external-link-alt" />
        </a>
      </p>
    </template>
  </icon-layer>
</template>

<script>
import IconLayer from './IconLayer.vue';
import getIconLayerMixin from './getIconLayer';

import ol from '@/js/libs/ol';

export default {
  components: {
    IconLayer,
  },
  mixins: [getIconLayerMixin],
  data() {
    return {
      name: 'dataAvalanche',
      color: 'hsl(51, 100%, 45%)',
      colorExpired: 'lightgray',
      overlay: {
        title: null,
        url: null,
        date: null,
        localisation: null,
      },
      daysValid: 180,
    };
  },
  computed: {
    layerSelector() {
      return {
        title: this.$gettext('Data-Avalanche'),
        image: 'data-avalanche.png',
        small: true,
      };
    },
    isDateValid() {
      return this.dateValid(this.overlay.date);
    },
  },
  created() {
    this.createIcon = (color = 'gray') => {
      let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26">
        <path d="M10.402 4.742a3 3 0 0 1 5.196 0l7.804 13.516a3 3 0 0 1-2.598 4.5H5.196a3 3 0 0 1-2.598-4.5z" stroke="black" stroke-width="1.25" fill="${color}" />
        <path d="m11,7.5h4l-1,9l-2,0"/>
        <circle cx="13" cy="19" r="1.5"></circle>
        </svg>`;
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    };
    this.iconSrc = this.createIcon(this.color);
    this.iconCardSrc = this.createIcon(this.color);
  },
  mounted() {
    this.features = [];
  },
  methods: {
    setOverlay(feature) {
      this.overlay.url = feature.get('link');

      let fullTitle = feature.get('title');
      let [title, text] = fullTitle.split(':').map((part) => part.trim());
      this.overlay.title = title;
      this.overlay.localisation = text;

      this.overlay.date = feature.get('date');
    },
    unsetOverlay() {
      this.overlay.title = null;
      this.overlay.url = null;
      this.overlay.date = null;
    },
    dateValid(date) {
      return (new Date() - new Date(date)) / 1000 < 60 * 60 * 24 * this.daysValid;
    },
    onFeatures(features) {
      this.features = features;
      this.updateStyle();
    },
    updateStyle() {
      // set style
      this.features.forEach((feature) => {
        let isDateValid = this.dateValid(feature.get('date'));
        let color = isDateValid ? this.color : this.colorExpired;

        let style = new ol.style.Style({
          image: new ol.style.Icon({
            src: this.createIcon(color),
            size: [26, 26],
          }),
          zIndex: isDateValid ? 1 : 0,
        });

        let hoveredStyle = style.clone();
        hoveredStyle.setZIndex(2);
        hoveredStyle.getImage().setScale(1.3);

        let selectedStyle = style.clone();

        feature.setStyle(style);
        feature.set('normalStyle', style);
        feature.set('hoveredStyle', hoveredStyle);
        feature.set('selectedStyle', selectedStyle);
      });
    },
  },
};
</script>

<style scoped>
.data-avalanche-content {
  width: 150px;
}
</style>
