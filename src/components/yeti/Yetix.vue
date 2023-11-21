<script>
/*
 * Yetix
 * State management component for Yeti (VueX inspired)
 *
 * - Read-only state
 * - State mutations can only occur here
 * - Actions call API
 */

import axios from 'axios';
import Vue from 'vue';

let defaultState = {
  API_URL: 'https://api.ensg.eu/',
  BLEND_MODES_CLASS_NAME: 'areas',
  BLEND_MODES_MAX_ZOOM: 10,
  BLEND_MODES_MIN_ZOOM: 8,
  DANGER_MAX_WHEN_MRD: 3,
  VALID_MINIMUM_MAP_ZOOM: 13,
  YETI_LAYER_OPACITY: 0.9,

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

  // base/slopes layers
  baseLayersSelector: [],
  slopesLayersSelector: [],

  // yeti layers
  yetiLayersSelector: [],
  showYeti: false,
  yetiOk: false,

  yetiData: null,
  yetiExtent: [],
  yetiLegend: null,

  areas: [],
  areaOk: true,
  showAreas: false,

  features: [],
  featuresTitle: 'New route',
  featuresLength: 0,

  // overlays selector
  overlaysLayersSelector: [],

  mountains: {
    all: [],
    visible: [],
  },
  bulletinsLoaded: false,
  showAvalancheBulletins: true,

  showWinterRoute: false,
  winterRouteLegend: null,

  nivoses: [],
  showNivoses: false,

  romma: [],
  showRomma: false,

  flowcapt: [],
  showFlowcapt: false,

  mapZoom: 0,
  editMode: false,

  validSimplifyTolerance: false,
};

/**
 * Read-only reactive state
 *
 * A copy of `defaultState` without reference (to be able to reset default state)
 */
let state = Vue.observable(JSON.parse(JSON.stringify(defaultState)));

/**
 * Exported state
 *
 * Computed act as getters for read-only state properties Methods act as mutations (to mutate state) or actions (api
 * calls)
 */
