<template>
  <div ref="bulletinsOverlay" class="bulletins-overlay">
    <button class="delete is-small button-close" @click="closeOverlay">x</button>
    <div class="bulletins-header pt-5 pb-3 has-text-centered">
      <p class="title is-5">{{ overlayData.mountainName }}</p>
    </div>
    <div v-if="overlayData.danger.low" class="py-2">
      <p class="is-size-7 px-3 pb-5 bulletins-date">
        <strong v-translate>Validity date:</strong> {{ overlayValidUntil }}
      </p>
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
              :y="overlayData.danger.high ? 82 : 65"
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
              <text x="50" y="54" text-anchor="middle" font-family="sans-serif" font-size="20px" font-weight="bold">
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
      <dl v-if="overlayDangerComment || overlayOrientationsComment" class="is-size-6 px-3 pt-3">
        <div v-if="overlayDangerComment">
          <dt v-translate>Danger:</dt>
          <dd>{{ overlayDangerComment }}</dd>
        </div>
        <div v-if="overlayOrientationsComment">
          <dt v-translate>Orientations:</dt>
          <dd>{{ overlayOrientationsComment }}</dd>
        </div>
      </dl>
    </div>
    <div v-else class="py-2">
      <p class="is-size-6 p-3"><span v-translate>No avalanche bulletin right now</span></p>
    </div>
    <p class="is-size-7 px-3 pt-2 pb-2 bulletins-footer">
      <strong v-translate>Full bulletin:</strong>
      <span v-for="(url, i) in overlayData.urls" :key="i" class="pl-1">
        <a :href="url.url" target="_blank"><fa-icon icon="external-link-alt" /> {{ url.title }}</a>
      </span>
    </p>
    <img :src="overlayDangerIcon" alt="" class="bulletins-overlay-danger-icon" />
  </div>
</template>
<script>
import turfIntersect from '@turf/intersect';
import { format } from 'date-fns';

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

let iconSize = 80;

let bulletinsIcon = (danger) => {
  danger = danger || 0;

  let dangerFill = ['#999', '#cbdb45', '#fff100', '#f6921e', '#ec1c24', '#ec1c24'];

  let svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="-50 0 200 100">
      <path d="M5,50L50,5L95,50" fill="white" />
      <path d="M5,50L50,95L95,50" fill="${dangerFill[danger]}" />
      <path d="m50,0l50,50-50,50-50-50zv5L21,33l19-10L50,26l9-8L80,38l2-1L50,5M5,50L50,95L95,50" />
  `;

  if (danger !== 0) {
    svg += `
      <text x="50" y="83" text-anchor="middle" font-family="sans-serif" font-size="40px" font-weight="bold">${danger}</text>
    `;
  } else {
    svg += `
      <g stroke-width="5" stroke="black">
        <line x1="40" x2="60" y1="58" y2="78" />
        <line x1="40" x2="60" y1="78" y2="58" />
      </g>
    `;
  }

  if (danger === 2) {
    svg += `
      <path d="M86,45a7,7,0,106.5-13.5a7,7,0,00-10.5-8a5.4,5.4,0,00-10.2,3" />
      <path d="M69,27L86,44a5,5,0,104-12a5,5,0,10-9-5a3,3,0,10-8,0" fill="white" />
      <path d="M85,32a1,1,0,110,8v-2a1,1,0,100-4" />
    `;
  } else if (danger === 3) {
    svg += `
      <path d="M54,22L79,50h33a5,5,0,10-4-22.3a11.3,11.3,0,00-20,0q-8-2,-14,6" />
      <path d="M55,21L82,48h30a5,5,0,10-5-18a9.7,9.7,0,00-18,0q-7-2,-11,3L60,16" fill="white" />
      <path d="M59,18l25,25-1.5,1.5-25-25M87,38a1,1,0,1110,5l-2-1a1,1,0,10-6-3" />
    `;
  } else if (danger === 4 || danger === 5) {
    svg += `
      <path d="M54,22L79,50h52a12.5,12.5,0,001.5-24.4a7,7,0,00-8.2-7a11.9,11.9,0,00-22.5-2q-11-1,-14,7q-10-2-14,4" />
      <path d="M52,24L77,48h50a5,5,0,103-21a5,5,0,00-7-6a10.3,10.3,0,00-20-2q-11-2,-14,7q-10-3-14,4L60,16" fill="white" />
      <path d="M59,18l25,25-1.5,1.5-25-25m-1.5,1.5l22.5,22.5-1.5,1.5-22.5-22.5M87,38a1,1,0,1110,5l-2-1a1,1,0,10-6-3M96,29a1,1,0,1115,14l-1.7-1.7A1,1,0,1097.7,30.7" />
    `;
  }

  svg += '</svg>';

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
let bulletinsOverlay = new ol.Overlay({
  positioning: 'top-center',
  offset: [0, 0],
  className: 'bulletins-overlay-container',
});
let bulletinsOverlayPanOptions = {
  animation: {
    duration: 250,
  },
  margin: 10,
};

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
      panIntoView: false,
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
      return format(new Date(this.overlayData.validUntil), 'dd/MM/yyyy HH:mm');
    },
    overlayDangerIcon() {
      return bulletinsIcon(this.overlayData.danger.max);
    },
    overlayDangerComment() {
      return this.overlayData.danger.low ? this.overlayData.danger.comment : null;
    },
    overlayOrientationsComment() {
      return this.overlayData.orientations.comment;
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

      // no update if overlay is animating into view when opens
      // = prevent overlay from moving
      if (this.panIntoView) {
        this.panIntoView = false;
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
        this.openOverlay(closestPointCoordinate, true);
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
        this.closeOverlay();
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
        this.openOverlay(activePoint.getCoordinates());
      } else {
        this.closeOverlay();
      }
    },
    openOverlay(coordinates, panIntoView = false) {
      bulletinsOverlay.setPosition(coordinates);

      if (panIntoView) {
        this.panIntoView = true;
        bulletinsOverlay.panIntoView(bulletinsOverlayPanOptions);
      }
    },
    closeOverlay() {
      bulletinsOverlay.setPosition(undefined);
      this.activeBulletins = null;
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
  box-shadow: 0 0 3px rgba($black, 0.5), 0 3px 8px rgba($black, 0.5);
  overflow: hidden;
}
.bulletins-header {
  background: $primary;
}
.bulletins-header * {
  color: white;
}
.bulletins-footer {
  background: $grey-lighter;
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
.bulletins-date {
  opacity: 0.75;
}
dt,
dd {
  display: inline;
}
dt {
  font-weight: bold;
}
.button-close {
  position: absolute;
  top: 4px;
  right: 4px;
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
