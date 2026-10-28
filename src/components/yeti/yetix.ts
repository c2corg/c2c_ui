/*
 * Yetix
 * State management for Yeti (VueX inspired)
 *
 * - Read-only state
 * - State mutations can only occur here
 * - Actions call API
 */

import axios from 'axios';
import type Feature from 'ol/Feature';
import type Geometry from 'ol/geom/Geometry';
import type LineString from 'ol/geom/LineString';
import { markRaw, reactive } from 'vue';

import type { BulletinMountain, SelectorLayer, WinterRouteLegendItem, YetiLegend, YetiTab } from './yetix-types';

import ol from '@/js/libs/ol';
import { getPreferences } from '@/js/vue-plugins/local-storage';

type Bra = { high: number | null; low: number | null; altiThreshold: number | null; isDifferent: boolean };
type Method = {
  type: string | null;
  orientation: string[];
  potentialDanger: number | null;
  wetSnow: boolean;
  groupSize: number;
};
// the overlays shown, stored in the preferences
type Overlays = Partial<
  Record<
    'avalanche' | 'winterRoute' | 'protectedAreas' | 'dataAvalanche' | 'nivoses' | 'romma' | 'flowcapt' | 'ffvl',
    boolean
  >
>;
// the properties of the features read from the yeti API
type FeatureProperties = Record<string, unknown>;

const defaultState = () => ({
  API_URL: 'https://api.ensg.eu/',
  BLEND_MODES_CLASS_NAME: 'areas',
  BLEND_MODES_MAX_ZOOM: 10,
  BLEND_MODES_MIN_ZOOM: 8,
  DANGER_MAX_WHEN_MRD: 3,
  VALID_MINIMUM_MAP_ZOOM: 13,
  YETI_LAYER_OPACITY: 0.9,
  /* fixed zoom by 0.5 */
  ZOOM_DELTA: 0.5,

  tabs: [] as YetiTab[],
  activeTab: 0,

  bra: {
    high: null,
    low: null,
    altiThreshold: null,
    isDifferent: false,
  } as Bra,

  method: {
    type: null,
    orientation: [],
    potentialDanger: null,
    wetSnow: false,
    groupSize: 1,
  } as Method,

  // base/slopes layers
  baseLayersSelector: [] as SelectorLayer[],
  slopesLayersSelector: [] as SelectorLayer[],

  // yeti layers
  yetiLayersSelector: [] as SelectorLayer[],
  showYeti: false,
  yetiOk: false,

  yetiData: null as string | null,
  yetiExtent: [] as number[],
  yetiLegend: null as YetiLegend | null,

  areas: [] as { geometry: Geometry }[],
  areaOk: true,
  showAreas: false,

  features: [] as Feature<LineString>[],
  featuresTitle: 'New route',
  featuresLength: 0,

  // overlays selector
  overlaysLayersSelector: [] as SelectorLayer[],

  mountains: {
    // by massif, once loaded
    all: [] as Record<string, BulletinMountain[]> | [],
    visible: [] as Record<string, BulletinMountain[]> | [],
  },
  bulletinsLoaded: false,
  showAvalancheBulletins: false,

  winterRoutes: [] as Feature[],
  showWinterRoute: false,
  winterRouteLegend: null as WinterRouteLegendItem[] | null,

  showProtectedAreas: false,

  nivoses: [] as FeatureProperties[],
  showNivoses: false,

  romma: [] as FeatureProperties[],
  showRomma: false,

  flowcapt: [] as FeatureProperties[],
  showFlowcapt: false,

  dataAvalanche: [] as FeatureProperties[],
  showDataAvalanche: false,
  dataAvalancheAll: false,

  ffvl: [] as FeatureProperties[],
  showFfvl: false,

  mapZoom: 0,
  editMode: false,
  // edit mode, while a simplification is being confirmed
  tmpEditMode: false,

  validSimplifyTolerance: false,
});

type State = ReturnType<typeof defaultState>;

/** Read-only reactive state */
const state = reactive(defaultState()) as State;

// stored under the name of the former Yeti component, so that the saved route and overlays are kept
const preferences = getPreferences('Yeti');

// to keep reactivity AND order in array, fill the array with empty data first
function addLayerToSelector(selector: SelectorLayer[], layer: SelectorLayer, index: number) {
  for (let i = 0; i < index; i++) {
    if (!selector[i]) {
      selector.splice(i, 1, {} as SelectorLayer);
    }
  }
  selector.splice(index, 1, layer);
}

