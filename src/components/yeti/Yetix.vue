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
import mitt from 'mitt';
import { computed, reactive } from 'vue';

import { getNamedLocalStorageItem } from '@/js/vue-plugins/local-storage';
import ol from '@/js/libs/ol';

let defaultState = {
  API_URL: 'https://api.ensg.eu/',
  BLEND_MODES_CLASS_NAME: 'areas',
  BLEND_MODES_MAX_ZOOM: 10,
  BLEND_MODES_MIN_ZOOM: 8,
  DANGER_MAX_WHEN_MRD: 3,
  VALID_MINIMUM_MAP_ZOOM: 13,
  YETI_LAYER_OPACITY: 0.9,
  /* fixed zoom by 0.5 */
  ZOOM_DELTA: 0.5,

  tabs: [],
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
  showAvalancheBulletins: false,

  winterRoutes: [],
  showWinterRoute: false,
  winterRouteLegend: null,

  showProtectedAreas: false,

  nivoses: [],
  showNivoses: false,

  romma: [],
  showRomma: false,

  flowcapt: [],
  showFlowcapt: false,

  dataAvalanche: [],
  showDataAvalanche: false,
  dataAvalancheAll: false,

  ffvl: [],
  showFfvl: false,

  mapZoom: 0,
  editMode: false,

  validSimplifyTolerance: false,
};

/**
 * Read-only reactive state
 *
 * A copy of `defaultState` without reference (to be able to reset default state)
 */
let state = reactive(JSON.parse(JSON.stringify(defaultState)));

const storage = getNamedLocalStorageItem('Yeti');

// Yetix is also used as its own map-specific event bus (Yetix.$on/$off/$emit),
// e.g. 'map-click', 'map-pointermove', 'map-moveend'.
const bus = mitt();

/**
 * Exported state
 *
 * Computed act as getters for read-only state properties Methods act as mutations (to mutate state) or actions (api
 * calls)
 */
