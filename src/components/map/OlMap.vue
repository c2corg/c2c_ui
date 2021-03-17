<template>
  <!-- TODO on route view, map in full screen has not a full height -->
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
        <div v-for="layer of mapLayers" :key="layer.get('title')" @click="visibleLayer = layer">
          <input :checked="layer == visibleLayer" type="radio" />
          {{ $gettext(layer.get('title'), 'Map layer') }}
        </div>
      </div>
      <div>
        <header v-translate>Slopes</header>
        <div v-for="layer of dataLayers" :key="layer.get('title')" @click="toogleMapLayer(layer)">
          <input :checked="layer.getVisible()" type="checkbox" />
          {{ $gettext(layer.get('title'), 'Map slopes layer') }}
        </div>
        <template v-if="showProtectionAreas && !editable">
          <header v-translate>Protection areas</header>
          <input type="checkbox" :checked="protectionAreasVisible" @click="toggleProtectionAreas" />
          <span v-translate>Fauna protection areas</span>
        </template>
      </div>
    </div>

    <div
      v-show="showCenterOnGeolocation"
      ref="centerOnGeolocation"
      :title="$gettext('Recenter on your current position')"
      class="ol-control ol-control-center-on-geolocation"
    >
      <button @click="activateCenterOnGeolocation">
        <fa-icon icon="bullseye" />
      </button>
    </div>

    <div v-show="showFilterControl" ref="useMapAsFilter" class="ol-control ol-control-use-map-as-filter">
      <button
        @click="filterDocumentsWithMap = !filterDocumentsWithMap"
        :class="{ 'has-text-success': filterDocumentsWithMap }"
      >
        <fa-icon icon="search" />
        <span v-translate>Filter on map extent</span>
      </button>
    </div>

    <div
      v-show="showRecenterOn"
      ref="recenterOnControl"
      class="ol-control ol-control-recenter-on"
      :class="{ 'ol-control-recenter-on_on-top': !showFilterControl }"
    >
      <input type="text" :placeholder="$gettext('Recenter on...')" @input="searchRecenterPropositions" />
    </div>

    <div
      v-show="showRecenterOnPropositions"
      ref="recenterOnPropositions"
      class="ol-control ol-control-recenter-on-propositions"
      :class="{ 'ol-control-recenter-on-propositions_on-top': !showFilterControl }"
    >
      <ul v-if="recenterPropositions && recenterPropositions.data && recenterPropositions.data.features">
        <li v-for="(item, i) of recenterPropositions.data.features" :key="i" @click="recenterOn(item)">
          {{ item.properties.name }},
          <small>{{ item.properties.state }}, {{ item.properties.country }}</small>
        </li>
      </ul>
    </div>

    <div v-show="editable" ref="resetGeometry" class="ol-control ol-control-reset-geometry">
      <button @click="resetGeometry" v-translate>Reset geometry</button>
    </div>

    <div v-show="editable" ref="clearGeometry" class="ol-control ol-control-clear-geometry">
      <button @click="clearGeometry" v-translate>Clear</button>
    </div>

    <biodiv-information v-if="protectionAreasVisible" ref="BiodivInformation" :data="biodivData" />

    <swiss-protection-area-information
      v-if="protectionAreasVisible"
      ref="SwissProtectionAreaInformation"
      :data="swissProtectionAreaData"
    />
  </div>
</template>

<script>
import BiodivInformation from './BiodivInformation';
import SwissProtectionAreaInformation from './SwissProtectionAreaInformation';
import { cartoLayers, dataLayers, protectionAreasLayers } from './map-layers';
import {
  buildDiffStyle,
  buildPolygonStyle,
  geoJSONFormat,
  getDocumentLineStyle,
  getDocumentPointStyle,
} from './map-utils';

