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
      <input
        id="filter-documents-with-map"
        class="switch is-rtl is-rounded is-info is-small"
        type="checkbox"
        v-model="filterDocumentsWithMap"
      />
      <label
        for="filter-documents-with-map"
        v-translate
        :title="filterDocumentsWithMap ? $gettext('Map filter on') : $gettext('Map filter off')"
      >
        Filter on map extent
      </label>
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
import { toast } from 'bulma-toast';
import { format as formatDate } from 'date-fns';

import BiodivInformation from './BiodivInformation';
import SwissProtectionAreaInformation from './SwissProtectionAreaInformation';
import { cartoLayers, dataLayers, protectionAreasLayers } from './map-layers';
import {
  buildDiffStyle,
  buildPolygonStyle,
  geoJSONFormat,
  getDocumentLineStyle,
  getDocumentPointStyle,
  getElevationProfileMarkerStyle,
  swissExtent,
} from './map-utils';

import BiodivSportsService from '@/js/apis/BiodivSportsService';
import RespecterCestProtegerService from '@/js/apis/RespecterCestProtegerService';
import photon from '@/js/apis/photon';
import { FIT } from '@/js/fit/FIT';
import ol from '@/js/libs/ol';

const DEFAULT_EXTENT = [-400000, 5200000, 1200000, 6000000];
const DEFAULT_POINT_ZOOM = 14;
const MAX_ZOOM = 19;
const TRACKING_INITIAL_ZOOM = 13;

const biodivSportsService = new BiodivSportsService();
const respecterCestProtegerService = new RespecterCestProtegerService();

