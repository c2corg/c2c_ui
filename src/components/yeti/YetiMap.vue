<template>
  <div class="column map-container">
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
    <div class="ol-control opacity" v-if="yetiLayerLoaded">
      <div class="opacity-slider">
        <vue-slider
          v-model="opacityYetiLayer"
          :min="0"
          :max="1"
          :interval="0.01"
          tooltip="none"
          direction="btt"
          :rail-style="{ background: 'rgba(0,0,0,.25)' }"
          :process-style="{ background: 'white' }"
          @change="onUpdateOpacityYetiLayer"
        />
      </div>
    </div>
    <div style="width: 100%; height: 100%">
      <div ref="map" style="width: 100%; height: 100%" @click="showLayerSwitcher = false" />
      <div
        ref="layerSwitcherButton"
        class="ol-control ol-control-layer-switcher-button"
        :title="$gettext('Layers', 'Map controls')"
      >
        <button @click.stop="showLayerSwitcher = !showLayerSwitcher">
          <fa-icon icon="layer-group" />
        </button>
      </div>

      <div v-show="showLayerSwitcher" ref="layerSwitcher" class="ol-control ol-control-layer-switcher" @click.stop="">
        <div>
          <header v-translate>Base layer</header>
          <div v-for="layer of cartoLayers" :key="layer.get('title')" @click="visibleCartoLayer = layer">
            <input :checked="layer == visibleCartoLayer" type="radio" />
            {{ $gettext(layer.get('title'), 'Map layer') }}
          </div>
        </div>
        <div>
          <header v-translate>Slopes</header>
          <div v-for="layer of dataLayers" :key="layer.get('title')" @click="toggleMapDataLayer(layer)">
            <input :checked="layer.getVisible()" type="checkbox" />
            {{ $gettext(layer.get('title'), 'Map slopes layer') }}
          </div>
        </div>
      </div>

      <div
        ref="recenterOnControl"
        class="ol-control ol-control-recenter-on"
      >
        <input type="text" :placeholder="$gettext('Recenter on...')" @input="searchRecenterPropositions" />
      </div>

      <div
        v-show="showRecenterOnPropositions"
        ref="recenterOnPropositions"
        class="ol-control ol-control-recenter-on-propositions"
      >
        <ul v-if="recenterPropositions && recenterPropositions.data && recenterPropositions.data.features">
          <li v-for="(item, i) of recenterPropositions.data.features" :key="i" @click="recenterOn(item)">
            {{ item.properties.name }},
            <small>{{ item.properties.state }}, {{ item.properties.country }}</small>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import 'vue-slider-component/theme/default.css';

import { cartoLayers, dataLayers } from '../map/map-layers';

import c2c from '@/js/apis/c2c';
import photon from '@/js/apis/photon';
import ol from '@/js/libs/ol';

const DEFAULT_CENTER = [6.25, 45.15];
const DEFAULT_ZOOM = 6;
const MAX_ZOOM = 19;

const YETI_ATTRIBUTION = 'RGE ALTI®';
const YETI_LAYER_OPACITY = 0.75;
const YETI_URL_MOUNTAINS = '/mountains_WGS84.json';
const YETI_URL_AREAS = 'https://api.ensg.eu/yeti-extent';

const normalLineStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: 'yellow',
    width: 3,
  }),
});

const highlightedLineStyle = [
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'rgba(255, 255, 0, .5)',
      width: 8,
    }),
    zIndex: 1,
  }),
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'red',
      width: 3,
    }),
    zIndex: 1,
  }),
];

