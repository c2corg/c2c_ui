<script>
import turfIntersect from '@turf/intersect';

import layerMixin from './layer';

import { state, mutations, actions, bus } from '@/components/yeti/yetix';
import ol from '@/js/libs/ol';

let mountainsStyle = (mapZoom) => {
  const MIN_ZOOM = 8;
  const MAX_ZOOM = 10;
  const MIN_OPACITY = 0;
  const MAX_OPACITY = 0.8;

  let opacity = MAX_OPACITY;
  let strokeWidth = 1;

  if (mapZoom) {
    // opacity should be
    // 0.8 (default)
    // gradually decreasing between min and max zooms
    // 0 when zoom is > max
    if (mapZoom >= MIN_ZOOM && mapZoom <= MAX_ZOOM) {
      opacity = (MAX_ZOOM - mapZoom) * (MAX_OPACITY / (MAX_ZOOM - MIN_ZOOM));
    } else if (mapZoom > MAX_ZOOM) {
      opacity = MIN_OPACITY;
    }

    // increase stroke when zoom > max
    if (mapZoom > MAX_ZOOM) {
      strokeWidth = 2;
    }
  }

  return new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'rgba(0, 0, 0, .85)',
      width: strokeWidth,
    }),
    fill: new ol.style.Fill({
      color: `rgba(255, 255, 255, ${opacity})`,
    }),
  });
};

let iconSize = 40;

