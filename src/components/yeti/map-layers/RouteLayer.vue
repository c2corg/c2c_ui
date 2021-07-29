<script>
import layerMixin from './layer';

import { state, mutations, bus } from '@/components/yeti/yetix';
import c2c from '@/js/apis/c2c';
import ol from '@/js/libs/ol';

let normalLineStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: 'yellow',
    width: 3,
  }),
});

let highlightedLineStyle = [
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
  mixins: [layerMixin],
  props: {
    validMinZoom: {
      type: Number,
      required: true,
    },
  },
  computed: {
    activeTab() {
      return state.activeTab;
    },
    features() {
      return state.features;
    },
  },
  watch: {
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
  },
  mounted() {
    // features layer
    this.featuresLayer = new ol.layer.Vector({
      source: new ol.source.Vector(),
      style: normalLineStyle,
    });
    this.featuresLayerSource = this.featuresLayer.getSource();

    this.map.addLayer(this.featuresLayer);

    // set default featuresTitle
    mutations.setFeaturesTitle(this.$gettext(state.featuresTitle));

    // load camptocamp document
    let doc = this.$route.params.document_id;
    let lang = this.$language.current;
    if (doc) {
      c2c['route'].getCooked(doc, lang).then(this.addFeaturesFromDocument);
    }

    // features events (added feature)
    this.featuresLayerSource.on('addfeature', this.onFeature);

    this.addInteractions();

    bus.$on('removeFeature', this.removeFeature);
    bus.$on('removeFeatures', this.removeFeatures);
    bus.$on('gpx', this.addFeaturesFromGpx);
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
      let features = this.getFeaturesLayerFeatures();
      mutations.setFeatures(features);

      if (features.length === 0) {
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
        this.updateFeaturesFromStore();
      }
    },
    removeFeatures() {
      this.featuresLayerSource.clear(true);
      this.updateFeaturesFromStore();
    },
    addFeaturesFromGpx(gpx) {
      // return if no gpx
      if (!gpx) {
        return;
      }
      // first, clear geometry
      this.featuresLayerSource.clear(true);

      // before reading gpx, set what we are doing
      this.loadingExternalFeatures = true;

      let gpxFormat = new ol.format.GPX();
      let features = gpxFormat.readFeatures(gpx, { featureProjection: 'EPSG:3857' });
      features.map(this.addFeature);
      // update store
      mutations.setFeaturesTitle(this.getFeaturesTitleFromGpx(features));

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
      mutations.setFeaturesTitle(this.getFeaturesTitleFromDocument(doc));

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
        lines.map((line) => new ol.Feature({ geometry: line })).map(this.addFeature);
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
      this.view.setZoom(Math.max(this.validMinZoom, this.view.getZoom()));
    },
  },
  render() {
    return null;
  },
};
</script>
