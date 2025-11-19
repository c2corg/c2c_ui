<template>
  <icon-layer :name="name" :color="color" :selector="layerSelector" @add-features="onFeatures">
    <span v-translate>Data-Avalanche</span>
    <template #overlay>
      <div class="data-avalanche-content">
        <p class="is-size-7 px-1 py-1">
          <span>
            <strong>{{ overlay.title }} ({{ differenceDays(overlay.date) }} <span v-translate>days</span>)</strong>
          </span>
        </p>
        <p class="is-size-7 is-italic">
          <a :href="overlay.url" target="_blank">
            {{ overlay.localisation }}
            <fa-icon icon="external-link-alt" />
          </a>
        </p>
      </div>
      <p class="footer is-size-7 has-text-left px-3 py-1">
        <a href="https://data-avalanche.org" target="_blank">
          <strong>©data-avalanche.org</strong>
        </a>
      </p>
    </template>
  </icon-layer>
</template>

<script>
import IconLayer from './IconLayer.vue';
import getIconLayerMixin from './getIconLayer';

import Yetix from '@/components/yeti/Yetix';
import DataAvalancheLayerContent from '@/components/yeti/map-layers/DataAvalancheLayerContent';
import DataAvalancheLayerContentTitle from '@/components/yeti/map-layers/DataAvalancheLayerContentTitle';
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
      colorWeeks: 'hsl(31, 100%, 45%)',
      colorSeason: 'hsl(51, 100%, 45%)',
      colorExpired: 'lightgray',
      overlay: {
        title: null,
        url: null,
        date: null,
        localisation: null,
      },
      daysValidWeeks: 5,
      daysValidSeason: 190,
    };
  },
  computed: {
    layerSelector() {
      return {
        title: this.$gettext('Data-Avalanche'),
        image: 'data-avalanche.png',
        small: true,
        contentComponent: DataAvalancheLayerContent,
        contentTitleComponent: DataAvalancheLayerContentTitle,
      };
    },
    dataAvalancheAll() {
      return Yetix.dataAvalancheAll;
    },
  },
  watch: {
    dataAvalancheAll() {
      this.updateStyle();
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
    dateValid(date, days) {
      return (new Date() - new Date(date)) / 1000 < 60 * 60 * 24 * days;
    },
    differenceDays(date) {
      return Math.round((new Date() - new Date(date)) / 1000 / 60 / 60 / 24);
    },
    onFeatures(features) {
      this.features = features;
      this.updateStyle();
    },
    updateStyle() {
      // set style
      this.features.forEach((feature) => {
        let isDateValidWeeks = this.dateValid(feature.get('date'), this.daysValidWeeks);
        let isDateValidSeason = this.dateValid(feature.get('date'), this.daysValidSeason);
        let color = isDateValidWeeks ? this.colorWeeks : isDateValidSeason ? this.colorSeason : this.colorExpired;

        let style = new ol.style.Style({
          image: new ol.style.Icon({
            src: this.createIcon(color),
            // based on dataAvalancheAll, size is 0,0, so icons are not visible
            size: isDateValidSeason || this.dataAvalancheAll ? [26, 26] : [0, 0],
          }),
          zIndex: isDateValidSeason ? 1 : 0,
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

<style scoped lang="scss">
@import '@/assets/sass/variables';

.footer {
  background: $grey-lighter;
  margin: 10px -5px -5px;
}
.data-avalanche-content {
  width: 150px;
}
</style>
