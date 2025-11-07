<template>
  <div ref="drawInfoOverlay">
    <p><fa-icon icon="route" transform="shrink-3" /> {{ Number(drawInfo.distance).toLocaleString() }}&nbsp;m</p>
    <p><fa-icon icon="compass" transform="shrink-3" /> {{ drawInfo.bearing }}°</p>
  </div>
</template>

<script>
import { icon } from '@fortawesome/fontawesome-svg-core';

import layerMixin from './layer';
import simplify from './simplify';

import Yetix from '@/components/yeti/Yetix';
import c2c from '@/js/apis/c2c';
import ol from '@/js/libs/ol';

class SplitInteraction extends ol.interaction.Pointer {
  constructor(options) {
    super({
      handleDownEvent: (evt) => {
        if (evt.originalEvent.ctrlKey) {
          const map = evt.map;

          const feature = map.forEachFeatureAtPixel(
            evt.pixel,
            function (feature) {
              return feature;
            },
            {
              layerFilter: (layer) => {
                return layer === this.layer_;
              },
            }
          );

          if (feature) {
            this.feature_ = feature;
            this.coordinate_ = feature.getGeometry().getClosestPoint(evt.coordinate);

            // the split point is surely not on vertex, so find on which segment it is
            let coordinates = this.feature_.getGeometry().getCoordinates();
            let insertIndex = undefined;
            for (let i = 0; i < coordinates.length - 1; i++) {
              const [x1, y1] = coordinates[i];
              const [x2, y2] = coordinates[i + 1];
              if (this.pointOnSegment(this.coordinate_, [x1, y1], [x2, y2])) {
                insertIndex = i + 1;
                break;
              }
            }

            // then insert a new point on the segment before split
            // if insertindex is set (point on line)
            // and coord is not already a vertex
            // and coord is not the first point
            if (
              insertIndex !== undefined &&
              coordinates[insertIndex][0] !== this.coordinate_[0] &&
              coordinates[insertIndex][1] !== this.coordinate_[1] &&
              coordinates[0][0] !== this.coordinate_[0] &&
              coordinates[0][1] !== this.coordinate_[1]
            ) {
              coordinates.splice(insertIndex, 0, this.coordinate_);
            }

            // now, split feature and create an array for two splitted feature
            let sublines = [[], []];
            let i = 0;
            let splitDone = false;
            coordinates.forEach((coord) => {
              sublines[i].push(coord);
              // if point is less than one meter away = this is the split point
              if (
                !splitDone &&
                Math.abs(coord[0] - this.coordinate_[0]) < 1 &&
                Math.abs(coord[1] - this.coordinate_[1]) < 1
              ) {
                i = 1;
                sublines[i].push(coord);
                splitDone = true;
              }
            });
            this.dispatchEvent({
              type: 'split',
              oldFeature: feature,
              newFeatures: sublines.map((line) => new ol.Feature(new ol.geom.LineString(line))),
            });
          }

          return false;
        }
      },
    });

    this.layer_ = options.layer;
    this.coordinate_ = null;
    this.feature_ = null;
  }

  pointOnSegment(p, a, b, tol = 1e-3) {
    const cross = (p[1] - a[1]) * (b[0] - a[0]) - (p[0] - a[0]) * (b[1] - a[1]);
    if (Math.abs(cross) > tol) return false;
    const dot = (p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1]);
    if (dot < 0) return false;
    const sqLen = (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2;
    if (dot > sqLen) return false;
    return true;
  }
}

let angle = 60;
let pColor = `hsl(${angle}, 100%, 50%)`;
let pColorLight = `hsl(${angle}, 100%, 90%)`;
let pColorDark = `hsl(${angle}, 100%, 20%)`;
let pWidth = 5;

let normalLineStyle = [
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: pColorDark,
      width: pWidth + 2,
    }),
  }),
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: pColor,
      width: pWidth,
    }),
  }),
];