let bulletinsIcon = (danger) => {
  let dangerFill = ['lightgreen', 'yellow', 'orange', 'orangered', 'red'];
  let svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 100 100">
      <path d="M5,50L50,5L95,50" fill="white" />
      <path d="M5,50L50,95L95,50" fill="${dangerFill[danger]}" />
      <path d="m50,0l50,50-50,50-50-50zv5L21,33l19-10L50,26l9-8L80,38l2-1L50,5M5,50L50,95L95,50" />
      <text x="50" y ="72" dominant-baseline="central" text-anchor="middle" font-family="sans-serif" font-size="40px" font-weight="bold">${danger}</text>
    </svg>
  `;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
};

let bulletinsStyle = (danger) => {
  return new ol.style.Style({
    image: new ol.style.Icon({
      src: bulletinsIcon(danger),
      size: [iconSize, iconSize],
    }),
  });
};

let mountainsLayer = new ol.layer.Vector({
  source: new ol.source.Vector(),
  style: mountainsStyle(),
});
let bulletinsLayer = new ol.layer.Vector({
  source: new ol.source.Vector(),
});
let mountainsLayerGroup = new ol.layer.Group({
  layers: [mountainsLayer, bulletinsLayer],
});

export default {
  mixins: [layerMixin],
  computed: {
    mapZoom() {
      return state.mapZoom;
    },
    showMountains() {
      return state.showMountains;
    },
    bulletinsLoaded() {
      return state.bulletinsLoaded;
    },
  },
  watch: {
    showMountains() {
      this.onShowMountains();
    },
  },
  mounted() {
    this.map.addLayer(mountainsLayerGroup);
    // layers are not visible on load
    mountainsLayerGroup.setVisible(false);

    // only on first mount, if mountains already loaded
    if (state.mountains.all.length === 0) {
      actions.fetchMountains().then(this.onMountainsResult);

      bus.$on('mapMoveEnd', this.onMapMoveEnd);
    }
  },
  methods: {
    onMountainsResult(data) {
      let mountainsFeatures = this.getFeaturesFromData(data);
      // TMP: filter only France for now
      mountainsFeatures = mountainsFeatures.filter((feature) => {
        return feature.get('country') === 'France';
      });

      // add to mountains layer
      mountainsLayer.getSource().addFeatures(mountainsFeatures);

      let mountains = this.getPropertiesFromFeatures(mountainsFeatures);
      mountains = this.sortMountainsByMassif(mountains);

      mutations.setAllMountains(mountains);

      this.setVisibleMountains();
    },
    sortMountainsByMassif(mountains) {
      // first, order mountains by massifs
      let sortedMountains = {};
      for (let i = 0; i < mountains.length; i++) {
        if (!sortedMountains[mountains[i].mountain]) {
          sortedMountains[mountains[i].mountain] = [];
        }
        sortedMountains[mountains[i].mountain].push(mountains[i]);
      }

      // then sort by massif
      mountains = Object.keys(sortedMountains)
        .sort()
        .reduce((obj, key) => {
          obj[key] = sortedMountains[key];
          return obj;
        }, {});

      // then sort mountains inside each massif
      let key = 'name';
      for (let i in mountains) {
        mountains[i].sort((a, b) => {
          if (a[key] < b[key]) return -1;
          if (a[key] > b[key]) return 1;
          return 0;
        });
      }

      return mountains;
    },
    setVisibleMountains() {
      let mapExtent = this.getExtent('EPSG:3857');
      // clone this.mountains first, with no reference
      let visibleMountains = Object.assign({}, state.mountains.all);

      // then filter if polygon isn’t in view
      for (let massif in visibleMountains) {
        visibleMountains[massif] = visibleMountains[massif].filter((mountain) => {
          let polygon = mountain.geometry;
          return polygon.intersectsExtent(mapExtent);
        });
        // unset massif if empty
        if (visibleMountains[massif].length === 0) {
          delete visibleMountains[massif];
        }
      }
      // set mountains in visible
      mutations.setVisibleMountains(visibleMountains);
    },
    updateMountainsStyle() {
      mountainsLayer.setStyle(mountainsStyle(this.mapZoom));
    },
    onMapMoveEnd() {
      // set visible mountains
      this.setVisibleMountains();
      this.updateMountainsStyle();
      this.updateBulletinsGeometry();
    },
    onShowMountains() {
      // first time, bulletins are not loaded yet
      if (!this.bulletinsLoaded) {
        mutations.setBulletinsLoaded(true);
        // so load them
        actions.fetchBulletins().then(this.onBulletinsResult);
      }
      // show mountains layer group if needed
      mountainsLayerGroup.setVisible(this.showMountains);
    },
    onBulletinsResult(data) {
      let bulletinsFeatures = data.data;
      let mountainsFeatures = mountainsLayer.getSource().getFeatures();

      bulletinsFeatures.zones.forEach((zone) => {
        mountainsFeatures.find((mountain) => {
          if (mountain.get('name') === zone.zone) {
            // tmp: generate danger
            let danger = String(Math.round(Math.random() * 4));

            let mountainGeometry = mountain.getGeometry();
            let mountainGeometryType = mountainGeometry.getType();

            let bulletinsGeometry = null;

            if (mountainGeometryType === 'Polygon') {
              bulletinsGeometry = mountainGeometry.getInteriorPoint();
            } else if (mountainGeometryType === 'MultiPolygon') {
              bulletinsGeometry = mountainGeometry.getInteriorPoints();
            }

            let bulletinsFeature = new ol.Feature({
              geometry: bulletinsGeometry,
              initialGeometry: bulletinsGeometry,
            });
            bulletinsLayer.getSource().addFeature(bulletinsFeature);

            bulletinsFeature.setStyle(bulletinsStyle(danger));

            mountain.setProperties({ bulletinsFeature });

            // break
            return true;
          }
        });
      });
      // update in case we're already zoomed in
      this.updateBulletinsGeometry();
    },
    updateBulletinsGeometry() {
      // return, if bulletins are not loaded
      if (!this.bulletinsLoaded) {
        return;
      }

      // if zoom > 10
      //   we will intersect every polygon with the map extent, and update geometry of avalanche bulletin icons (icons will always be visible, even when zoomed)
      // else
      //   we set geometry of all points to be the initial geometry (stored during the request)
      if (this.mapZoom > 10) {
        let mapExtent = this.getExtent('EPSG:3857');
        let mapExtentFeature = new ol.Feature(ol.geom.polygonFromExtent(mapExtent));

        let mountainsFeatures = mountainsLayer.getSource().getFeatures();

        mountainsFeatures.forEach((feature) => {
          let intersect = turfIntersect(
            new ol.format.GeoJSON().writeFeatureObject(feature),
            new ol.format.GeoJSON().writeFeatureObject(mapExtentFeature)
          );
          if (intersect) {
            let intersectFeature = new ol.format.GeoJSON().readFeature(intersect);

            let intersectGeometry = intersectFeature.getGeometry();
            let intersectType = intersectGeometry.getType();

            let newBulletinsFeature = null;
            if (intersectType === 'Polygon') {
              newBulletinsFeature = intersectFeature.getGeometry().getInteriorPoint();
            } else if (intersectType === 'MultiPolygon') {
              newBulletinsFeature = intersectFeature.getGeometry().getInteriorPoints();
            }

            let bulletinsFeature = feature.get('bulletinsFeature');
            if (bulletinsFeature) {
              bulletinsFeature.setGeometry(newBulletinsFeature);
            }
          }
        });
      } else {
        let bulletinsFeatures = bulletinsLayer.getSource().getFeatures();
        bulletinsFeatures.forEach((feature) => {
          feature.setGeometry(feature.get('initialGeometry'));
        });
      }
    },
  },
  render() {
    return null;
  },
};
</script>
