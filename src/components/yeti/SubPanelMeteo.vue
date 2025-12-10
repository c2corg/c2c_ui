<template>
  <div class="yeti-subpanel">
    <sub-panel-title><span v-translate>Meteo</span></sub-panel-title>
    <div v-if="hasLonLat" class="iframe-container p-1">
      <div :style="{ opacity: loading ? 0 : 1 }">
        <iframe
          :src="meteoBlueWidgetUrl"
          frameborder="0"
          scrolling="no"
          allowtransparency="true"
          sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
        ></iframe>
        <p>©meteoblue - <a :href="meteoBlueUrl" target="_blank" v-translate>More info on meteoblue.com</a></p>
      </div>
    </div>
    <div v-else>
      <p v-translate>Click on the map to get weather forecasts</p>
    </div>
  </div>
</template>

<script>
import SubPanelTitle from '@/components/yeti/SubPanelTitle.vue';
import Yetix from '@/components/yeti/Yetix';

export default {
  components: {
    SubPanelTitle,
  },
  data() {
    return {
      loading: false,
      lat: 0,
      lon: 0,
    };
  },
  computed: {
    lang() {
      let lang = this.$language.current;
      // available lang in meteoblue
      if (!['fr', 'it', 'de', 'en', 'es', 'hu'].includes(lang)) {
        lang = 'en';
      }
      return lang;
    },
    meteoBlueBaseUrl() {
      return `https://www.meteoblue.com/${this.lang}/weather`;
    },
    meteoBlueWidgetUrl() {
      let url = this.meteoBlueBaseUrl + '/widget/daily/';

      url += this.lat + 'N';
      url += this.lon + 'E';

      url += `?geoloc=fixed&days=5&tempunit=CELSIUS&windunit=KILOMETER_PER_HOUR&precipunit=MILLIMETER&coloured=coloured&pictoicon=1&maxtemperature=1&mintemperature=1&windspeed=1&windgust=0&winddirection=1&uv=0&humidity=0&precipitation=1&precipitationprobability=1&spot=0&pressure=0&layout=light`;

      return url;
    },
    meteoBlueUrl() {
      let url = this.meteoBlueBaseUrl + '/week/';

      url += this.lat + 'N';
      url += this.lon + 'E';

      return url;
    },
    hasLonLat() {
      return this.lon !== 0 && this.lat !== 0;
    },
  },
  mounted() {
    Yetix.$on('lon-lat', (evt) => {
      this.loading = true;
      this.lon = evt.lon;
      this.lat = evt.lat;
      setTimeout(() => {
        this.loading = false;
      }, 350);
    });
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables';

.iframe-container {
  background: $light;

  div {
    transition: opacity 0.35s;
  }
}
iframe {
  width: 100%;
  height: 310px;
}
</style>
