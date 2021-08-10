<template>
  <div ref="bulletinsOverlay" class="bulletins-overlay">
    <div class="bulletins-header pt-5 pb-3 has-text-centered">
      <p class="title is-5">{{ overlayData.mountainName }}</p>
    </div>
    <div v-if="overlayData.danger.low">
      <p class="is-size-7 px-3 pt-1 pb-3 bulletins-date">{{ overlayValidUntil }}</p>
      <div class="is-flex is-justify-content-space-around is-align-items-center px-3">
        <div>
          <svg
            :viewBox="overlayData.danger.altitude ? '0 0 150 100' : '0 0 100 100'"
            :width="overlayData.danger.altitude ? 120 : 80"
            height="80"
          >
            <polygon
              style="fill: none; stroke: #000; stroke-miterlimit: 10; stroke-width: 1.5"
              points="2.2,89.5 97.5,89.5 62.7,11.9 48,32.9 31.8,25.5 "
            />
            <text
              x="50"
              :y="overlayData.danger.high ? 75 : 58"
              dominant-baseline="central"
              text-anchor="middle"
              font-family="sans-serif"
              font-size="20px"
              font-weight="bold"
            >
              <tspan>{{ overlayData.danger.low }}</tspan>
              <tspan v-if="overlayData.danger.lowEvol">&ensp;</tspan>
              <tspan v-if="overlayData.danger.lowEvol">{{ overlayData.danger.lowEvol }}</tspan>
            </text>
            <g v-if="overlayData.danger.lowEvol" style="fill: none; stroke: #000; stroke-width: 2">
              <line x1="45" x2="55" :y1="overlayData.danger.high ? 75 : 58" :y2="overlayData.danger.high ? 75 : 58" />
              <line x1="50" x2="55" :y1="overlayData.danger.high ? 70 : 53" :y2="overlayData.danger.high ? 75 : 58" />
              <line x1="50" x2="55" :y1="overlayData.danger.high ? 80 : 63" :y2="overlayData.danger.high ? 75 : 58" />
            </g>
            <g v-show="overlayData.danger.high">
              <line
                style="fill: none; stroke: #000; stroke-miterlimit: 10; stroke-width: 1.5"
                x1="10"
                y1="61.5"
                x2="90"
                y2="61.5"
              />
              <text
                x="50"
                y="46"
                dominant-baseline="central"
                text-anchor="middle"
                font-family="sans-serif"
                font-size="20px"
                font-weight="bold"
              >
                <tspan>{{ overlayData.danger.high }}</tspan>
                <tspan v-if="overlayData.danger.highEvol">&ensp;</tspan>
                <tspan v-if="overlayData.danger.highEvol">{{ overlayData.danger.highEvol }}</tspan>
              </text>
              <g v-if="overlayData.danger.highEvol" style="fill: none; stroke: #000; stroke-width: 2">
                <line x1="45" x2="55" y1="46" y2="46" />
                <line x1="50" x2="55" y1="41" y2="46" />
                <line x1="50" x2="55" y1="51" y2="46" />
              </g>
            </g>
            <text
              v-if="overlayData.danger.altitude"
              x="92"
              y="65"
              font-family="sans-serif"
              font-size="16px"
              font-weight="bold"
            >
              {{ overlayData.danger.altitude }}m
            </text>
          </svg>
        </div>
        <input-orientation :value="overlayOrientations" />
      </div>
    </div>
    <div v-else>
      <p class="is-size-6 p-3"><span v-translate>No avalanche bulletin right now</span></p>
    </div>
    <p v-if="overlayData.danger.low && overlayData.danger.comment" class="is-size-6 px-3 pt-3">
      <strong v-translate>Danger</strong> {{ overlayData.danger.comment }}
    </p>
    <p v-if="overlayData.orientations.comment" class="is-size-6 px-3 pb-3">
      <strong v-translate>Orientations</strong> {{ overlayData.orientations.comment }}
    </p>
    <div class="p-3">
      <ul class="">
        <li v-for="(url, i) in overlayData.urls" :key="i" class="mr-5 is-size-7">
          <a :href="url.url" target="_blank"><fa-icon icon="external-link-alt" /> {{ url.title }}</a>
        </li>
      </ul>
    </div>
    <img :src="overlayDangerIcon" alt="" class="bulletins-overlay-danger-icon" />
  </div>
</template>
<script>
import turfIntersect from '@turf/intersect';
import { format } from 'date-fns';

import layerMixin from './layer';

import iconBulletinSvg from '@/assets/img/yeti/icons-bulletins.svg';
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

let iconSize = 80;