import BiodivSportsService from '@/js/apis/BiodivSportsService';
import RespecterCestProtegerService from '@/js/apis/RespecterCestProtegerService';
import photon from '@/js/apis/photon';
import { FIT } from '@/js/fit/FIT';
import ol from '@/js/libs/ol';

const DEFAULT_EXTENT = [-400000, 5200000, 1200000, 6000000];
const DEFAULT_POINT_ZOOM = 12;
const MAX_ZOOM = 19;
const TRACKING_INITIAL_ZOOM = 13;

const biodivSportsService = new BiodivSportsService();
const respecterCestProtegerService = new RespecterCestProtegerService();

export default {
  components: {
    BiodivInformation,
    SwissProtectionAreaInformation,
  },

  props: {
    documents: {
      type: Array,
      default: null,
    },

    showFilterControl: {
      type: Boolean,
      default: false,
    },

    showRecenterOn: {
      type: Boolean,
      default: false,
    },

    showCenterOnGeolocation: {
      type: Boolean,
      default: false,
    },

    showProtectionAreas: {
      type: Boolean,
      default: false,
    },

    biodivSportsActivities: {
      type: Array,
      default: null,
    },

    geomDetailEditable: {
      type: Boolean,
      default: false,
    },

    editedDocument: {
      type: Object,
      default: null,
    },

    oldDocument: {
      type: Object,
      default: null,
    },

    newDocument: {
      type: Object,
      default: null,
    },

    highlightedDocument: {
      type: Object,
      default: null,
    },
  },

  data() {
    let cartoLayers_ = cartoLayers();
    let dataLayers_ = dataLayers();

    // swiss topo only for logged users
    if (!this.$user.isLogged) {
      cartoLayers_ = cartoLayers_.filter((layer) => !layer.get('restricted'));
      dataLayers_ = dataLayers_.filter((layer) => !layer.get('restricted'));
    }

    return {
      map: null,

      // map layers, only one of them is visible
      mapLayers: cartoLayers_,

      // slope layers
      dataLayers: dataLayers_,

      // protection areas layer as features
      protectionAreasLayer: new ol.layer.Vector({
        source: new ol.source.Vector(),
      }),

      // protection areas layers
      protectionAreasLayers: protectionAreasLayers(),

      // layer for document icons and paths
      documentsLayer: new ol.layer.Vector({
        source: new ol.source.Vector(),
      }),

      // layer for associated waypoints
      waypointsLayer: new ol.layer.Vector({
        source: new ol.source.Vector(),
      }),

      // layer for associated images
      imagesLayer: new ol.layer.Vector({
        source: new ol.source.Vector(),
      }),

      geolocation: null,

      showLayerSwitcher: false,

      filterDocumentsWithMap: Boolean(this.$route.query.bbox),

      recenterPropositions: null,
      showRecenterOnPropositions: false,

      biodivData: {},
      swissProtectionAreaData: { properties: {} },
      protectionAreasVisible: this.showProtectionAreas && !this.editable,
      hasProtectionAreas: null,

      // on editable mode, there a button reset
      // we must save initial geometry
      initialGeometry: null,

      highlightedFeature: null,

      minZoomLevel: DEFAULT_POINT_ZOOM,
    };
  },

  computed: {
    editable() {
      return this.editedDocument !== null;
    },

    urlValue: {
      get() {
        const result = this.$route.query.bbox;
        return result
          ? result
              .replace('%252C', ',')
              .split(',')
              .map((num) => parseInt(num, 10))
          : undefined;
      },
    },

    view() {
      return this.map.getView();
    },

    visibleLayer: {
      get() {
        return this.mapLayers.find((layer) => layer.getVisible() === true);
      },
      set(layer) {
        this.visibleLayer.setVisible(false);
        layer.setVisible(true);
      },
    },
  },

  watch: {
    documents: {
      handler() {
        this.drawDocumentMarkers();
        this.fitMapToDocuments();
      },
    },

    editedDocument: {
      handler() {
        this.drawDocumentMarkers();
        this.fitMapToDocuments();

        // when route is set on outing edition, geom may be updated
        this.setDrawInteraction();
      },
      deep: true, // must look on change inside documents object
    },

    // if, for any reason, geomtry of edited document is set, center map on it
    // * new value entered in text inputs
    // * first click
    // * new association to route (geomtry is copied from route to outing in this case)
    'editedDocument.geometry.geom': {
      handler(to, from) {
        if (from === null && to !== null) {
          this.fitMapToDocuments(true);
        }
      },
    },

    filterDocumentsWithMap: 'sendBoundsToUrl',

    highlightedDocument() {
      if (this.highlightedDocument) {
        this.setHighlightedFeature(
          this.documentsLayer.getSource().getFeatureById(this.highlightedDocument.document_id)
        );
      } else {
        this.setHighlightedFeature(null);
      }
    },
  },

  mounted() {
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
        new ol.control.Control({ element: this.$refs.useMapAsFilter }),
        new ol.control.Control({ element: this.$refs.centerOnGeolocation }),
        new ol.control.Control({ element: this.$refs.recenterOnControl }),
        new ol.control.Control({ element: this.$refs.recenterOnPropositions }),
        new ol.control.Control({ element: this.$refs.resetGeometry }),
        new ol.control.Control({ element: this.$refs.clearGeometry }),
        new ol.control.Attribution({ tipLabel: this.$gettext('Attributions', 'Map controls') }),
      ],

      layers: [
        ...this.mapLayers,
        ...this.dataLayers,
        ...this.protectionAreasLayers,
        this.protectionAreasLayer,
        this.imagesLayer, // images icons will be under documents
        this.documentsLayer,
        this.waypointsLayer, // keep waypoint above trace and documents
      ],

      view: new ol.View({
        maxZoom: MAX_ZOOM,
      }),

      loadTilesWhileAnimating: true,
      loadTilesWhileInteracting: true,

      // pixelRatio: this.pixelRatio,
      // renderer: this.renderer,
      // keyboardEventTarget: this.keyboardEventTarget,
    });

    this.map.on('moveend', this.sendBoundsToUrl);
    this.map.on('moveend', this.getProtectionAreas);
    if (this.protectionAreasVisible) {
      this.protectionAreasLayers.forEach((layer) => layer.setVisible(true));
    }

    this.geolocation = new ol.Geolocation({
      trackingOptions: {
        enableHighAccuracy: true,
      },

      projection: this.view.getProjection(),
    });

    this.geolocation.on('change:position', this.setCenterOnGeoLocation);

    this.drawDocumentMarkers();

    if (this.urlValue) {
      this.view.fit(this.urlValue, { size: this.map.getSize() });
    } else {
      this.fitMapToDocuments(true);
    }

    if (this.editable) {
      // deep clone : https://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-deep-clone-an-object-in-javascript
      this.initialGeometry = JSON.parse(JSON.stringify(this.editedDocument.geometry));

      this.setModifyInteractions();
      this.setDrawInteraction();
      this.setDragAndDropInteraction();
    } else {
      // if map is not editable, feature are clickable
      this.map.on('pointermove', this.onPointerMove);
      this.map.on('click', this.onClick);
    }
  },

  methods: {
    setModifyInteractions() {
      const source = this.documentsLayer.getSource();
      const modify = new ol.interaction.Modify({ source });

      this.map.addInteraction(modify);
      this.map.addInteraction(new ol.interaction.Snap({ source }));

      modify.on('modifyend', (event) => {
        for (const feature of event.features.getArray()) {
          this.updateDocumentGeometryFromFeature(feature);
        }
      });
    },

    setDrawInteraction() {
      const source = this.documentsLayer.getSource();

      if (this.drawInteraction) {
        this.map.removeInteraction(this.drawInteraction);
      }

      this.drawInteraction = null;

      // sometimes, geom may not be set on edited documents
      this.editedDocument.geometry = this.editedDocument.geometry ?? {};

      if (!this.editedDocument.geometry.geom) {
        this.drawInteraction = new ol.interaction.Draw({
          source,
          type: 'Point',
        });
      } else if (this.geomDetailEditable && !this.editedDocument.geometry.geom_detail) {
        this.drawInteraction = new ol.interaction.Draw({
          source,
          type: 'LineString',
        });
      }

      if (this.drawInteraction) {
        this.map.addInteraction(this.drawInteraction);

        this.drawInteraction.on('drawend', (event) => {
          this.setDocumentGeometryFromFeature(event.feature);
        });
      }
    },

    // https://openlayers.org/en/latest/examples/drag-and-drop.html
    setDragAndDropInteraction() {
      // handle use case when user drag&drop a gpx/kml/fit file on map
      const dragAndDrop = new ol.interaction.DragAndDrop({
        formatConstructors: [ol.format.GPX, ol.format.KML, FIT],
      });

      dragAndDrop.on(
        'addfeatures',
        function (event) {
          event.features.map(this.setDocumentGeometryFromFeature);
          this.fitMapToDocuments(true);
        }.bind(this)
      );

      this.map.addInteraction(dragAndDrop);
    },

    updateDocumentGeometryFromFeature(feature) {
      const document = feature.get('document');

      if (!document) {
        return;
      }

      this.setDocumentGeometry(document, feature.get('geometry'));
    },

    tryReadFeaturesFromGeoFile(file, format, options) {
      try {
        return format.readFeatures(file, options);
      } catch (e) {
        return null;
      }
    },

    setDocumentGeometryFromGeoFile(file) {
      for (const format of [new ol.format.GPX(), new FIT(), new ol.format.KML()]) {
        const features = this.tryReadFeaturesFromGeoFile(file, format, { featureProjection: 'EPSG:3857' });
        if (features?.length) {
          features.map(this.setDocumentGeometryFromFeature);
          this.fitMapToDocuments(true);
          break;
        }
      }
    },

    setDocumentGeometryFromFeature(feature) {
      this.setDocumentGeometry(this.editedDocument, feature.get('geometry'));
      this.drawDocumentMarkers();
      this.setDrawInteraction();
    },

    setDocumentGeometry(document, geometry) {
      const geoJsonGeometry = geoJSONFormat.writeGeometryObject(geometry);

      if (geoJsonGeometry.type === 'Point') {
        // remove elevation and timestamp
        geoJsonGeometry.coordinates = geoJsonGeometry.coordinates.slice(0, 2);
        document.geometry.geom = JSON.stringify(geoJsonGeometry);
      } else if (geoJsonGeometry.type === 'LineString' || geoJsonGeometry.type === 'MultiLineString') {
        if (document.type === 'a') {
          // areas need a polygon, let change the path, check that first and last point are the same
          geoJsonGeometry.type = 'Polygon';
          const firstPoint = JSON.stringify(geoJsonGeometry.coordinates[0][0]);
          const lastPoint = JSON.stringify(geoJsonGeometry.coordinates[0][geoJsonGeometry.coordinates[0].length - 1]);

          if (firstPoint !== lastPoint) {
            // close the loop
            geoJsonGeometry.coordinates[0].push(geoJsonGeometry.coordinates[0][0]);
          }
        }

        document.geometry.geom_detail = JSON.stringify(geoJsonGeometry);

        if (!document.geometry.geom) {
          const mainLine = geometry.getType() === 'MultiLineString' ? geometry.getLineString(0) : geometry;
          this.setDocumentGeometry(document, new ol.geom.Point(mainLine.getCoordinateAt(0.5)));
        }
      } else if (geoJsonGeometry.type === 'Polygon') {
        document.geometry.geom_detail = JSON.stringify(geoJsonGeometry);
      } else {
        throw new Error(`Unexpected geometry type : ${geometry.type}`);
      }
    },

    drawDocumentMarkers() {
      const documentsSource = this.documentsLayer.getSource();
      const waypointsSource = this.waypointsLayer.getSource();
      const imagesSource = this.imagesLayer.getSource();

      documentsSource.clear();
      waypointsSource.clear();
      imagesSource.clear();

      this.addDocumentFeature(this.oldDocument, documentsSource, buildDiffStyle(true));
      this.addDocumentFeature(this.newDocument, documentsSource, buildDiffStyle(false));

      this.addDocumentFeature(this.editedDocument, documentsSource);

      for (const document of this.documents ?? []) {
        this.addDocumentFeature(document, documentsSource);

        if (document.associations) {
          for (const waypoint of document.associations.waypoints ?? []) {
            this.addDocumentFeature(waypoint, waypointsSource);
          }
          for (const waypoint of document.associations.waypoint_children ?? []) {
            this.addDocumentFeature(waypoint, waypointsSource);
          }

          // show associated images only for outings
          if (document.type === 'o') {
            for (const image of document.associations.images ?? []) {
              if (!this.$documentUtils.hasSameGeolocation(image, document)) {
                // show image marker only if it's geolocation is different from document
                this.addDocumentFeature(image, imagesSource);
              }
            }
          }
        }
      }
    },

    addDocumentFeature(document, source, style) {
      if (!document || !document.geometry) {
        return;
      }

      const title = this.$documentUtils.getDocumentTitle(document);

      if (document.geometry.geom) {
        const feature = this.addFeature(
          source,
          JSON.parse(document.geometry.geom),
          style ?? getDocumentPointStyle(document, title, false),
          style ? null : getDocumentPointStyle(document, title, true)
        );

        feature.set('document', document);
        feature.setId(document.document_id);
      }

      if (document.geometry.geom_detail) {
        this.addFeature(
          source,
          JSON.parse(document.geometry.geom_detail),
          style ?? getDocumentLineStyle(title, false),
          style ? null : getDocumentLineStyle(title, true)
        ).set('document', document);
      }
    },

    addFeature(source, data, normalStyle, highlightedStyle) {
      if (!data) {
        return;
      }

      const feature = geoJSONFormat.readFeature(data);

      feature.set('normalStyle', normalStyle);

      if (highlightedStyle) {
        feature.set('highlightedStyle', highlightedStyle);
      }

      feature.setStyle(normalStyle);
      source.addFeature(feature);

      return feature;
    },

    addBiodivSportsData(response) {
      const results = response?.data?.results;
      if (!results.length) {
        return;
      }

      const source = this.protectionAreasLayer.getSource();

      for (const result of results) {
        const geometry = geoJSONFormat.readGeometry(result.geometry, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857',
        });

        const feature = new ol.Feature({
          geometry,
          id: result.id,
          biodivData: {
            source: 'biodivsports',
            title: result.name,
            description: result.description,
            infoUrl: result.info_url,
            kmlUrl: result.kml_url,
            period: result.period,
          },
        });

        feature.setId('biodiv_' + result.id);

        feature.set('normalStyle', buildPolygonStyle());
        feature.setStyle(feature.get('normalStyle'));

        source.addFeature(feature);
      }
    },

    toggleProtectionAreas() {
      this.protectionAreasVisible = !this.protectionAreasVisible;
      this.protectionAreasLayers.forEach((layer) => layer.setVisible(!layer.getVisible()));
      this.protectionAreasLayer.setVisible(!this.protectionAreasLayer.getVisible());
    },

    // If user want's to filter with map, it will send extent to url
    // otherwise, it set bbox url to undefined
    sendBoundsToUrl() {
      const bounds = this.view.calculateExtent();
      const query = Object.assign({}, this.$route.query);

      query.bbox = this.filterDocumentsWithMap ? bounds.map(Math.round).join(',') : undefined;
      if (query.bbox !== this.$route.query.bbox) {
        this.$router.push({ query });
      }
    },

    fitMapToDocuments(force) {
      if ((this.filterDocumentsWithMap || this.editable) && !force) {
        return;
      }

      let extent = ol.extent.createEmpty();

      for (const layer of [this.documentsLayer, this.waypointsLayer]) {
        ol.extent.extend(extent, layer.getSource().getExtent());
      }

      if (extent.filter(isFinite).length !== 4) {
        // if there is infnity, default extent
        // TODO need to be current extent if it exists ...
        extent = DEFAULT_EXTENT;
      }

      this.view.fit(extent, { size: this.map.getSize() });

      // set a minimum zoom level
      this.view.setZoom(Math.min(this.minZoomLevel, this.view.getZoom()));
    },

    toogleMapLayer(layer) {
      layer.setVisible(!layer.getVisible());
    },

    getExtent(projection) {
      let extent = this.view.calculateExtent(this.map.getSize() || null);

      if (projection) {
        extent = ol.proj.transformExtent(extent, ol.proj.get('EPSG:3857'), ol.proj.get(projection));
      }

      return extent;
    },

    onPointerMove(event) {
      let resultFeature = null;

      this.map.forEachFeatureAtPixel(event.pixel, function (feature) {
        resultFeature = feature;
        return true;
      });

      this.setHighlightedFeature(resultFeature);
      this.$emit('highlight-document', resultFeature ? resultFeature.get('document') : null);
    },

    setHighlightedFeature(feature) {
      if (feature === this.highlightedFeature) {
        return;
      }

      if (this.highlightedFeature) {
        this.highlightedFeature.setStyle(this.highlightedFeature.get('normalStyle'));
      }

      this.highlightedFeature = feature;

      if (feature && feature.get('highlightedStyle')) {
        feature.setStyle(feature.get('highlightedStyle'));
      }
    },

    onClick(event) {
      const feature = this.map.forEachFeatureAtPixel(event.pixel, (f) => f);

      if (feature) {
        const document = feature.get('document');
        if (document) {
          this.$router.push({
            name: this.$documentUtils.getDocumentType(document.type),
            params: { id: document.document_id },
          });
        } else if (feature.get('biodivData')) {
          this.biodivData = feature.get('biodivData');
          this.$refs.BiodivInformation.show();
        }
      } else {
        // handle clicks on enabled layers
        if (this.protectionAreasVisible) {
          const extent = this.view.calculateExtent(this.map.getSize() || null);
          const rcpExtent = ol.proj.transformExtent(extent, ol.proj.get('EPSG:3857'), ol.proj.get('EPSG:21781'));
          const position = ol.proj.transform(event.coordinate, ol.proj.get('EPSG:3857'), ol.proj.get('EPSG:21781'));
          respecterCestProtegerService
            .identify(position, rcpExtent, this.map.getSize()[0], this.map.getSize()[1], this.$language.current)
            .then(({ data }) => {
              if (data.results && data.results.length) {
                // if there are several results, then there must be an area and an allowed path. select area
                this.swissProtectionAreaData =
                  data.results.find((result) => result.geometry.type === 'MultiPolygon') ?? data.results[0];
                this.$refs.SwissProtectionAreaInformation.show();
              }
            });
        }
      }
    },

    activateCenterOnGeolocation() {
      this.geolocation.setTracking(true);
    },

    setCenterOnGeoLocation() {
      const position = this.geolocation.getPosition();
      this.view.setZoom(TRACKING_INITIAL_ZOOM);
      this.view.setCenter(position);
      this.geolocation.setTracking(false);
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

    // https://github.com/c2corg/v6_ui/blob/c9962a6c3bac0670eab732d563f9f480379f84d1/c2corg_ui/static/js/map/search.js#L194
    recenterOn(item) {
      const feature = geoJSONFormat.readFeature(item);
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

    getProtectionAreas() {
      if (!this.protectionAreasVisible) {
        return;
      }

      const extent = this.view.calculateExtent(this.map.getSize() || null);
      // get extent in expected format
      const bsExtent = ol.proj.transformExtent(extent, ol.proj.get('EPSG:3857'), ol.proj.get('EPSG:4326'));

      if (this.hasProtectionAreas !== null) {
        // check already made, only update biodivsport areas features
        biodivSportsService
          .fetchData(bsExtent, this.biodivSportsActivities, this.$language.current)
          .then(this.addBiodivSportsData);
      } else {
        // first call, check protection areas are contained within map extent and download biodivsports features
        const rcpExtent = ol.proj.transformExtent(extent, ol.proj.get('EPSG:3857'), ol.proj.get('EPSG:21781'));
        Promise.allSettled([
          biodivSportsService
            .fetchData(bsExtent, this.biodivSportsActivities, this.$language.current)
            .then((response) => {
              this.addBiodivSportsData(response);
              return (response?.data?.results?.length ?? 0) > 0;
            }),
          respecterCestProtegerService.hasArea(rcpExtent),
        ]).then((hasArea) => {
          this.hasProtectionAreas = hasArea.some((result) => (result.status === 'fulfilled' ? result.value : false));
          if (this.hasProtectionAreas) {
            this.$emit('has-protection-area');
          }
        });
      }
    },

    clearGeometry() {
      this.editedDocument.geometry.geom = null;
      this.editedDocument.geometry.geom_detail = null;
      this.drawDocumentMarkers(); // redraw markers
      this.setDrawInteraction(); // reset interaction mode
    },

    resetGeometry() {
      this.editedDocument.geometry = JSON.parse(JSON.stringify(this.initialGeometry));
      this.drawDocumentMarkers(); // redraw markers
      this.setDrawInteraction(); // reset interaction mode
    },
  },
};
</script>