export default {
  components: { VueSlider: () => import(/* webpackChunkName: "slider" */ 'vue-slider-component') },
  props: {
    activeTab: {
      type: Number,
      required: true,
    },
    validMinZoom: {
      type: Number,
      required: true,
    },
    mapZoom: {
      type: Number,
      required: true,
    },
    computedExtent: {
      type: Array,
      required: true,
    },
    computedData: {
      type: String,
      default: null,
    },
    mountains: {
      type: Object,
      required: true,
    },
    areaOk: {
      type: Boolean,
      required: true,
    },
    features: {
      type: Array,
      required: true,
    },
    gpx: {
      type: String,
      default: null,
    },
    featuresTitle: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      cartoLayers: cartoLayers(),
      dataLayers: dataLayers(),

      showLayerSwitcher: false,
      recenterPropositions: null,
      showRecenterOnPropositions: false,

      featuresTitleFromSource: null,
      promiseDocument: null,

      yetiLayerLoaded: false,
      showLegend: undefined,
      mapLegend: null,
      opacityYetiLayer: YETI_LAYER_OPACITY,

      areas: [],
    };
  },
  computed: {
    visibleCartoLayer: {
      get() {
        return this.cartoLayers.find((layer) => layer.getVisible() === true);
      },
      set(layer) {
        this.visibleCartoLayer.setVisible(false);
        layer.setVisible(true);
      },
    },
    localFeaturesTitle() {
      if (this.featuresTitleFromSource) {
        return this.featuresTitleFromSource;
      }
      if (this.features.length) {
        return this.featuresTitle;
      }
      return null;
    },
    areasLayerStyle() {
      const levelStrokeWidth = 2;
      const levelStrokeOpacity = 4;
      const lineWidthStroke = Math.max(0, Math.min(this.mapZoom - 6, levelStrokeWidth));
      const opacityStroke = Math.max(0, Math.min(this.mapZoom - 6, levelStrokeOpacity)) / 4;
      const lineDashStroke = opacityStroke * 6;

      return new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'hsla(30, 100%, 40%,' + opacityStroke + ')',
          width: lineWidthStroke,
          lineDash: [lineDashStroke],
        }),
      });
    },
  },
  watch: {
    gpx() {
      if (this.gpx) {
        this.addFeaturesFromGpx(this.gpx);
      }
    },
    localFeaturesTitle() {
      this.$emit('update:featuresTitle', this.localFeaturesTitle);
    },
    activeTab() {
      if (this.activeTab === 0) {
        this.drawInteraction.setActive(false);
        this.modifyInteraction.setActive(false);
        this.snapInteraction.setActive(false);
      } else {
        this.drawInteraction.setActive(true);
        this.modifyInteraction.setActive(true);
        this.snapInteraction.setActive(true);
      }
    },
    computedData() {
      this.drawYetiImage();
    },
    computedExtent() {
      this.drawExtent(this.computedExtent);
    },
  },
  mounted() {
    // map
    this.map = new ol.Map({
      target: this.$refs.map,

      controls: [
        new ol.control.Zoom({
          zoomInTipLabel: this.$gettext('Zoom in', 'Map controls'),
          zoomOutTipLabel: this.$gettext('Zoom out', 'Map controls'),
        }),
        new ol.control.FullScreen({ source: this.$el, tipLabel: this.$gettext('Toggle full-screen', 'Map Controls') }),
        new ol.control.ScaleLine(),
        new ol.control.Control({ element: this.$refs.layerSwitcherButton }),
        new ol.control.Control({ element: this.$refs.layerSwitcher }),
        new ol.control.Control({ element: this.$refs.recenterOnControl }),
        new ol.control.Control({ element: this.$refs.recenterOnPropositions }),
        new ol.control.Attribution({ tipLabel: this.$gettext('Attributions', 'Map controls') }),
      ],

      layers: [
        // c2c layers
        ...this.cartoLayers,
        ...this.dataLayers,
      ],

      view: new ol.View({
        center: ol.proj.transform(DEFAULT_CENTER, 'EPSG:4326', 'EPSG:3857'),
        zoom: DEFAULT_ZOOM,
        maxZoom: MAX_ZOOM,
      }),
    });
    // New layers
    // yeti layer
    this.yetiLayer = new ol.layer.Image({
      source: new ol.source.ImageStatic({
        url: null,
        imageExtent: ol.extent.createEmpty(),
      }),
      opacity: this.opacityYetiLayer,
    });
    // extent layer
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
    // areas layer
    this.areasLayer = new ol.layer.Vector({
      renderMode: 'image',
      source: new ol.source.Vector(),
      style: this.areasLayerStyle,
    });
    // features layer
    this.featuresLayer = new ol.layer.Vector({
      source: new ol.source.Vector(),
      style: normalLineStyle,
    });
    this.featuresLayerSource = this.featuresLayer.getSource();

    //this.map = this.$refs.map.map;
    this.view = this.map.getView();

    // add layers to map
    this.map.addLayer(this.areasLayer);
    this.map.addLayer(this.yetiLayer);
    this.map.addLayer(this.extentLayer);
    this.map.addLayer(this.featuresLayer);

    // load camptocamp document
    const doc = this.$route.params.document_id;
    const lang = this.$language.current;
    if (doc) {
      c2c['route'].getCooked(doc, lang).then(this.addFeaturesFromDocument);
    }

    // add events
    this.addEvents();
    // add interactions
    this.addInteractions();

    // set mountains
    axios.get(YETI_URL_MOUNTAINS).then(this.onMountainsResult);

    // set areas (yeti valid areas)
    axios.get(YETI_URL_AREAS).then(this.onAreasResult);
  },
  methods: {
    getExtent(projection) {
      let extent = this.view.calculateExtent(this.map.getSize() || null);
      if (projection) {
        extent = ol.proj.transformExtent(extent, ol.proj.get('EPSG:3857'), ol.proj.get(projection));
      }
      return extent;
    },

    toggleMapDataLayer(layer) {
      layer.setVisible(!layer.getVisible());
    },

    searchRecenterPropositions(event) {
      const query = event.target.value;

      if (query && query.length >= 3) {
        const center = this.view.getCenter();
        const centerWgs84 = ol.proj.toLonLat(center);

        this.recenterPropositions = photon.getPropositions(query, this.$language.current, centerWgs84);
        this.showRecenterOnPropositions = true;
      }
    },

    recenterOn(item) {
      const feature = new ol.format.GeoJSON().readFeature(item);
      let extent = feature.get('extent');
      let coordinates = feature.getGeometry().flatCoordinates;

      if (extent) {
        extent = ol.proj.transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
        this.view.fit(extent, { size: this.map.getSize(), maxZoom: 12 });
      } else {
        coordinates = ol.proj.transform(coordinates, 'EPSG:4326', 'EPSG:3857');
        this.view.setCenter(coordinates);
        this.view.setZoom(16);
      }

      this.showRecenterOnPropositions = false;
    },

    clearLayers() {
      this.yetiLayer.setSource(null);
      this.yetiLayerLoaded = false;

      this.extentLayer.getSource().clear();
    },

    addEvents() {
      // global events
      this.map.on('moveend', this.onMapMoveEnd);
      // features events (added feature)
      this.featuresLayerSource.on('addfeature', this.onFeature);
    },

    addInteractions() {
      const source = this.featuresLayerSource;

      this.modifyInteraction = new ol.interaction.Modify({ source });
      this.map.addInteraction(this.modifyInteraction);

      this.drawInteraction = new ol.interaction.Draw({
        source,
        type: 'LineString',
      });
      this.map.addInteraction(this.drawInteraction);

      this.snapInteraction = new ol.interaction.Snap({ source });
      this.map.addInteraction(this.snapInteraction);

      this.drawInteraction.on('drawstart', this.onDrawStart);
      this.drawInteraction.on('drawend', this.onDrawEnd);
      this.modifyInteraction.on('modifyend', this.onModifyEnd);

      this.drawInteraction.setActive(false);
      this.modifyInteraction.setActive(false);
      this.snapInteraction.setActive(false);
    },

    onMapMoveEnd(event) {
      const mapZoom = Math.floor(event.map.getView().getZoom() * 10) / 10;
      this.$emit('update:mapZoom', mapZoom);

      // set visible mountains
      this.setVisibleMountains();

      // is area OK ?
      this.isAreaOK();
      // update areas layer style
      this.areasLayer.setStyle(this.areasLayerStyle);
    },

    fitMapToFeatures() {
      let extent = ol.extent.createEmpty();

      ol.extent.extend(extent, this.featuresLayerSource.getExtent());

      this.view.fit(extent, { size: this.map.getSize() });

      // set a minimum zoom level
      this.view.setZoom(Math.max(this.validMinZoom, this.view.getZoom()));
    },

    addFeaturesFromGpx(gpx) {
      // first, remove camptocamp document
      this.promiseDocument = null;
      // and clear geometry
      this.featuresLayerSource.clear(true);

      // before reading gpx, set what we are doing
      this.loadingExternalFeatures = true;

      const gpxFormat = new ol.format.GPX();
      const features = gpxFormat.readFeatures(gpx, { featureProjection: 'EPSG:3857' });
      features.map(this.addFeature);
      this.featuresTitleFromSource = this.getFeaturesTitleFromGpx(features);

      // gpx is loaded, go back to normal case
      this.loadingExternalFeatures = false;
      // and emit new features
      this.emitFeaturesEvent();
      // fit map to new features
      this.fitMapToFeatures();
    },

    addFeaturesFromDocument(doc) {
      // before reading document, set what we are doing
      this.loadingExternalFeatures = true;

      const documentGeometry = doc.data.geometry.geom_detail;
      const feature = new ol.format.GeoJSON().readFeature(documentGeometry);
      this.addFeature(feature);
      this.featuresTitleFromSource = this.getFeaturesTitleFromDocument(doc);

      // document is loaded, go back to normal case
      this.loadingExternalFeatures = false;
      // and emit new features
      this.emitFeaturesEvent();
      // fit map to new features
      this.fitMapToFeatures();
    },

    addFeature(feature) {
      // split multilinestrings into linestrings
      if (feature.getGeometry().getType() === 'MultiLineString') {
        const lines = feature.getGeometry().getLineStrings();
        lines.map((line) => new ol.Feature({ geometry: line })).map(this.addFeature);
      } else {
        const nbPointsOnFeature = feature.getGeometry().getCoordinates().length;
        if (nbPointsOnFeature >= 2) {
          this.featuresLayerSource.addFeature(feature);
        }
      }
    },

    removeFeature(feature) {
      // remove feature
      // when only one left, ask for user to confirm
      let toBeRemoved = !(
        this.featuresLayerSource.getFeatures().length === 1 && !confirm(this.$gettext('Confirm delete'))
      );
      if (toBeRemoved) {
        this.featuresLayerSource.removeFeature(feature);
        this.emitFeaturesEvent();
      }
    },

    removeFeatures() {
      if (confirm(this.$gettext('Confirm delete'))) {
        this.featuresLayerSource.clear(true);
        this.emitFeaturesEvent();
      }
    },

    emitFeaturesEvent() {
      // updates features
      const features = this.getFeaturesLayerFeatures();
      this.$emit('update:features', features);

      if (features.length === 0) {
        this.featuresTitleFromSource = null;

        // if user come from a document url, remove url
        if (this.$route.params.document_id) {
          this.$router.replace({ path: '/' + this.$route.name });
        }
      }
    },

    getFeaturesLayerFeatures() {
      return this.featuresLayerSource.getFeatures();
    },

    getFeaturesTitleFromGpx(features) {
      if (features && features.length) {
        const properties = features[0].getProperties();
        if (properties.name) {
          return properties.name;
        } else {
          return this.$gettext('GPX file');
        }
      }
    },

    getFeaturesTitleFromDocument(document) {
      return this.$documentUtils.getDocumentTitle(document.data);
    },

    onFeature(event) {
      // set features styles
      event.feature.set('highlightedStyle', highlightedLineStyle);
      // emit new features, only in normal case (drawing)
      // not in gpx/document case (prevent multiple update for each lines)
      if (!this.loadingExternalFeatures) {
        this.emitFeaturesEvent();
      }
    },

    onDrawStart() {
      document.addEventListener('keydown', this.onKeyWhileDrawing);
      document.addEventListener('keypress', this.onKeyWhileDrawing);
    },

    onDrawEnd() {
      document.removeEventListener('keydown', this.onKeyWhileDrawing);
      document.removeEventListener('keypress', this.onKeyWhileDrawing);
    },

    onModifyEnd() {
      this.emitFeaturesEvent();
    },

    onKeyWhileDrawing(event) {
      event.preventDefault();
      // backspace key
      if (event.key === 'Backspace') {
        this.drawInteraction.removeLastPoint();
      }
    },

    drawYetiImage() {
      const xml = new DOMParser().parseFromString(this.computedData, 'application/xml');
      const imageBase64 = xml.getElementsByTagName('wps:ComplexData')[0].textContent;
      const imageBbox = xml.getElementsByTagName('wps:ComplexData')[1].textContent;
      const imageExtent = ol.proj.transformExtent(imageBbox.split(',').map(Number), 'EPSG:4326', 'EPSG:3857');

      this.yetiLayer.setSource(
        new ol.source.ImageStatic({
          imageLoadFunction(image) {
            image.getImage().src = 'data:image/png;base64,' + imageBase64;
          },
          attributions: YETI_ATTRIBUTION,
          imageExtent,
        })
      );
      // source is set
      this.yetiLayerLoaded = true;
      // set map legend
      this.setLegend(xml);
    },

    setLegend(xml) {
      this.mapLegend = JSON.parse(xml.getElementsByTagName('wps:ComplexData')[2].textContent);
      this.mapLegend.items.forEach((item) => {
        item.color = `rgb(${item.color[0]}, ${item.color[1]}, ${item.color[2]})`;
      });
    },

    drawExtent(extent) {
      // extend extent
      const extentFill = ol.extent.buffer(extent, Math.max(extent[2] - extent[0], extent[3] - extent[1]) / 10);
      // then, create a donut polygon
      const feature = new ol.Feature(new ol.geom.Polygon([this.toLinearRing(extentFill), this.toLinearRing(extent)]));
      // add feature to extentlayer
      this.extentLayer.getSource().addFeature(feature);
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

    onUpdateOpacityYetiLayer() {
      this.yetiLayer.setOpacity(this.opacityYetiLayer);
    },

    onMountainsResult(data) {
      const features = data.data;
      let mountains = new ol.format.GeoJSON().readFeatures(features).map((mountain) => {
        return mountain.getProperties();
      });
      this.allMountains = this.sortMountainsByMassif(mountains);
      this.setVisibleMountains();
    },

    sortMountainsByMassif(mountains) {
      // first, order mountains by massifs
      const sortedMountains = {};
      for (let i = 0; i < mountains.length; i++) {
        if (!sortedMountains[mountains[i].mountain]) {
          sortedMountains[mountains[i].mountain] = [];
        }
        sortedMountains[mountains[i].mountain].push(mountains[i]);
      }
      mountains = sortedMountains;

      // then sort mountains inside each massif
      for (const i in mountains) {
        mountains[i].sort((a, b) => {
          if (a.title < b.title) return -1;
          if (b.title > a.title) return 1;
          return 0;
        });
      }

      return mountains;
    },

    setVisibleMountains() {
      // return, if mountains not loaded
      if (!this.allMountains) {
        return;
      }
      const mapExtent = this.getExtent('EPSG:4326');
      // clone this.mountains first, with no reference
      const visibleMountains = Object.assign({}, this.allMountains);
      // then filter if polygon isn’t in view
      for (const massif in visibleMountains) {
        visibleMountains[massif] = visibleMountains[massif].filter((mountain) => {
          const polygon = mountain.geometry;
          return polygon.intersectsExtent(mapExtent);
        });
        // unset massif if empty
        if (visibleMountains[massif].length === 0) {
          delete visibleMountains[massif];
        }
      }
      // set mountains in visibleMountains key
      const mountains = { visibleMountains };
      this.$emit('update:mountains', mountains);
    },

    onAreasResult(data) {
      const areas = data.data;
      const rawFeatures = new ol.format.GeoJSON().readFeatures(areas);
      // geojson is 4326, convert to 3857
      rawFeatures[0].getGeometry().transform('EPSG:4326', 'EPSG:3857');

      this.areas = rawFeatures.map((area) => {
        return area.getProperties();
      });

      // flatten coords
      const rawCoords = rawFeatures[0].getGeometry().getCoordinates();
      const coords = [];
      for (let i = 0; i < rawCoords.length; i++) {
        coords.push(...rawCoords[i]);
      }
      // then, build linestrings instead of polygon (perf)
      const features = [];
      for (let i = 0; i < coords.length; i++) {
        for (let j = 0; j < coords[i].length - 1; j++) {
          features.push(new ol.Feature(new ol.geom.LineString([coords[i][j], coords[i][j + 1]])));
        }
      }

      // add features
      this.areasLayer.getSource().addFeatures(features);
      // is area OK
      this.isAreaOK();
    },

    isAreaOK() {
      const mapExtent = this.getExtent('EPSG:3857');

      let areaOk = true;

      for (const area in this.areas) {
        const polygon = this.areas[area].geometry;
        if (polygon.intersectsExtent(mapExtent)) {
          break;
        } else {
          areaOk = false;
        }
      }

      this.$emit('update:areaOk', areaOk);
    },
  },
};
</script>