let bulletinsIcon = (danger) => {
  danger = danger || 0;
  return iconBulletinSvg + '#danger' + danger;
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
let bulletinsOverlay = new ol.Overlay({
  positioning: 'top-center',
  offset: [0, 0],
  className: 'bulletins-overlay-container',
});

export default {
  mixins: [layerMixin],
  data() {
    return {
      overlayData: {
        mountainName: null,
        validUntil: null,
        danger: {},
        orientations: [],
        urls: [],
      },
    };
  },
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
    overlayOrientations() {
      // return truthy orientations, in uppercase
      return Object.keys(this.overlayData.orientations)
        .filter((key) => key !== 'comment')
        .filter((key) => this.overlayData.orientations[key])
        .map((val) => val.toUpperCase());
    },
    overlayValidUntil() {
      return format(new Date(this.overlayData.validUntil), 'dd/MM/yyyy HH:mm:ss');
    },
    overlayDangerIcon() {
      return bulletinsIcon(this.overlayData.danger.max);
    },
  },
  watch: {
    showMountains() {
      this.onShowMountains();
    },
  },
  mounted() {
    // data
    this.activeBulletins = null;

    // bulletins overlay
    bulletinsOverlay.setElement(this.$refs.bulletinsOverlay);
    this.map.addOverlay(bulletinsOverlay);

    this.map.addLayer(mountainsLayerGroup);
    // layers are not visible on load
    mountainsLayerGroup.setVisible(false);

    // only on first mount, if mountains already loaded
    if (state.mountains.all.length === 0) {
      actions.fetchMountains().then(this.onMountainsResult);

      bus.$on('mapMoveEnd', this.onMapMoveEnd);
      bus.$on('mapClick', this.onMapClick);
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

      if (this.showMountains) {
        this.updateMountainsStyle();
        this.updateBulletinsGeometry();
      }
    },
    onMapClick(evt) {
      // this will set bulletins overlay, only when showmountains is true
      if (this.showMountains) {
        this.setBulletinsOverlay(evt);
      }
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
      // update styles
      this.updateMountainsStyle();
      this.updateBulletinsGeometry();
    },
    onBulletinsResult(data) {
      let bulletinsFeatures = data.data;
      let mountainsFeatures = mountainsLayer.getSource().getFeatures();

      bulletinsFeatures.zones.forEach((zone) => {
        mountainsFeatures.find((mountain) => {
          if (mountain.get('name') === zone.zone) {
            let mountainGeometry = mountain.getGeometry();
            let mountainGeometryType = mountainGeometry.getType();

            let bulletinsGeometry = null;

            if (mountainGeometryType === 'MultiPolygon') {
              bulletinsGeometry = mountainGeometry.getInteriorPoints();
            } else {
              throw new Error('Mountain geometry have to be MultiPolygon.');
            }

            // create feature (bulletin icons)
            // geometry have to be MultiPoint
            let bulletinsFeature = new ol.Feature({
              geometry: bulletinsGeometry,
              initialGeometry: bulletinsGeometry,
              overlayData: {
                mountainName: mountain.get('name'),
                validUntil: zone.validUntil,
                danger: zone.danger,
                orientations: zone.orientations,
                urls: mountain.get('urls'),
              },
            });
            bulletinsLayer.getSource().addFeature(bulletinsFeature);

            bulletinsFeature.setStyle(bulletinsStyle(zone.danger.max));

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

            // if polygon, should be MultiPolygon
            if (intersectType === 'Polygon') {
              intersectFeature = new ol.Feature({
                geometry: new ol.geom.MultiPolygon([intersectGeometry]),
              });
            }

            let newBulletinsFeature = intersectFeature.getGeometry().getInteriorPoints();

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

      // update bulletin overlay
      this.updateBulletinsOverlay();
    },
    setBulletinsOverlay(evt) {
      // first, get all features from bulletins layer where clicked
      let clickedBulletinFeatures = this.map.getFeaturesAtPixel(evt.pixel, {
        layerFilter: function (layer) {
          return layer === bulletinsLayer;
        },
      });
      let clickedBulletinFeature = clickedBulletinFeatures.length ? clickedBulletinFeatures[0] : undefined;
      // if a feature is found
      if (clickedBulletinFeature) {
        // set mountain name
        this.overlayData = clickedBulletinFeature.get('overlayData');
        // find the closest point (because it's a MultiPoint)
        let closestPointCoordinate = clickedBulletinFeature.getGeometry().getClosestPoint(evt.coordinate);
        // set overlay position
        bulletinsOverlay.setPosition(closestPointCoordinate);
        // store this point
        this.activeBulletins = {
          feature: clickedBulletinFeature,
        };
        // if there are more than one point in multipoint
        // find the closest one and store index too
        let points = clickedBulletinFeature.getGeometry().getPoints();
        if (points.length > 1) {
          points.forEach((point, index) => {
            if (point.getCoordinates().every((coord, i) => coord === closestPointCoordinate[i])) {
              this.activeBulletins.index = index;
            }
          });
        }
      } else {
        // remove when no feature found (click on map)
        bulletinsOverlay.setPosition(undefined);
        this.activeBulletins = null;
      }
    },
    updateBulletinsOverlay() {
      if (this.activeBulletins && this.showMountains) {
        let activeFeature = this.activeBulletins.feature;
        let activeIndex = this.activeBulletins.index || 0;
        // try to get point
        let activePoint = activeFeature.getGeometry().getPoint(activeIndex);
        if (!activePoint) {
          activePoint = activeFeature.getGeometry().getPoint(0);
        }
        bulletinsOverlay.setPosition(activePoint.getCoordinates());
      } else {
        bulletinsOverlay.setPosition(undefined);
      }
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables.scss';

.bulletins-overlay {
  width: 250px;
  max-width: 100%;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 3px rgba($black, 0.5), 0 3px 8px rgba($black, 0.5);
  overflow: hidden;
}
.bulletins-header {
  background: $grey-lighter;
}
.bulletins-date {
  opacity: 0.75;
}
.bulletins-overlay-danger-icon {
  position: absolute;
  top: -40px; /* iconSize / 2 */
  left: 0;
  right: 0;
  margin: auto;
  z-index: 2;
  pointer-events: none;
}
strong {
  color: #4a4a4a;
}
</style>

<style lang="scss">
/* Not scoped styles */
.yeti-app {
  .bulletins-overlay-container {
    max-width: 90%;
  }
  .bulletins-overlay {
    .input-orientation {
      width: 70px;
      height: 70px;
    }
  }
}
</style>