const isNotVirtual = (waypoint) => waypoint.waypoint_type !== 'virtual';

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

    initialExtent: {
      type: Array,
      default: null,
    },

    fullScreenElementId: {
      type: String,
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

      // layer edited document
      editionLayer: new ol.layer.Vector({
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

      // layer for displaying the elevation profile current point
      elevationProfileLayer: new ol.layer.Vector({
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
    documents: 'drawDocumentMarkers',
    'editedDocument.condition_rating': 'drawDocumentMarkers',
    'editedDocument.waypoint_type': 'drawDocumentMarkers',

    // if, for any reason, geometry of edited document is set, center map on it
    // * new value entered in text inputs
    // * first click
    // * new association to route (geometry is copied from route to outing in this case)
    'editedDocument.geometry.geom': {
      handler(to, from) {
        if (from === null && to !== null) {
          this.setDrawInteraction(); // reset interaction mode
        }
      },
    },

    filterDocumentsWithMap: 'sendBoundsToUrl',

    highlightedDocument(newValue) {
      if (newValue) {
        this.setHighlightedFeature(this.documentsLayer.getSource().getFeatureById(newValue.document_id));
      } else {
        this.setHighlightedFeature(null);
      }
    },

    fullScreenElementId(newValue) {
      // update the fullscreen control (we actually need to remove the old
      // one and attach a new one)
      this.map.removeControl(this.fullScreenControl);
      this.fullScreenControl = this.createFullScreenController(newValue || this.$el);
      this.map.addControl(this.fullScreenControl);
    },
  },

  mounted() {
    // if we have an elevation profile, it will be displayed over the map
    // else, we directly use the map element for fullscreen
    this.fullScreenControl = this.createFullScreenController(this.fullScreenElementId || this.$el);

    this.map = new ol.Map({
      target: this.$refs.map,

      controls: [
        this.fullScreenControl,
        new ol.control.Zoom({
          zoomInTipLabel: this.$gettext('Zoom in', 'Map controls'),
          zoomOutTipLabel: this.$gettext('Zoom out', 'Map controls'),
        }),
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
        this.elevationProfileLayer,
        this.editionLayer,
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
    this.map.on('moveend', this.emitMoveEvent);

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
    } else if (this.initialExtent) {
      this.fit(this.initialExtent);
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

    // listen to elevation profile events to display
    // the related point on the map
    this.setElevationProfileInteraction();
  },

  beforeDestroy() {
    this.fullScreenControl.un('enterfullscreen', this.fitMapToDocuments);
    this.fullScreenControl.un('leavefullscreen', this.fitMapToDocuments);
  },

  methods: {
    createFullScreenController(source) {
      const control = new ol.control.FullScreen({
        source,
        tipLabel: this.$gettext('Toggle full-screen', 'Map Controls'),
      });
      control.on('enterfullscreen', this.fitMapToDocuments);
      control.on('leavefullscreen', this.fitMapToDocuments);
      return control;
    },

    setModifyInteractions() {
      const source = this.editionLayer.getSource();
      const modify = new ol.interaction.Modify({ source });

      this.map.addInteraction(modify);
      this.map.addInteraction(new ol.interaction.Snap({ source }));

      modify.on('modifyend', (event) => {
        for (const feature of event.features.getArray()) {
          this.setDocumentGeometry(feature.get('geometry'));
        }
      });
    },

    setDrawInteraction() {
      const source = this.editionLayer.getSource();

      if (this.drawInteraction) {
        this.map.removeInteraction(this.drawInteraction);
      }

      this.drawInteraction = null;

      // sometimes, geom may not be set on edited documents
      this.editedDocument.geometry = this.editedDocument.geometry ?? {};

      if (!this.editedDocument.geometry.geom) {
        // the point is not set
        if (this.editedDocument.type !== 'o') {
          // do not let user set the point for outings
          this.drawInteraction = new ol.interaction.Draw({
            source,
            type: 'Point',
          });
        }
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

    setDragAndDropInteraction() {
      // handle use case when user drag&drop a gpx/kml/fit file on map
      const dragAndDrop = new ol.interaction.DragAndDrop({
        formatConstructors: [ol.format.GPX, ol.format.KML, FIT],
      });

      dragAndDrop.on(
        'addfeatures',
        function (event) {
          event.features.map((feature) => {
            if (document.type !== 'o') {
              this.cleanZeroElevationFromGeoFileFeature(feature);
            }
            return this.setDocumentGeometryFromFeature(feature);
          });
        }.bind(this)
      );

      this.map.addInteraction(dragAndDrop);
    },

    tryReadFeaturesFromGeoFile(file, format, options) {
      try {
        return format.readFeatures(file, options);
      } catch (e) {
        return null;
      }
    },

    cleanZeroElevationFromGeoFileFeature(feature) {
      // GPS often have a bad elevation (0) for some of the points
      // We do a simple algorithm to prevent most of these cases
      // by applying the elevation of the nearest 'good' coordinate to the
      // 'faulty' coordinates if they are not too far away
      const geometry = feature.get('geometry');
      const type = geometry.getType();
      const coords = geometry.getCoordinates();

      if (type === 'LineString') {
        this.cleanZeroElevationFromLineString(coords);
      } else if (type === 'MultiLineString') {
        coords.map(this.cleanZeroElevationFromLineString);
      }
      geometry.setCoordinates(coords);
    },

    cleanZeroElevationFromLineString(coords) {
      const findIndex = (array, callback, start) => {
        const index = array.slice(start).findIndex(callback);
        return index === -1 ? -1 : index + start;
      };
      const findIndexBackwards = (array, callback, start) => {
        const index = findIndex(array.slice().reverse(), callback, array.length - 1 - start);
        return index > 0 ? array.length - 1 - index : index;
      };
      const isElevationOk = (coord) => coord.length > 2 && coord[2] !== 0;
      // Since we use EPSG:3857, we can easily compute the approximated distance
      const distance = (c, i, j) => Math.sqrt((c[i][0] - c[j][0]) ** 2 + (c[i][1] - c[j][1]) ** 2);

      if (!coords.some(isElevationOk)) {
        return;
      }

      let badIndex = 0;
      while ((badIndex = findIndex(coords, (coord) => !isElevationOk(coord), badIndex)) !== -1) {
        // Get the distance between the point without elevation, and the nearest point with elevation
        // If it's less than 100m, we can consider that it's elevation is the same
        const goodIndexFw = findIndex(coords, isElevationOk, badIndex);
        const goodIndexBw = findIndexBackwards(coords, isElevationOk, badIndex);
        const distanceFw = goodIndexFw !== -1 ? distance(coords, badIndex, goodIndexFw) : Infinity;
        const distanceBw = goodIndexBw !== -1 ? distance(coords, badIndex, goodIndexBw) : Infinity;

        if (distanceFw > 100 && distanceBw > 100) {
          badIndex++;
          break;
        }

        coords[badIndex][2] = coords[distanceFw < distanceBw ? goodIndexFw : goodIndexBw][2];
        badIndex++;
      }
    },

    setDocumentGeometryFromGeoFile(file) {
      for (const format of [new ol.format.GPX(), new FIT(), new ol.format.KML()]) {
        const features = this.tryReadFeaturesFromGeoFile(file, format, { featureProjection: 'EPSG:3857' });
        if (features?.length) {
          features.map((feature) => {
            if (document.type !== 'o') {
              this.cleanZeroElevationFromGeoFileFeature(feature);
            }
            return this.setDocumentGeometryFromFeature(feature);
          });
          return;
        }
      }
      toast({
        message: this.$gettext('No data could be extracted from GPS file'),
        type: 'is-danger',
      });
    },

    setDocumentGeometryFromFeature(feature) {
      const geometry = feature.get('geometry');
      this.setDocumentGeometry(geometry);
      this.drawDocumentMarkers();
      this.setDrawInteraction();
      this.setOutingStartDate(this.editedDocument, geometry);
    },

    setOutingStartDate(document, geometry) {
      if (document.type !== 'o' || document.date_start) {
        return;
      }

      const firstCoordinate = geometry.getFirstCoordinate();
      let timestamp;
      switch (geometry.getLayout()) {
        case 'XYZM':
          timestamp = firstCoordinate[3];
          break;
        case 'XYM':
          timestamp = firstCoordinate[2];
          break;
        default:
          return;
      }

      if (!timestamp) {
        return;
      }

      document.date_start = formatDate(new Date(timestamp * 1000), 'yyyy-MM-dd');
    },

    setElevationProfileInteraction() {
      this.elevationProfileLayer.setVisible(false);
      const elevationProfileSource = this.elevationProfileLayer.getSource();
      const elevationProfileMarker = new ol.Feature();
      elevationProfileMarker.setStyle(getElevationProfileMarkerStyle());
      elevationProfileSource.addFeature(elevationProfileMarker);
      this.$root.$on('elevation_profile', (event, coord) => {
        switch (event) {
          case 'cursor_end':
            this.elevationProfileLayer.setVisible(false);
            break;
          case 'cursor_move':
            this.elevationProfileLayer.setVisible(true);
            elevationProfileMarker.setGeometry(new ol.geom.Point(coord));
            const visible = ol.extent.containsXY(this.view.calculateExtent(), coord[0], coord[1]);
            if (!visible) {
              this.view.animate({
                center: coord,
                duration: 300,
              });
            }
            break;
          case 'toggle_fullscreen':
            setTimeout(() => this.map.updateSize(), 0);
        }
      });
    },

    setDocumentGeometry(geometry) {
      const document = this.editedDocument;
      const geoJsonGeometry = geoJSONFormat.writeGeometryObject(geometry);

      const change = (newGeometry) => {
        if (newGeometry.geom) {
          document.geometry.geom = newGeometry.geom;
        }

        if (newGeometry.geom_detail) {
          document.geometry.geom_detail = newGeometry.geom_detail;
        }
      };

      if (geoJsonGeometry.type === 'Point') {
        // remove elevation and timestamp
        geoJsonGeometry.coordinates = geoJsonGeometry.coordinates.slice(0, 2);
        change({ geom: JSON.stringify(geoJsonGeometry) });
      } else if (geoJsonGeometry.type === 'LineString' || geoJsonGeometry.type === 'MultiLineString') {
        if (document.type === 'a') {
          // areas need a polygon, let's change the path, check that first and last points are the same
          geoJsonGeometry.type = 'Polygon';
          const firstPoint = JSON.stringify(geoJsonGeometry.coordinates[0][0]);
          const lastPoint = JSON.stringify(geoJsonGeometry.coordinates[0][geoJsonGeometry.coordinates[0].length - 1]);

          if (firstPoint !== lastPoint) {
            // close the loop
            geoJsonGeometry.coordinates[0].push(geoJsonGeometry.coordinates[0][0]);
          }
        }

        change({ geom_detail: JSON.stringify(geoJsonGeometry) });

        if (!document.geometry.geom) {
          const mainLine = geometry.getType() === 'MultiLineString' ? geometry.getLineString(0) : geometry;
          this.setDocumentGeometry(new ol.geom.Point(mainLine.getCoordinateAt(0.5)));
        }
      } else if (geoJsonGeometry.type === 'Polygon' || geoJsonGeometry.type === 'MultiPolygon') {
        // areas
        change({ geom_detail: JSON.stringify(geoJsonGeometry) });
      } else {
        throw new Error(`Unexpected geometry type : ${geometry.type}`);
      }
    },

    drawDocumentMarkers() {
      const editionSource = this.editionLayer.getSource();
      const documentsSource = this.documentsLayer.getSource();
      const waypointsSource = this.waypointsLayer.getSource();
      const imagesSource = this.imagesLayer.getSource();

      editionSource.clear();
      documentsSource.clear();
      waypointsSource.clear();
      imagesSource.clear();

      this.addDocumentFeature(this.oldDocument, documentsSource, buildDiffStyle(true));
      this.addDocumentFeature(this.newDocument, documentsSource, buildDiffStyle(false));

      this.addDocumentFeature(this.editedDocument, editionSource);

      for (const document of this.documents ?? []) {
        this.addDocumentFeature(document, documentsSource);

        if (document.associations) {
          for (const waypoint of document.associations.waypoints?.filter(isNotVirtual) ?? []) {
            this.addDocumentFeature(waypoint, waypointsSource);
          }
          for (const waypoint of document.associations.waypoint_children?.filter(isNotVirtual) ?? []) {
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

    emitMoveEvent() {
      const bounds = this.view.calculateExtent();
      this.$emit('move', bounds.map(Math.round));
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

    fit(extent) {
      this.view.fit(extent, { size: this.map.getSize() });

      // slightly increase the extent, for more comfort
      let zoom = this.view.getZoom() * 0.95;

      // and set a minimum zoom level
      zoom = Math.min(this.minZoomLevel, zoom);

      this.view.setZoom(zoom);

      return this.view.calculateExtent().map(Math.round);
    },

    fitMapToDocuments(force) {
      if ((this.filterDocumentsWithMap || this.editable) && !force) {
        return this.view.calculateExtent().map(Math.round);
      }

      this.drawDocumentMarkers();

      let extent = ol.extent.createEmpty();

      for (const layer of [this.editionLayer, this.documentsLayer, this.waypointsLayer]) {
        ol.extent.extend(extent, layer.getSource().getExtent());
      }

      if (extent.filter(isFinite).length !== 4) {
        // if there is infinity, default extent
        // TODO need to be current extent if it exists ...
        extent = DEFAULT_EXTENT;
      }

      return this.fit(extent);
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

    intersectsWithSwitzerland(extent) {
      return ol.extent.intersects(extent, swissExtent);
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
          if (!this.intersectsWithSwitzerland(extent)) {
            return;
          }
          respecterCestProtegerService
            .identify(event.coordinate, extent, this.map.getSize()[0], this.map.getSize()[1], this.$language.current)
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
        Promise.allSettled([
          biodivSportsService
            .fetchData(bsExtent, this.biodivSportsActivities, this.$language.current)
            .then((response) => {
              this.addBiodivSportsData(response);
              return (response?.data?.results?.length ?? 0) > 0;
            }),
          this.intersectsWithSwitzerland(extent)
            ? respecterCestProtegerService.hasArea(extent)
            : Promise.resolve(false),
        ]).then((hasArea) => {
          this.hasProtectionAreas = hasArea.some((result) => (result.status === 'fulfilled' ? result.value : false));
          if (this.hasProtectionAreas) {
            this.$emit('has-protection-area');
          }
        });
      }
    },

    clearGeometry() {
      if (this.editedDocument.type !== 'o') {
        // user can't set the outing point directly (he must select the route)
        // So do not clear geometry.geom
        this.editedDocument.geometry.geom = null;
      }

      this.editedDocument.geometry.geom_detail = null;
      this.drawDocumentMarkers(); // redraw markers
      this.setDrawInteraction(); // reset interaction mode
    },

    resetGeometry() {
      if (this.editedDocument.type === 'o') {
        // user can't set the outing point directly (he must select the route)
        // So do not reinit geometry.geom to nothing
        this.editedDocument.geometry.geom = this.initialGeometry.geom || this.editedDocument.geometry.geom;
        this.editedDocument.geometry.geom_detail = this.initialGeometry.geom_detail;
      } else {
        this.editedDocument.geometry = JSON.parse(JSON.stringify(this.initialGeometry));
      }

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
  background: rgba(255, 255, 255, 0.8);

  .is-info:checked + label::before {
    background-color: rgba(0, 60, 136, 0.6);
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