function setOverlaysToLocalStorage(overlay: Overlays) {
  const overlays = preferences.get('yeti-map-layers-overlays', {}) as Overlays;
  preferences.set('yeti-map-layers-overlays', { ...overlays, ...overlay });
}

function fetchApi(url: string) {
  return axios.get(state.API_URL + url);
}

/**
 * Exported state
 *
 * Getters expose the read-only state properties. Functions act as mutations (to mutate state) or actions (api calls)
 */
const Yetix = {
  // getters for the read-only state
  get BLEND_MODES_CLASS_NAME() {
    return state.BLEND_MODES_CLASS_NAME;
  },
  get BLEND_MODES_MAX_ZOOM() {
    return state.BLEND_MODES_MAX_ZOOM;
  },
  get BLEND_MODES_MIN_ZOOM() {
    return state.BLEND_MODES_MIN_ZOOM;
  },
  get DANGER_MAX_WHEN_MRD() {
    return state.DANGER_MAX_WHEN_MRD;
  },
  get VALID_MINIMUM_MAP_ZOOM() {
    return state.VALID_MINIMUM_MAP_ZOOM;
  },
  get YETI_LAYER_OPACITY() {
    return state.YETI_LAYER_OPACITY;
  },
  get ZOOM_DELTA() {
    return state.ZOOM_DELTA;
  },
  get tabs() {
    return state.tabs;
  },
  get activeTab() {
    return state.activeTab;
  },
  get bra() {
    return state.bra;
  },
  get method() {
    return state.method;
  },
  get baseLayersSelector() {
    return state.baseLayersSelector;
  },
  get slopesLayersSelector() {
    return state.slopesLayersSelector;
  },
  get yetiLayersSelector() {
    return state.yetiLayersSelector;
  },
  get showYeti() {
    return state.showYeti;
  },
  get yetiOk() {
    return state.yetiOk;
  },
  get yetiData() {
    return state.yetiData;
  },
  get yetiExtent() {
    return state.yetiExtent;
  },
  get yetiLegend() {
    return state.yetiLegend;
  },
  get areas() {
    return state.areas;
  },
  get areaOk() {
    return state.areaOk;
  },
  get showAreas() {
    return state.showAreas;
  },
  get features() {
    return state.features;
  },
  get hasFeatures() {
    return !!state.features.length;
  },
  get featuresTitle() {
    return state.featuresTitle;
  },
  get featuresLength() {
    return state.featuresLength;
  },
  get overlaysLayersSelector() {
    return state.overlaysLayersSelector;
  },
  get mountains() {
    return state.mountains;
  },
  get bulletinsLoaded() {
    return state.bulletinsLoaded;
  },
  get showAvalancheBulletins() {
    return state.showAvalancheBulletins;
  },
  get winterRoutes() {
    return state.winterRoutes;
  },
  get hasWinterRoutes() {
    return !!state.winterRoutes.length;
  },
  get showWinterRoute() {
    return state.showWinterRoute;
  },
  get winterRouteLegend() {
    return state.winterRouteLegend;
  },
  get showProtectedAreas() {
    return state.showProtectedAreas;
  },
  get nivoses() {
    return state.nivoses;
  },
  get showNivoses() {
    return state.showNivoses;
  },
  get romma() {
    return state.romma;
  },
  get showRomma() {
    return state.showRomma;
  },
  get flowcapt() {
    return state.flowcapt;
  },
  get showFlowcapt() {
    return state.showFlowcapt;
  },
  get dataAvalanche() {
    return state.dataAvalanche;
  },
  get showDataAvalanche() {
    return state.showDataAvalanche;
  },
  get dataAvalancheAll() {
    return state.dataAvalancheAll;
  },
  get ffvl() {
    return state.ffvl;
  },
  get showFfvl() {
    return state.showFfvl;
  },
  get mapZoom() {
    return state.mapZoom;
  },
  get editMode() {
    return state.editMode;
  },
  get validSimplifyTolerance() {
    return state.validSimplifyTolerance;
  },

  // mutations
  setTabs(tabs: YetiTab[]) {
    state.tabs = tabs;
  },
  setActiveTab(index: number) {
    state.activeTab = index;
  },
  // the values come from the inputs of the panels
  setBra(prop: keyof Bra, value: unknown) {
    (state.bra as Record<string, unknown>)[prop] = value;
  },
  setMethod(prop: keyof Method, value: unknown) {
    (state.method as Record<string, unknown>)[prop] = value;
  },
  setBaseLayersSelector(layers: SelectorLayer[]) {
    state.baseLayersSelector = layers;
  },
  setSlopesLayersSelector(layers: SelectorLayer[]) {
    state.slopesLayersSelector = layers;
  },
  addLayerToYetiLayersSelector(layer: SelectorLayer, index: number) {
    addLayerToSelector(state.yetiLayersSelector, layer, index);
  },
  setShowYeti(showYeti: boolean) {
    state.showYeti = showYeti;
  },
  setYetiOk(yetiOk: boolean) {
    state.yetiOk = yetiOk;
    if (yetiOk) {
      Yetix.setShowYeti(true);
    }
  },
  setYetiData(yetiData: string | null) {
    state.yetiData = yetiData;
  },
  setYetiExtent(yetiExtent: number[]) {
    state.yetiExtent = yetiExtent;
  },
  setYetiLegend(yetiLegend: State['yetiLegend']) {
    state.yetiLegend = yetiLegend;
  },
  setAreas(areas: State['areas']) {
    state.areas = areas;
  },
  setAreaOk(areaOk: boolean) {
    state.areaOk = areaOk;
  },
  setShowAreas(showAreas: boolean) {
    state.showAreas = showAreas;
  },
  setFeatures(features: Feature<LineString>[]) {
    // OpenLayers features, kept out of reactivity (as the map layers): the array is replaced, never changed in place
    state.features = markRaw(features);
    // store features in localstorage, rounded to 1 meter
    const coords = features.map((feature) =>
      feature
        .getGeometry()!
        .getCoordinates()
        .map((coord) => [Math.round(coord[0]), Math.round(coord[1]), Math.round(coord[2])])
    );
    preferences.set('yeti-map-features', coords);
  },
  setFeaturesTitle(featuresTitle: string) {
    state.featuresTitle = featuresTitle;
    // store features title in localstorage
    preferences.set('yeti-map-features-title', featuresTitle);
  },
  setFeaturesLength(featuresLength: number) {
    state.featuresLength = featuresLength;
  },
  addLayerToOverlaysLayersSelector(layer: SelectorLayer, index: number) {
    addLayerToSelector(state.overlaysLayersSelector, layer, index);
  },
  setAllMountains(mountains: Record<string, BulletinMountain[]>) {
    state.mountains.all = mountains;
  },
  setVisibleMountains(mountains: Record<string, BulletinMountain[]>) {
    state.mountains.visible = mountains;
  },
  setShowAvalancheBulletins(showAvalancheBulletins: boolean) {
    state.showAvalancheBulletins = showAvalancheBulletins;
    setOverlaysToLocalStorage({ avalanche: showAvalancheBulletins });
  },
  setBulletinsLoaded(bool: boolean) {
    state.bulletinsLoaded = bool;
  },
  setWinterRoutes(routes: Feature[]) {
    state.winterRoutes = routes;
  },
  setShowWinterRoute(showWinterRoute: boolean) {
    state.showWinterRoute = showWinterRoute;
    setOverlaysToLocalStorage({ winterRoute: showWinterRoute });
  },
  setWinterRouteLegend(winterRouteLegend: WinterRouteLegendItem[] | null) {
    state.winterRouteLegend = winterRouteLegend;
  },
  setShowProtectedAreas(showProtectedAreas: boolean) {
    state.showProtectedAreas = showProtectedAreas;
    setOverlaysToLocalStorage({ protectedAreas: showProtectedAreas });
  },
  setNivoses(nivoses: FeatureProperties[]) {
    state.nivoses = nivoses;
  },
  setShowNivoses(showNivoses: boolean) {
    state.showNivoses = showNivoses;
    setOverlaysToLocalStorage({ nivoses: showNivoses });
  },
  setRomma(romma: FeatureProperties[]) {
    state.romma = romma;
  },
  setShowRomma(showRomma: boolean) {
    state.showRomma = showRomma;
    setOverlaysToLocalStorage({ romma: showRomma });
  },
  setFlowcapt(flowcapt: FeatureProperties[]) {
    state.flowcapt = flowcapt;
  },
  setShowFlowcapt(showFlowcapt: boolean) {
    state.showFlowcapt = showFlowcapt;
    setOverlaysToLocalStorage({ flowcapt: showFlowcapt });
  },
  setDataAvalanche(dataAvalanche: FeatureProperties[]) {
    state.dataAvalanche = dataAvalanche;
  },
  setShowDataAvalanche(showDataAvalanche: boolean) {
    state.showDataAvalanche = showDataAvalanche;
    setOverlaysToLocalStorage({ dataAvalanche: showDataAvalanche });
  },
  setDataAvalancheAll(dataAvalancheAll: boolean) {
    state.dataAvalancheAll = dataAvalancheAll;
  },
  setFfvl(ffvl: FeatureProperties[]) {
    state.ffvl = ffvl;
  },
  setShowFfvl(showFfvl: boolean) {
    state.showFfvl = showFfvl;
    setOverlaysToLocalStorage({ ffvl: showFfvl });
  },
  setMapZoom(mapZoom: number) {
    state.mapZoom = mapZoom;
  },
  setEditMode(editMode: boolean) {
    state.editMode = editMode;
  },
  setValidSimplifyTolerance(validSimplifyTolerance: boolean) {
    state.validSimplifyTolerance = validSimplifyTolerance;
    // when validSimplifyTolerance is OK
    // check state for editMode:
    // if it's on, store it (tmp), and retrieve state later
    if (validSimplifyTolerance) {
      if (state.editMode) {
        state.tmpEditMode = true;
        Yetix.setEditMode(false);
      }
    } else if (state.tmpEditMode) {
      Yetix.setEditMode(true);
      state.tmpEditMode = false;
    }
  },
  setDefault() {
    // revert all state properties to default: a fresh copy, as the arrays are changed in place (it shared the
    // default arrays, and skipped the values null by default)
    Object.assign(state, defaultState());
    // read localstorage and modify
    const mapOverlays = preferences.get('yeti-map-layers-overlays', {
      avalanche: Yetix.showAvalancheBulletins,
      winterRoute: Yetix.showWinterRoute,
      protectedAreas: Yetix.showProtectedAreas,
      dataAvalanche: Yetix.showDataAvalanche,
      nivoses: Yetix.showNivoses,
      romma: Yetix.showRomma,
      flowcapt: Yetix.showFlowcapt,
      ffvl: Yetix.showFfvl,
    }) as Overlays;
    Yetix.setShowAvalancheBulletins(mapOverlays.avalanche!);
    Yetix.setShowWinterRoute(mapOverlays.winterRoute!);
    Yetix.setShowProtectedAreas(mapOverlays.protectedAreas!);
    Yetix.setShowDataAvalanche(mapOverlays.dataAvalanche!);
    Yetix.setShowNivoses(mapOverlays.nivoses!);
    Yetix.setShowRomma(mapOverlays.romma!);
    Yetix.setShowFlowcapt(mapOverlays.flowcapt!);
    Yetix.setShowFfvl(mapOverlays.ffvl!);
    // features (routeLayer)
    // first, get saved features
    const savedFeatures = (preferences.get('yeti-map-features', []) as number[][][]).map(
      (feature) => new ol.Feature(new ol.geom.LineString(feature))
    );
    // if data, set features/featuresTitle
    if (savedFeatures.length) {
      Yetix.setFeatures(savedFeatures);
      Yetix.setFeaturesTitle(preferences.get('yeti-map-features-title', state.featuresTitle) as string);
    }
  },

  // actions
  fetchAreas() {
    return fetchApi('yeti-extent');
  },
  fetchMountains() {
    return fetchApi('zonesbra');
  },
  fetchBulletins() {
    return fetchApi('bra');
  },
  fetchNivoses() {
    return fetchApi('nivoses');
  },
  fetchRomma() {
    return fetchApi('romma');
  },
  fetchFlowcapt() {
    return fetchApi('flowcapt');
  },
  fetchDataAvalanche() {
    return fetchApi('data-avalanche');
  },
  fetchFfvl() {
    return fetchApi('ffvl');
  },
  fetchWpsAlti(points: number[][], interpolate: number) {
    const params = {
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
};

export default Yetix;