const Yetix = reactive({
  BLEND_MODES_CLASS_NAME: computed(() => state.BLEND_MODES_CLASS_NAME),
  BLEND_MODES_MAX_ZOOM: computed(() => state.BLEND_MODES_MAX_ZOOM),
  BLEND_MODES_MIN_ZOOM: computed(() => state.BLEND_MODES_MIN_ZOOM),
  DANGER_MAX_WHEN_MRD: computed(() => state.DANGER_MAX_WHEN_MRD),
  VALID_MINIMUM_MAP_ZOOM: computed(() => state.VALID_MINIMUM_MAP_ZOOM),
  YETI_LAYER_OPACITY: computed(() => state.YETI_LAYER_OPACITY),
  ZOOM_DELTA: computed(() => state.ZOOM_DELTA),
  tabs: computed(() => state.tabs),
  activeTab: computed(() => state.activeTab),
  bra: computed(() => state.bra),
  method: computed(() => state.method),
  baseLayersSelector: computed(() => state.baseLayersSelector),
  slopesLayersSelector: computed(() => state.slopesLayersSelector),
  yetiLayersSelector: computed(() => state.yetiLayersSelector),
  showYeti: computed(() => state.showYeti),
  yetiOk: computed(() => state.yetiOk),
  yetiData: computed(() => state.yetiData),
  yetiExtent: computed(() => state.yetiExtent),
  yetiLegend: computed(() => state.yetiLegend),
  areas: computed(() => state.areas),
  areaOk: computed(() => state.areaOk),
  showAreas: computed(() => state.showAreas),
  features: computed(() => state.features),
  hasFeatures: computed(() => !!state.features.length),
  featuresTitle: computed(() => state.featuresTitle),
  featuresLength: computed(() => state.featuresLength),
  overlaysLayersSelector: computed(() => state.overlaysLayersSelector),
  mountains: computed(() => state.mountains),
  bulletinsLoaded: computed(() => state.bulletinsLoaded),
  showAvalancheBulletins: computed(() => state.showAvalancheBulletins),
  winterRoutes: computed(() => state.winterRoutes),
  hasWinterRoutes: computed(() => !!state.winterRoutes.length),
  showWinterRoute: computed(() => state.showWinterRoute),
  winterRouteLegend: computed(() => state.winterRouteLegend),
  showProtectedAreas: computed(() => state.showProtectedAreas),
  nivoses: computed(() => state.nivoses),
  showNivoses: computed(() => state.showNivoses),
  romma: computed(() => state.romma),
  showRomma: computed(() => state.showRomma),
  flowcapt: computed(() => state.flowcapt),
  showFlowcapt: computed(() => state.showFlowcapt),
  dataAvalanche: computed(() => state.dataAvalanche),
  showDataAvalanche: computed(() => state.showDataAvalanche),
  dataAvalancheAll: computed(() => state.dataAvalancheAll),
  ffvl: computed(() => state.ffvl),
  showFfvl: computed(() => state.showFfvl),
  mapZoom: computed(() => state.mapZoom),
  editMode: computed(() => state.editMode),
  validSimplifyTolerance: computed(() => state.validSimplifyTolerance),

  // event bus (former $on/$off/$emit)
  $on: bus.on,
  $emit: bus.emit,
  $off(type, handler) {
    // Vue 2's no-arg $off() removed every listener; mitt has no direct equivalent.
    if (type === undefined) {
      bus.all.clear();
    } else {
      bus.off(type, handler);
    }
  },

  // mutations
  setTabs(tabs) {
    state.tabs = tabs;
  },
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
        state.yetiLayersSelector[i] = {};
      }
    }
    state.yetiLayersSelector[index] = layer;
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

    // store features in localstorage
    let coords = features.map((feature) => {
      return feature
        .getGeometry()
        .getCoordinates()
        .map((coords) => {
          // round coords to 1 meter
          return [Math.round(coords[0]), Math.round(coords[1]), Math.round(coords[2])];
        });
    });
    storage.set('yeti-map-features', coords);
  },
  setFeaturesTitle(featuresTitle) {
    state.featuresTitle = featuresTitle;

    // store features title in localstorage
    storage.set('yeti-map-features-title', featuresTitle);
  },
  setFeaturesLength(featuresLength) {
    state.featuresLength = featuresLength;
  },
  addLayerToOverlaysLayersSelector(layer, index) {
    // to keep reactivity AND order in array
    // we need to fill array first with empty data
    for (let i = 0; i < index; i++) {
      if (!state.overlaysLayersSelector[i]) {
        state.overlaysLayersSelector[i] = {};
      }
    }
    state.overlaysLayersSelector[index] = layer;
  },
  setAllMountains(mountains) {
    state.mountains.all = mountains;
  },
  setVisibleMountains(mountains) {
    state.mountains.visible = mountains;
  },
  setShowAvalancheBulletins(showAvalancheBulletins) {
    state.showAvalancheBulletins = showAvalancheBulletins;
    this.setOverlaysToLocalStorage({ avalanche: showAvalancheBulletins });
  },
  setBulletinsLoaded(bool) {
    state.bulletinsLoaded = bool;
  },
  setWinterRoutes(routes) {
    state.winterRoutes = routes;
  },
  setShowWinterRoute(showWinterRoute) {
    state.showWinterRoute = showWinterRoute;
    this.setOverlaysToLocalStorage({ winterRoute: showWinterRoute });
  },
  setWinterRouteLegend(winterRouteLegend) {
    state.winterRouteLegend = winterRouteLegend;
  },
  setShowProtectedAreas(showProtectedAreas) {
    state.showProtectedAreas = showProtectedAreas;
    this.setOverlaysToLocalStorage({ protectedAreas: showProtectedAreas });
  },
  setNivoses(nivoses) {
    state.nivoses = nivoses;
  },
  setShowNivoses(showNivoses) {
    state.showNivoses = showNivoses;
    this.setOverlaysToLocalStorage({ nivoses: showNivoses });
  },
  setRomma(romma) {
    state.romma = romma;
  },
  setShowRomma(showRomma) {
    state.showRomma = showRomma;
    this.setOverlaysToLocalStorage({ romma: showRomma });
  },
  setFlowcapt(flowcapt) {
    state.flowcapt = flowcapt;
  },
  setShowFlowcapt(showFlowcapt) {
    state.showFlowcapt = showFlowcapt;
    this.setOverlaysToLocalStorage({ flowcapt: showFlowcapt });
  },
  setDataAvalanche(dataAvalanche) {
    state.dataAvalanche = dataAvalanche;
  },
  setShowDataAvalanche(showDataAvalanche) {
    state.showDataAvalanche = showDataAvalanche;
    this.setOverlaysToLocalStorage({ dataAvalanche: showDataAvalanche });
  },
  setDataAvalancheAll(dataAvalancheAll) {
    state.dataAvalancheAll = dataAvalancheAll;
  },
  setFfvl(ffvl) {
    state.ffvl = ffvl;
  },
  setShowFfvl(showFfvl) {
    state.showFfvl = showFfvl;
    this.setOverlaysToLocalStorage({ ffvl: showFfvl });
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
    // read localstorage and modify
    let mapOverlays = storage.get('yeti-map-layers-overlays', {
      avalanche: this.showAvalancheBulletins,
      winterRoute: this.showWinterRoute,
      protectedAreas: this.showProtectedAreas,
      dataAvalanche: this.showDataAvalanche,
      nivoses: this.showNivoses,
      romma: this.showRomma,
      flowcapt: this.showFlowcapt,
      ffvl: this.showFfvl,
    });
    this.setShowAvalancheBulletins(mapOverlays.avalanche);
    this.setShowWinterRoute(mapOverlays.winterRoute);
    this.setShowProtectedAreas(mapOverlays.protectedAreas);
    this.setShowDataAvalanche(mapOverlays.dataAvalanche);
    this.setShowNivoses(mapOverlays.nivoses);
    this.setShowRomma(mapOverlays.romma);
    this.setShowFlowcapt(mapOverlays.flowcapt);
    this.setShowFfvl(mapOverlays.ffvl);

    // features (routeLayer)
    // first, get saved features
    let savedFeatures = storage
      .get('yeti-map-features', [])
      .map((feature) => new ol.Feature(new ol.geom.LineString(feature)));
    // if data, set features/featuresTitle
    if (savedFeatures.length) {
      this.setFeatures(savedFeatures);
      let featuresTitle = storage.get('yeti-map-features-title', state.featuresTitle);
      this.setFeaturesTitle(featuresTitle);
    }
  },
  setOverlaysToLocalStorage(overlay) {
    let overlays = storage.get('yeti-map-layers-overlays', {});
    storage.set('yeti-map-layers-overlays', { ...overlays, ...overlay });
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
  fetchDataAvalanche() {
    return this.fetchApi('data-avalanche');
  },
  fetchFfvl() {
    return this.fetchApi('ffvl');
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
});

export default Yetix;
</script>
