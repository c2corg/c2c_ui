<script>
import axios from 'axios';
import Vue from 'vue';

let defaultState = {
  API_URL: 'https://api.ensg.eu/',
  DANGER_MAX_WHEN_MRD: 3,
  VALID_MINIMUM_MAP_ZOOM: 13,

  activeTab: 0,

  bra: {
    high: null,
    low: null,
    altiThreshold: null,
    isDifferent: false,
  },

  method: {
    type: null,
    orientation: [],
    potentialDanger: null,
    wetSnow: false,
    groupSize: 1,
  },

  areas: [],
  areaOk: true,

  features: [],
  featuresTitle: 'New route',

  mountains: {
    all: [],
    visible: [],
  },
  bulletinsLoaded: false,
  showAvalancheBulletins: false,

  mapZoom: 0,
};

export default new Vue({
  data() {
    return JSON.parse(JSON.stringify(defaultState));
  },
  computed: {
    hasFeatures() {
      return !!this.features.length;
    },
  },
  methods: {
    setActiveTab(index) {
      this.activeTab = index;
    },
    setBra(prop, value) {
      this.bra[prop] = value;
    },
    setMethod(prop, value) {
      this.method[prop] = value;
    },
    setAreas(areas) {
      this.areas = areas;
    },
    setAreaOk(areaOk) {
      this.areaOk = areaOk;
    },
    setFeatures(features) {
      this.features = features;
    },
    setFeaturesTitle(featuresTitle) {
      this.featuresTitle = featuresTitle;
    },
    setAllMountains(mountains) {
      this.mountains.all = mountains;
    },
    setVisibleMountains(mountains) {
      this.mountains.visible = mountains;
    },
    setShowAvalancheBulletins(showAvalancheBulletins) {
      this.showAvalancheBulletins = showAvalancheBulletins;
    },
    setBulletinsLoaded(bool) {
      this.bulletinsLoaded = bool;
    },
    setMapZoom(mapZoom) {
      this.mapZoom = mapZoom;
    },
    setDefault() {
      // revert all state properties to default
      for (let i in this.$data) {
        if (typeof this.$data[i] === 'object' && !Array.isArray(this.$data[i])) {
          for (let j in this.$data[i]) {
            this.$data[i][j] = defaultState[i][j];
          }
        } else {
          this.$data[i] = defaultState[i];
        }
      }
    },
    fetchApi(url) {
      return axios.get(this.API_URL + url);
    },
    fetchAreas() {
      return this.fetchApi('yeti-extent');
    },
    fetchMountains() {
      return this.fetchApi('zonesbra');
    },
    fetchBulletins() {
      return this.fetchApi('bra');
    },
  },
});
</script>