<style scoped lang="scss">
@import '~ol/ol.css';
@import '@/assets/sass/variables.scss';

$control-margin: 0.5em;

.ol-control-layer-switcher {
  bottom: 3em;
  left: $control-margin;
  color: white;
  text-decoration: none;
  background-color: rgba(0, 60, 136, 0.6);
  border: none;
  border-radius: 2px;
  padding: 0 10px 10px 10px;
  display: flex;

  & > div {
    width: 50%;

    &:first-child {
      margin-right: 10px;
    }

    header {
      font-weight: bold;
      padding-top: 10px;
    }
  }
}

.ol-control-layer-switcher-button {
  bottom: $control-margin;
  left: $control-margin;
}

.ol-control-recenter-on {
  top: $control-margin;
  left: 3em;
}

.ol-control-recenter-on-propositions {
  top: 35px;
  left: 3em;
  background: rgba(255, 255, 255, 0.9);
  padding: 5px;

  li:hover {
    background: lightgrey;
    cursor: pointer;
  }
}

$section-padding: 1.5rem; //TODO find this variable
$box-padding: 1.25rem; //TODO find this variable
$header-height: 34px;
$box-margin: 1.5rem; //TODO find this variable
$yeti-height: calc(
  100vh - #{$navbar-height} - #{$section-padding} - 2 *#{$box-padding} - #{$header-height} - #{$box-margin} - #{$box-margin}
);

.map-container {
  position: relative;

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
}
@media screen and (max-width: $tablet) {
  .map-container {
    height: $yeti-height;
    padding-left: 0;
    padding-top: 0;
    padding-bottom: 0;

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
}

@media screen and (min-width: $tablet) {
  .yeti-content {
    .map-container {
      min-height: 100%;
    }
  }
}
</style>