export default new Vue({
  computed: {
    BLEND_MODES_CLASS_NAME() {
      return state.BLEND_MODES_CLASS_NAME;
    },
    BLEND_MODES_MAX_ZOOM() {
      return state.BLEND_MODES_MAX_ZOOM;
    },
    BLEND_MODES_MIN_ZOOM() {
      return state.BLEND_MODES_MIN_ZOOM;
    },
    DANGER_MAX_WHEN_MRD() {
      return state.DANGER_MAX_WHEN_MRD;
    },
    VALID_MINIMUM_MAP_ZOOM() {
      return state.VALID_MINIMUM_MAP_ZOOM;
    },
    YETI_LAYER_OPACITY() {
      return state.YETI_LAYER_OPACITY;
    },
    activeTab() {
      return state.activeTab;
    },
    bra() {
      return state.bra;
    },
    method() {
      return state.method;
    },
    baseLayersSelector() {
      return state.baseLayersSelector;
    },
    slopesLayersSelector() {
      return state.slopesLayersSelector;
    },
    yetiLayersSelector() {
      return state.yetiLayersSelector;
    },
    showYeti() {
      return state.showYeti;
    },
    yetiOk() {
      return state.yetiOk;
    },
    yetiData() {
      return state.yetiData;
    },
    yetiExtent() {
      return state.yetiExtent;
    },
    yetiLegend() {
      return state.yetiLegend;
    },
    areas() {
      return state.areas;
    },
    areaOk() {
      return state.areaOk;
    },
    showAreas() {
      return state.showAreas;
    },
    features() {
      return state.features;
    },
    hasFeatures() {
      return !!state.features.length;
    },
    featuresTitle() {
      return state.featuresTitle;
    },
    featuresLength() {
      return state.featuresLength;
    },
    overlaysLayersSelector() {
      return state.overlaysLayersSelector;
    },
    mountains() {
      return state.mountains;
    },
    bulletinsLoaded() {
      return state.bulletinsLoaded;
    },
    showAvalancheBulletins() {
      return state.showAvalancheBulletins;
    },
    showWinterRoute() {
      return state.showWinterRoute;
    },
    winterRouteLegend() {
      return state.winterRouteLegend;
    },
    nivoses() {
      return state.nivoses;
    },
    showNivoses() {
      return state.showNivoses;
    },
    romma() {
      return state.romma;
    },
    showRomma() {
      return state.showRomma;
    },
    flowcapt() {
      return state.flowcapt;
    },
    showFlowcapt() {
      return state.showFlowcapt;
    },
    mapZoom() {
      return state.mapZoom;
    },
    editMode() {
      return state.editMode;
    },
    validSimplifyTolerance() {
      return state.validSimplifyTolerance;
    },
  },
  methods: {
    // mutations
    setActiveTab(index) {
      state.activeTab = index;
    },
    setBra(prop, value) {
      state.bra[prop] = value;
    },
    setMethod(prop, value) {
      state.method[prop] = value;
    },
    setBaseLayersSelector(layers) {
      state.baseLayersSelector = layers;
    },
    setSlopesLayersSelector(layers) {
      state.slopesLayersSelector = layers;
    },
    addLayerToYetiLayersSelector(layer, index) {
      // to keep reactivity AND order in array
      // we need to fill array first with empty data
      for (let i = 0; i < index; i++) {
        if (!state.yetiLayersSelector[i]) {
          this.$set(state.yetiLayersSelector, i, {});
        }
      }
      this.$set(state.yetiLayersSelector, index, layer);
    },
    setShowYeti(showYeti) {
      state.showYeti = showYeti;
    },
    setYetiOk(yetiOk) {
      state.yetiOk = yetiOk;
      if (yetiOk) {
        this.setShowYeti(true);
      }
    },
    setYetiData(yetiData) {
      state.yetiData = yetiData;
    },
    setYetiExtent(yetiExtent) {
      state.yetiExtent = yetiExtent;
    },
    setYetiLegend(yetiLegend) {
      state.yetiLegend = yetiLegend;
    },
    setAreas(areas) {
      state.areas = areas;
    },
    setAreaOk(areaOk) {
      state.areaOk = areaOk;
    },
    setShowAreas(showAreas) {
      state.showAreas = showAreas;
    },
    setFeatures(features) {
      state.features = features;
    },
    setFeaturesTitle(featuresTitle) {
      state.featuresTitle = featuresTitle;
    },
    setFeaturesLength(featuresLength) {
      state.featuresLength = featuresLength;
    },
    addLayerToOverlaysLayersSelector(layer, index) {
      // to keep reactivity AND order in array
      // we need to fill array first with empty data
      for (let i = 0; i < index; i++) {
        if (!state.overlaysLayersSelector[i]) {
          this.$set(state.overlaysLayersSelector, i, {});
        }
      }
      this.$set(state.overlaysLayersSelector, index, layer);
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
    setShowWinterRoute(showWinterRoute) {
      state.showWinterRoute = showWinterRoute;
    },
    setWinterRouteLegend(winterRouteLegend) {
      state.winterRouteLegend = winterRouteLegend;
    },
    setNivoses(nivoses) {
      state.nivoses = nivoses;
    },
    setShowNivoses(showNivoses) {
      state.showNivoses = showNivoses;
    },
    setRomma(romma) {
      state.romma = romma;
    },
    setShowRomma(showRomma) {
      state.showRomma = showRomma;
    },
    setFlowcapt(flowcapt) {
      state.flowcapt = flowcapt;
    },
    setShowFlowcapt(showFlowcapt) {
      state.showFlowcapt = showFlowcapt;
    },
    setMapZoom(mapZoom) {
      state.mapZoom = mapZoom;
    },
    setEditMode(editMode) {
      state.editMode = editMode;
    },
    setValidSimplifyTolerance(validSimplifyTolerance) {
      state.validSimplifyTolerance = validSimplifyTolerance;
      // when validSimplifyTolerance is OK
      // check state for editMode:
      // if it's on, store it (tmp), and retrieve state later
      if (validSimplifyTolerance) {
        if (state.editMode) {
          state.tmpEditMode = true;
          this.setEditMode(false);
        }
      } else {
        if (state.tmpEditMode) {
          this.setEditMode(true);
          delete state.tmpEditMode;
        }
      }
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
    // actions
    fetchApi(url) {
      return axios.get(state.API_URL + url);
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
    fetchNivoses() {
      return this.fetchApi('nivoses');
    },
    fetchRomma() {
      return this.fetchApi('romma');
    },
    fetchFlowcapt() {
      return this.fetchApi('flowcapt');
    },
    fetchWpsAlti(points, interpolate) {
      let params = {
        identifier: 'alti',
        operation: 'execute',
        inputs: {
          points,
          datum: 'EPSG:4326',
          interpolate,
        },
      };
      return axios.post(state.API_URL + 'yeti-wps-json', params);
    },
  },
});
</script>