let normalWithEditLineStyle = [
  ...normalLineStyle,
  new ol.style.Style({
    image: new ol.style.Circle({
      radius: pWidth - 1,
      fill: new ol.style.Fill({
        color: pColorLight,
      }),
      stroke: new ol.style.Stroke({
        color: pColorDark,
        width: 2,
      }),
    }),
    geometry(feature) {
      let coords = feature
        .getGeometry()
        .getCoordinates()
        .map((c) => new ol.geom.Point(c));
      return new ol.geom.GeometryCollection(coords);
    },
  }),
];

let editStyle = [
  new ol.style.Style({
    image: new ol.style.Circle({
      radius: 6,
      fill: new ol.style.Fill({
        color: pColorDark,
      }),
      stroke: new ol.style.Stroke({
        color: 'white',
        width: 2,
      }),
    }),
  }),
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'white',
      width: pWidth + 1,
    }),
  }),
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: pColorDark,
      width: pWidth - 1,
    }),
  }),
];

let simplifiedLineStyle = [
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'white',
      width: pWidth + 2,
    }),
  }),
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'rgba(0, 0, 0, 0.7)',
      width: pWidth,
    }),
  }),
];

let highlightedLineStyle = [
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'hsla(60, 100%, 50%, 0.8)',
      width: 16,
    }),
    zIndex: 1,
  }),
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'hsl(28, 100%, 45%)',
      width: pWidth + 2,
    }),
    zIndex: 1,
  }),
  new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'hsl(28, 100%, 65%)',
      width: pWidth,
    }),
    zIndex: 1,
  }),
];

let elevationPointStyle = [
  new ol.style.Style({
    image: new ol.style.Circle({
      radius: pWidth + 1,
      fill: new ol.style.Fill({
        color: 'red',
      }),
      stroke: new ol.style.Stroke({
        color: 'white',
        width: 2,
      }),
    }),
  }),
];

let drawInfoOverlay = new ol.Overlay({
  offset: [10, -10],
  positioning: 'bottom-left',
  className: 'draw-info-overlay',
});