<style lang="scss">
// disable mobile CSS for controls.
.ol-touch .ol-control button {
  font-size: 1.14em !important;
}
</style>

<style lang="scss" scoped>
@import '~ol/ol.css';

$control-margin: 0.5em;

.ol-control-center-on-geolocation {
  top: 100px;
  left: $control-margin;
}

.ol-control-layer-switcher {
  bottom: 3em;
  left: $control-margin;
}

.ol-control-layer-switcher-button {
  bottom: $control-margin;
  left: $control-margin;
}

.ol-control-use-map-as-filter {
  top: $control-margin;
  left: 3em;

  button {
    width: auto;
    font-size: 1rem;
    font-weight: normal;
    padding: 3px;

    svg {
      margin-right: 3px;
    }
  }
}

.ol-control-recenter-on {
  top: 35px;
  left: 3em;
}

.ol-control-recenter-on_on-top {
  top: $control-margin;
}

.ol-control-recenter-on-propositions {
  top: 65px;
  left: 3em;
  background: rgba(255, 255, 255, 0.9);
  padding: 5px;

  li:hover {
    background: lightgrey;
    cursor: pointer;
  }
}

.ol-control-recenter-on-propositions_on-top {
  top: 35px;
}

.ol-control-reset-geometry {
  top: 5px;
  right: 5px;

  button {
    padding: 5px;
    width: auto !important;
    font-weight: normal;
  }
}

.ol-control-clear-geometry {
  top: 35px;
  right: 5px;

  button {
    padding: 5px;
    width: auto !important;
    font-weight: normal;
  }
}

//style on layers popup
.ol-control-layer-switcher {
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
</style>

<style lang="scss">
$control-margin: 0.5em;

.ol-scale-line {
  background: rgba(255, 255, 255, 0.3);
  bottom: 10px;
  right: 40px;
  left: initial;

  .ol-scale-line-inner {
    color: black;
    border: 1px solid black;
    border-top: none;
  }
}

.ol-full-screen {
  right: auto;
  left: $control-margin;
  top: 60px;
}
</style>
