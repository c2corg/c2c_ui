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

export let state = Vue.observable(JSON.parse(JSON.stringify(defaultState)));

export let getters = {
  hasFeatures: () => !!state.features.length,
};

export let mutations = {
  setActiveTab(index) {
    state.activeTab = index;
  },
  setBra(prop, value) {
    state.bra[prop] = value;
  },
  setMethod(prop, value) {
    state.method[prop] = value;
  },
  setAreas(areas) {
    state.areas = areas;
  },
  setAreaOk(areaOk) {
    state.areaOk = areaOk;
  },
  setFeatures(features) {
    state.features = features;
  },
  setFeaturesTitle(featuresTitle) {
    state.featuresTitle = featuresTitle;
  },
  setAllMountains(mountains) {
    state.mountains.all = mountains;
  },
  setVisibleMountains(mountains) {
    state.mountains.visible = mountains;
  },
  setShowAvalancheBulletins(showAvalancheBulletins) {
    state.showAvalancheBulletins = showAvalancheBulletins;
  },
  setBulletinsLoaded(bool) {
    state.bulletinsLoaded = bool;
  },
  setMapZoom(mapZoom) {
    state.mapZoom = mapZoom;
  },
  setDefault() {
    // revert all state properties to default
    for (let i in state) {
      if (typeof state[i] === 'object' && !Array.isArray(state[i])) {
        for (let j in state[i]) {
          state[i][j] = defaultState[i][j];
        }
      } else {
        state[i] = defaultState[i];
      }
    }
  },
};

export let actions = {
  fetchApi(url) {
    return axios.get(state.API_URL + url);
  },
  fetchAreas() {
    return actions.fetchApi('yeti-extent');
  },
  fetchMountains() {
    return actions.fetchApi('zonesbra');
  },
  fetchBulletins() {
    return actions.fetchApi('bra');
  },
};

// Eventbus
// Used to communicate between components
// A can $emit('e'), B can $on('e')
export let bus = new Vue();