export default {
  mixins: [layerMixin],
  data() {
    return {
      visibleSimplifiedLayer: false,
      drawInfo: {
        distance: 0,
        bearing: 0,
        drawing: false,
      },
    };
  },
  computed: {
    features() {
      return Yetix.features;
    },
    featuresLength() {
      return Yetix.featuresLength;
    },
    mapZoom() {
      return Yetix.mapZoom;
    },
    zoomDelta() {
      return Yetix.ZOOM_DELTA;
    },
    validMinimumMapZoom() {
      return Yetix.VALID_MINIMUM_MAP_ZOOM;
    },
    editMode() {
      return Yetix.editMode;
    },
  },
  watch: {
    editMode() {
      if (!this.editMode) {
        this.disableInteractions();
        document.removeEventListener('keydown', this.onKeydown);
        document.removeEventListener('keyup', this.onKeyup);
      } else {
        this.enableInteractions();
        document.addEventListener('keydown', this.onKeydown);
        document.addEventListener('keyup', this.onKeyup);
      }
      this.updateEditStyle();
    },
    mapZoom() {
      this.updateEditStyle();
    },
  },
  mounted() {
    // features layer
    this.featuresLayer = new ol.layer.Vector({
      name: 'routeLayer',
      source: new ol.source.Vector(),
      style: normalLineStyle,
    });
    this.featuresLayerSource = this.featuresLayer.getSource();

    this.map.addLayer(this.featuresLayer);

    // draw info overlay
    drawInfoOverlay.setElement(this.$refs.drawInfoOverlay);
    this.map.addOverlay(drawInfoOverlay);

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
    this.defaultFeaturesTitle = this.$gettext(Yetix.featuresTitle);
    Yetix.setFeaturesTitle(this.defaultFeaturesTitle);

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

    Yetix.$on('addFeature', this.addFeature);
    Yetix.$on('removeFeature', this.removeFeature);
    Yetix.$on('removeFeatures', this.removeFeatures);
    Yetix.$on('gpx', this.addFeaturesFromGpx);
    Yetix.$on('previewSimplify', this.previewSimplify);
    Yetix.$on('simplify', this.simplify);
    Yetix.$on('featureUpdated', this.updateFeaturesFromStore);
    Yetix.$on('fit-map-to-features', this.fitMapToFeatures);

    // special event when window loose focus = hanfle ctrl key (when browser shorcuts) for split interaction
    window.addEventListener('blur', () => this.onKeyup({ key: 'Control', altKey: false }));

    // already features to add?
    // but not a c2c document
    if (!doc && this.features.length) {
      this.featuresLayerSource.addFeatures(this.features);
    }
  },
  methods: {
    getLayer() {
      return this.featuresLayer;
    },
    addInteractions() {
      let source = this.featuresLayerSource;

      this.modifyInteraction = new ol.interaction.Modify({
        source,
        style: editStyle,
      });
      this.map.addInteraction(this.modifyInteraction);

      this.drawInteraction = new ol.interaction.Draw({
        source,
        type: 'LineString',
        style: editStyle,
        geometryFunction: (coords, geom) => {
          if (!geom) {
            geom = new ol.geom.LineString([]);
          }

          if (coords.length <= 1) {
            drawInfoOverlay.setPosition(undefined);
          }

          // get 2 last points
          if (coords.length >= 2) {
            geom.setCoordinates(coords);

            let geomCoords = geom.getCoordinates();
            let point1 = geomCoords[geomCoords.length - 2];
            let point2 = geomCoords[geomCoords.length - 1];
            let distance = ol.sphere.getDistance(ol.proj.toLonLat(point1), ol.proj.toLonLat(point2));

            let lon1 = (ol.proj.toLonLat(point1)[0] * Math.PI) / 180;
            let lon2 = (ol.proj.toLonLat(point2)[0] * Math.PI) / 180;
            let lat1 = (ol.proj.toLonLat(point1)[1] * Math.PI) / 180;
            let lat2 = (ol.proj.toLonLat(point2)[1] * Math.PI) / 180;
            let a = Math.sin(lon2 - lon1) * Math.cos(lat2);
            let b = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);

            let angle = Math.atan2(a, b);
            let bearing = ((angle * 180) / Math.PI + 360) % 360;

            if (distance > 0) {
              this.drawInfo.distance = Math.round(distance);
              this.drawInfo.bearing = Math.round(bearing);
            } else {
              this.drawInfo.distance = 0;
              this.drawInfo.bearing = 0;
            }
            drawInfoOverlay.setPosition(geomCoords[geomCoords.length - 1]);
          }

          return geom;
        },
      });
      this.map.addInteraction(this.drawInteraction);

      this.splitInteraction = new SplitInteraction({
        layer: this.featuresLayer,
      });
      this.map.addInteraction(this.splitInteraction);

      this.snapInteraction = new ol.interaction.Snap({ source });
      this.map.addInteraction(this.snapInteraction);

      this.drawInteraction.on('drawstart', this.onDrawStart);
      this.drawInteraction.on('drawend', this.onDrawEnd);
      this.modifyInteraction.on('modifyend', this.onModifyEnd);
      this.splitInteraction.on('split', this.onSplit);

      this.disableInteractions();
    },
    enableInteractions() {
      this.drawInteraction.setActive(true);
      this.modifyInteraction.setActive(true);
      this.splitInteraction.setActive(true);
      this.snapInteraction.setActive(true);
    },
    disableInteractions() {
      this.drawInteraction.setActive(false);
      this.modifyInteraction.setActive(false);
      this.splitInteraction.setActive(false);
      this.snapInteraction.setActive(false);

      // hide draw info overlay
      drawInfoOverlay.setPosition(undefined);
    },
    onDrawStart() {
      this.drawing = true;
      document.addEventListener('keydown', this.onKeyWhileDrawing);
      document.addEventListener('keypress', this.onKeyWhileDrawing);
    },
    onDrawEnd() {
      this.drawing = false;
      document.removeEventListener('keydown', this.onKeyWhileDrawing);
      document.removeEventListener('keypress', this.onKeyWhileDrawing);

      // hide draw info overlay
      drawInfoOverlay.setPosition(undefined);
    },
    onModifyEnd() {
      this.updateFeaturesFromStore();
    },
    onSplit(evt) {
      evt.newFeatures.forEach(this.addFeature);
      this.removeFeature(evt.oldFeature);
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
      // emit new features, only in normal case (edit/drawing)
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
        // set featuresTitle back to default
        Yetix.setFeaturesTitle(this.defaultFeaturesTitle);
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
      if (documentGeometry) {
        let feature = new ol.format.GeoJSON().readFeature(documentGeometry);
        this.addFeature(feature);
        // fit map to new features
        this.fitMapToFeatures();
      } else {
        // fit map to geom
        this.fitMapToGeom(doc.data.geometry.geom);
      }
      // update store
      Yetix.setFeaturesTitle(this.getFeaturesTitleFromDocument(doc));
      // document is loaded, go back to normal case
      this.loadingExternalFeatures = false;
      // and emit new features
      this.updateFeaturesFromStore();
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

      let actualZoom = Math.round(new ol.View().getZoomForResolution(this.map.getView().getResolution()) * 10) / 10;
      // set a minimum zoom level
      this.view.setZoom(Math.max(this.validMinimumMapZoom, actualZoom) / this.zoomDelta);
    },
    fitMapToGeom(geom) {
      let feature = new ol.format.GeoJSON().readFeature(geom);
      let geometry = feature.getGeometry().getExtent();
      this.view.fit(geometry, { size: this.map.getSize() });
      this.view.setZoom(this.validMinimumMapZoom / this.zoomDelta);
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
    updateEditStyle() {
      this.featuresLayer.setStyle(
        this.editMode && this.mapZoom >= this.validMinimumMapZoom ? normalWithEditLineStyle : normalLineStyle
      );
    },
    onKeydown(evt) {
      // not when drawing
      if (this.drawing) {
        return false;
      }
      // not when both alt+ctrl
      if (evt.ctrlKey && evt.altKey) {
        return false;
      }
      // which key?
      let tip = null;
      let svgSource = null;
      if (evt.ctrlKey) {
        tip = this.$gettext('Split line');
        svgSource = icon({ prefix: 'fas', iconName: 'scissors' }).html[0];
      }
      if (evt.altKey) {
        tip = this.$gettext('Add or remove point');
        svgSource = icon({ prefix: 'fas', iconName: 'plus-minus' }).html[0];
      }

      // add new icon in editstyle, only if length is 3
      if (tip && editStyle.length === 3) {
        svgSource = svgSource.replace('<svg', '<svg width="10" height="10"');
        svgSource = svgSource.replace('fill="currentColor"', `fill="white" stroke="${pColorDark}" stroke-width="5"`);
        editStyle.splice(
          1,
          0,
          new ol.style.Style({
            image: new ol.style.Icon({
              src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgSource),
              size: [10, 10],
            }),
          })
        );
        editStyle[0].getImage().setRadius(10);
        editStyle[0].setText(
          new ol.style.Text({
            text: tip,
            textAlign: 'left',
            offsetX: 20,
            offsetY: 0,
            padding: [5, 5, 5, 5],
            fill: new ol.style.Fill({
              color: 'white',
            }),
            backgroundFill: new ol.style.Fill({
              color: pColorDark,
            }),
          })
        );
        this.drawInteraction.getOverlay().setStyle(editStyle);
        this.modifyInteraction.getOverlay().setStyle(editStyle);
      }
    },
    onKeyup(evt) {
      // remove specific icon
      // only when alt or ctrl, but not both, and icon is already in editstyle
      if (((evt.key === 'Alt' && !evt.ctrlKey) || (evt.key === 'Control' && !evt.altKey)) && editStyle.length === 4) {
        editStyle.splice(1, 1);
        editStyle[0].getImage().setRadius(6);
        editStyle[0].setText(
          new ol.style.Text({
            text: null,
          })
        );
        this.drawInteraction.getOverlay().setStyle(editStyle);
        this.modifyInteraction.getOverlay().setStyle(editStyle);
      }
    },
  },
  render() {
    return null;
  },
};
</script>

<style>
.draw-info-overlay {
  background: yellow;
  padding: 2px;
  border-radius: 2px;
  font-size: 0.85rem;
  min-width: 60px;
}
</style>
