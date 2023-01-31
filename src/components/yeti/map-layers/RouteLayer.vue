<script>
import layerMixin from './layer';
import simplify from './simplify';

import Yetix from '@/components/yeti/Yetix';
import c2c from '@/js/apis/c2c';
import ol from '@/js/libs/ol';

let normalLineStyle = [
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'rgba(0, 0, 0, 0.4)',
      width: 5,
    }),
  }),
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'yellow',
      width: 3,
    }),
  }),
];

let simplifiedLineStyle = [
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'white',
      width: 5,
    }),
  }),
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'rgba(0, 0, 0, 0.7)',
      width: 3,
    }),
  }),
];

let highlightedLineStyle = [
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'yellow',
      width: 9,
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

let elevationPointStyle = new ol.style.Style({
  image: new ol.style.Circle({
    radius: 5,
    fill: new ol.style.Fill({
      color: 'yellow',
    }),
    stroke: new ol.style.Stroke({
      color: 'red',
      width: 2,
    }),
  }),
});

export default {
  mixins: [layerMixin],
  data() {
    return {
      visibleSimplifiedLayer: false,
    };
  },
  computed: {
    features() {
      return Yetix.features;
    },
    featuresLength() {
      return Yetix.featuresLength;
    },
    validMinimumMapZoom() {
      return Yetix.VALID_MINIMUM_MAP_ZOOM;
    },
    drawingMode() {
      return Yetix.drawingMode;
    },
  },
  watch: {
    drawingMode() {
      if (!this.drawingMode) {
        this.disableInteractions();
      } else {
        this.enableInteractions();
      }
    },
  },
  mounted() {
    // features layer
    this.featuresLayer = new ol.layer.Vector({
      source: new ol.source.Vector(),
      style: normalLineStyle,
    });
    this.featuresLayerSource = this.featuresLayer.getSource();

    this.map.addLayer(this.featuresLayer);

    // simplified layer (preview)
    this.simplifiedLayer = new ol.layer.Vector({
      source: new ol.source.Vector(),
      style: simplifiedLineStyle,
    });
    // get source
    this.simplifiedSource = this.simplifiedLayer.getSource();
    // add layer, and hide it
    this.map.addLayer(this.simplifiedLayer);
    this.simplifiedLayer.setVisible(false);

    // layer for elevation point
    this.elevationPointLayer = new ol.layer.Vector({
      source: new ol.source.Vector(),
      style: elevationPointStyle,
    });
    // add layer, and hide it
    this.map.addLayer(this.elevationPointLayer);
    this.elevationPointLayer.setVisible(false);
    // add one feature for point
    const elevationPointSource = this.elevationPointLayer.getSource();
    this.elevationPoint = new ol.Feature();
    elevationPointSource.addFeature(this.elevationPoint);
    // react to event
    Yetix.$on('elevationProfile', this.onElevationProfile);

    // set default featuresTitle
    Yetix.setFeaturesTitle(this.$gettext(Yetix.featuresTitle));

    // load camptocamp document
    let doc = this.$route.params.document_id;
    let lang = this.$language.current;
    if (doc) {
      c2c['route'].getCooked(doc, lang).then(this.addFeaturesFromDocument);
    }

    // features events (added feature)
    this.featuresLayerSource.on('addfeature', this.onFeature);
    this.simplifiedSource.on('addfeature', this.onFeature);

    this.addInteractions();

    Yetix.$on('removeFeature', this.removeFeature);
    Yetix.$on('removeFeatures', this.removeFeatures);
    Yetix.$on('gpx', this.addFeaturesFromGpx);
    Yetix.$on('previewSimplify', this.previewSimplify);
    Yetix.$on('simplify', this.simplify);
  },
  methods: {
    addInteractions() {
      let source = this.featuresLayerSource;

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

      this.disableInteractions();
    },
    enableInteractions() {
      this.drawInteraction.setActive(true);
      this.modifyInteraction.setActive(true);
      this.snapInteraction.setActive(true);
    },
    disableInteractions() {
      this.drawInteraction.setActive(false);
      this.modifyInteraction.setActive(false);
      this.snapInteraction.setActive(false);
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
      this.updateFeaturesFromStore();
    },
    onKeyWhileDrawing(event) {
      event.preventDefault();
      // backspace key
      if (event.key === 'Backspace') {
        this.drawInteraction.removeLastPoint();
      }
    },
    onFeature(event) {
      // set features styles
      event.feature.set('highlightedStyle', highlightedLineStyle);
      // emit new features, only in normal case (drawing)
      // not in gpx/document case (prevent multiple update for each lines)
      if (!this.loadingExternalFeatures) {
        this.updateFeaturesFromStore();
      }
    },
    updateFeaturesFromStore() {
      // updates features
      let features = this.visibleSimplifiedLayer ? this.getSimplifiedFeatures() : this.getFeaturesLayerFeatures();
      Yetix.setFeatures(features);
      // update length
      let featuresLength = this.getFeaturesLayerFeatures()
        .map((feature) => {
          return feature.getGeometry().getCoordinates().length;
        })
        .reduce((acc, value) => acc + value, 0);
      Yetix.setFeaturesLength(featuresLength);

      if (features.length === 0) {
        // if user come from a document url, remove url
        if (this.$route.params.document_id) {
          this.$router.replace({ path: '/' + this.$route.name });
        }
      }
    },
    getFeaturesLayerFeatures() {
      return this.getSortedFeatures(this.featuresLayerSource.getFeatures());
    },
    getSimplifiedFeatures() {
      return this.getSortedFeatures(this.simplifiedSource.getFeatures());
    },
    getSortedFeatures(features) {
      return features.sort((a, b) => {
        return Number(a.ol_uid) > Number(b.ol_uid);
      });
    },
    removeFeature(feature) {
      // remove feature
      // when only one left, ask for user to confirm
      let toBeRemoved = !(
        this.featuresLayerSource.getFeatures().length === 1 && !confirm(this.$gettext('Confirm delete'))
      );
      if (toBeRemoved) {
        if (this.visibleSimplifiedLayer) {
          this.simplifiedSource.removeFeature(feature);
          // remove corresponding feature
          this.getFeaturesLayerFeatures().forEach((f) => {
            if (feature.get('id') === f.ol_uid) {
              this.featuresLayerSource.removeFeature(f);
            }
          });
        } else {
          this.featuresLayerSource.removeFeature(feature);
        }
        this.updateFeaturesFromStore();
      }
    },
    removeFeatures() {
      // clear both layers
      this.featuresLayerSource.clear();
      this.simplifiedSource.clear(true);
      // set default layer to be visible
      this.hideSimplifiedLayer();
      // update features
      this.updateFeaturesFromStore();
    },
    addFeaturesFromGpx(gpx) {
      // return if no gpx
      if (!gpx) {
        return;
      }
      // first, clear geometry
      this.featuresLayerSource.clear();

      // before reading gpx, set what we are doing
      this.loadingExternalFeatures = true;

      let gpxFormat = new ol.format.GPX();
      let features = gpxFormat.readFeatures(gpx, { featureProjection: 'EPSG:3857' });
      features.forEach(this.addFeature);
      // update store
      Yetix.setFeaturesTitle(this.getFeaturesTitleFromGpx(features));

      // gpx is loaded, go back to normal case
      this.loadingExternalFeatures = false;
      // and emit new features
      this.updateFeaturesFromStore();
      // fit map to new features
      this.fitMapToFeatures();
    },
    getFeaturesTitleFromGpx(features) {
      if (features && features.length) {
        let properties = features[0].getProperties();
        if (properties.name) {
          return properties.name;
        } else {
          return this.$gettext('GPX file');
        }
      }
    },
    addFeaturesFromDocument(doc) {
      // before reading document, set what we are doing
      this.loadingExternalFeatures = true;

      let documentGeometry = doc.data.geometry.geom_detail;
      let feature = new ol.format.GeoJSON().readFeature(documentGeometry);
      this.addFeature(feature);
      // update store
      Yetix.setFeaturesTitle(this.getFeaturesTitleFromDocument(doc));

      // document is loaded, go back to normal case
      this.loadingExternalFeatures = false;
      // and emit new features
      this.updateFeaturesFromStore();
      // fit map to new features
      this.fitMapToFeatures();
    },
    addFeature(feature) {
      // split multilinestrings into linestrings
      if (feature.getGeometry().getType() === 'MultiLineString') {
        let lines = feature.getGeometry().getLineStrings();
        lines.map((line) => new ol.Feature({ geometry: line })).forEach(this.addFeature);
      } else {
        let nbPointsOnFeature = feature.getGeometry().getCoordinates().length;
        if (nbPointsOnFeature >= 2) {
          this.featuresLayerSource.addFeature(feature);
        }
      }
    },
    getFeaturesTitleFromDocument(document) {
      return this.$documentUtils.getDocumentTitle(document.data);
    },
    fitMapToFeatures() {
      let extent = ol.extent.createEmpty();

      ol.extent.extend(extent, this.featuresLayerSource.getExtent());

      this.view.fit(extent, { size: this.map.getSize() });

      // set a minimum zoom level
      this.view.setZoom(Math.max(this.validMinimumMapZoom, this.view.getZoom()));
    },
    hideSimplifiedLayer() {
      this.featuresLayer.setVisible(true);
      this.simplifiedLayer.setVisible(false);
      this.visibleSimplifiedLayer = false;
    },
    showSimplifiedLayer() {
      this.featuresLayer.setVisible(false);
      this.simplifiedLayer.setVisible(true);
      this.visibleSimplifiedLayer = true;
    },
    previewSimplify(tolerance) {
      // every preview, clear the layer first
      this.simplifiedSource.clear(true);
      // show/hide layers based on tolerance
      if (tolerance === 0) {
        this.hideSimplifiedLayer();
      } else {
        this.showSimplifiedLayer();
        // get each features, simplify them, and add to simplified layer
        let features = this.getFeaturesLayerFeatures();
        features.forEach((feature) => {
          let geometry = feature.getGeometry();

          // clone geometry
          let simplifiedGeometry = geometry.clone();
          let coordinates = simplifiedGeometry.getCoordinates();

          // if no z, add 0
          coordinates = coordinates.map((coord) => {
            if (!coord[2]) {
              coord[2] = 0;
            }
            return coord;
          });

          // check if tolerance is 0 == no simplification
          if (tolerance !== 0) {
            coordinates = simplify(coordinates, tolerance, true);
            simplifiedGeometry.setCoordinates(coordinates);
          }

          // create feature (store reference of actual feature thanks to ol_uid)
          let simplifiedFeature = new ol.Feature({ geometry: simplifiedGeometry, id: feature.ol_uid });
          this.simplifiedSource.addFeature(simplifiedFeature);
        });
      }
      this.updateFeaturesFromStore();
    },
    simplify() {
      // clear features layer
      this.featuresLayerSource.clear();
      // get simplified features
      let simplifiedFeatures = this.getSimplifiedFeatures();
      // and move them one by one (to keep order of line chunks) in features layer
      simplifiedFeatures.forEach((feature) => {
        this.featuresLayerSource.addFeature(feature);
      });
      // hide simplified/show features
      this.hideSimplifiedLayer();
    },
    onElevationProfile(event, coord) {
      switch (event) {
        case 'cursor_move':
          this.elevationPointLayer.setVisible(true);
          this.elevationPoint.setGeometry(new ol.geom.Point(coord));
          break;
        case 'cursor_end':
          this.elevationPointLayer.setVisible(false);
          break;
      }
    },
  },
  render() {
    return null;
  },
};
</script>
