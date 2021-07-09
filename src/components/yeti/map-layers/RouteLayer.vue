<script>
import layerMixin from './layer';

import c2c from '@/js/apis/c2c';
import ol from '@/js/libs/ol';

const normalLineStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: 'green',
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
      color: 'white',
      width: 3,
    }),
    zIndex: 1,
  }),
];

export default {
  mixins: [layerMixin],
  inject: ['$yetix'],
  props: {
    active: {
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
    validMinZoom: {
      type: Number,
      required: true,
    },
  },
  watch: {
    active() {
      if (this.active) {
        this.drawInteraction.setActive(false);
        this.modifyInteraction.setActive(false);
        this.snapInteraction.setActive(false);
      } else {
        this.drawInteraction.setActive(true);
        this.modifyInteraction.setActive(true);
        this.snapInteraction.setActive(true);
      }
    },
    gpx() {
      if (this.gpx) {
        this.addFeaturesFromGpx(this.gpx);
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

    // load camptocamp document
    const doc = this.$route.params.document_id;
    const lang = this.$language.current;
    if (doc) {
      c2c['route'].getCooked(doc, lang).then(this.addFeaturesFromDocument);
    }

    // features events (added feature)
    this.featuresLayerSource.on('addfeature', this.onFeature);

    this.addInteractions();

    this.$yetix.$on('removeFeature', this.removeFeature);
    this.$yetix.$on('removeFeatures', this.removeFeatures);
  },
  methods: {
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

    onFeature(event) {
      // set features styles
      event.feature.set('highlightedStyle', highlightedLineStyle);
      // emit new features, only in normal case (drawing)
      // not in gpx/document case (prevent multiple update for each lines)
      if (!this.loadingExternalFeatures) {
        this.emitFeaturesEvent();
      }
    },

    emitFeaturesEvent() {
      // updates features
      const features = this.getFeaturesLayerFeatures();
      this.$yetix.$emit('features', features);

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
      this.featuresLayerSource.clear(true);
      this.emitFeaturesEvent();
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
      let featuresTitleFromSource = this.getFeaturesTitleFromGpx(features);
      this.$yetix.$emit('featuresTitle', featuresTitleFromSource);

      // gpx is loaded, go back to normal case
      this.loadingExternalFeatures = false;
      // and emit new features
      this.emitFeaturesEvent();
      // fit map to new features
      this.fitMapToFeatures();
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

    addFeaturesFromDocument(doc) {
      // before reading document, set what we are doing
      this.loadingExternalFeatures = true;

      const documentGeometry = doc.data.geometry.geom_detail;
      const feature = new ol.format.GeoJSON().readFeature(documentGeometry);
      this.addFeature(feature);
      let featuresTitleFromSource = this.getFeaturesTitleFromDocument(doc);
      this.$yetix.$emit('featuresTitle', featuresTitleFromSource);

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

    getFeaturesTitleFromDocument(document) {
      return this.$documentUtils.getDocumentTitle(document.data);
    },

    fitMapToFeatures() {
      let extent = ol.extent.createEmpty();

      ol.extent.extend(extent, this.featuresLayerSource.getExtent());

      this.view.fit(extent, { size: this.map.getSize() });

      // set a minimum zoom level
      this.view.setZoom(Math.max(this.validMinZoom, this.view.getZoom()));
    },
  },
  render() {
    return null;
  },
};
</script>
